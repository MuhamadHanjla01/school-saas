const prisma = require('../prismaClient');

const ADMIN_ROLES = ['SchoolAdmin', 'SuperAdmin'];
const STAFF_ROLES = [...ADMIN_ROLES, 'Teacher', 'Staff'];
const SCHOOL_ROLES = [...STAFF_ROLES, 'Student', 'Parent'];
const safeUserSelect = { id: true, email: true, name: true, phone: true, avatar: true, role: true };
const noProfileId = '__no_linked_profile__';

function studentScope(req) {
  return req.user.role === 'Student' ? { studentId: req.user.studentId || noProfileId } : {};
}
function classScope(req) {
  return req.user.role === 'Student' ? { classId: req.user.classId || noProfileId } : {};
}
function fail(message, status = 400) { const error = new Error(message); error.status = status; throw error; }

async function requireRecord(req, model, id) {
  if (typeof id !== 'string' || !id.trim()) fail('Invalid record identifier');
  const record = await prisma[model].findFirst({ where: { id, schoolId: req.schoolId } });
  if (!record) fail('Record not found in this school', 404);
  if (req.user.role === 'Student' && model === 'student' && id !== req.user.studentId) fail('Access denied', 403);
  if (req.user.role === 'Student' && model === 'class' && id !== req.user.classId) fail('Access denied', 403);
  if (model === 'user' && record.role === 'SuperAdmin' && req.user.role !== 'SuperAdmin') fail('Access denied', 403);
  if (model === 'user' && record.id === req.user.userId && req.body?.role && req.body.role !== record.role) fail('Cannot change your own role', 409);
  if (model === 'user' && record.role === 'SuperAdmin') fail('Manage platform accounts in platform administration', 403);
  if (model === 'assignment' && req.user.role === 'Teacher' && !['GET', 'HEAD'].includes(req.method) && record.teacherId !== req.user.teacherId) fail('Only the assigned teacher can modify this assignment', 403);
  return record;
}

// Validate linked IDs before writes; filtering only a row's schoolId does not
// prevent a caller from attaching that row to another school's student/class.
async function validateReferences(req) {
  const body = req.body || {};
  const map = { classId: 'class', classTeacherId: 'teacher', teacherId: 'teacher', subjectId: 'subject', studentId: 'student', parentId: 'parent', receiverId: 'user', senderId: 'user' };
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string' && value.length > (['content', 'description', 'notes', 'about'].includes(key) ? 20000 : 1000)) fail(`${key} is too long`);
  }
  for (const key of ['quantity', 'capacity', 'enrolled']) if (body[key] !== undefined && (!Number.isInteger(Number(body[key])) || Number(body[key]) < 0)) fail(`${key} must be a non-negative integer`);
  const records = {};
  for (const [key, model] of Object.entries(map)) {
    // These are human-readable registry IDs on the profile itself, not links.
    if (req.securityModel === model && ['student', 'parent'].includes(model)) continue;
    if (body[key] !== undefined && body[key] !== null && body[key] !== '') records[key] = await requireRecord(req, model, body[key]);
  }
  if (body.classIds !== undefined) {
    if (!Array.isArray(body.classIds) || body.classIds.length > 200) fail('classIds must be an array of at most 200 classes');
    for (const id of new Set(body.classIds)) await requireRecord(req, 'class', id);
  }
  for (const key of ['records', 'marks']) {
    if (body[key] !== undefined) {
      if (!Array.isArray(body[key]) || body[key].length > 1000) fail(`${key} must be an array of at most 1000 records`);
      for (const item of body[key]) {
        if (!item || typeof item !== 'object' || !item.studentId) fail('Each record requires a studentId');
        const student = await requireRecord(req, 'student', item.studentId);
        if (body.classId && student.classId !== body.classId) fail('Student is not enrolled in this class');
        if (key === 'records' && !['Present', 'Absent', 'Late', 'Excused'].includes(item.status)) fail('Invalid attendance status');
        if (key === 'marks') {
          const subject = await requireRecord(req, 'subject', item.subjectId);
          if (subject.classId && subject.classId !== student.classId) fail('Subject is not assigned to this student class');
          if (req.user.role === 'Teacher' && subject.teacherId !== req.user.teacherId) fail('You are not assigned to this subject', 403);
          const max = item.maxMarks ?? 100;
          if (typeof item.marks !== 'number' || !Number.isFinite(item.marks) || typeof max !== 'number' || !Number.isFinite(max) || max <= 0 || item.marks < 0 || item.marks > max) fail('Marks must be between zero and maxMarks');
        }
      }
    }
  }
  if (records.subjectId?.classId && body.classId && records.subjectId.classId !== body.classId) fail('Subject does not belong to the selected class');
  for (const key of ['date', 'dueDate', 'dob', 'admissionDate', 'joiningDate', 'startDate', 'endDate', 'lastCheckup', 'issueDate']) {
    if (body[key] && (typeof body[key] !== 'string' || Number.isNaN(new Date(body[key]).getTime()))) fail(`Invalid ${key}`);
  }
  if (body.startDate && body.endDate && new Date(body.endDate) < new Date(body.startDate)) fail('End date must not be before start date');
  for (const key of ['password', 'newPassword']) {
    if (body[key] !== undefined && body[key] !== '' && (typeof body[key] !== 'string' || body[key].length < 8 || Buffer.byteLength(body[key], 'utf8') > 72)) fail('Passwords must contain at least 8 characters and at most 72 bytes');
  }
}

const validateRequestReferences = async (req, res, next) => {
  try { await validateReferences(req); next(); } catch (error) { res.status(error.status || 503).json({ error: error.status ? error.message : 'Unable to validate school records' }); }
};

function secureRouter(router, { model, readRoles = SCHOOL_ROLES, writeRoles = ADMIN_ROLES, selfTeacher = false, messages = false } = {}) {
  router.use(async (req, res, next) => {
    try {
      if (!req.user || !req.schoolId) fail('Authenticated school context required', 403);
      req.securityModel = model;
      const reading = ['GET', 'HEAD'].includes(req.method);
      const personal = (selfTeacher && req.path.startsWith('/me/') && req.user.role === 'Teacher') || (messages && req.path.startsWith('/messages'));
      if (!(personal || (reading ? readRoles : writeRoles).includes(req.user.role))) fail('Access denied. Insufficient permissions.', 403);
      if (req.user.role === 'Student' && !req.user.studentId) fail('Student account is not linked to a student profile', 403);
      if (req.user.role === 'Parent' && ['student', 'attendance', 'exam', 'class'].includes(model)) fail('Parent access requires a verified student relationship', 403);
      for (const key of ['page', 'limit']) {
        if (req.query[key] !== undefined && (!/^\d+$/.test(req.query[key]) || Number(req.query[key]) < 1 || (key === 'limit' && Number(req.query[key]) > 200))) fail(`Invalid ${key}`);
      }
      for (const key of ['date', 'startDate', 'endDate']) {
        if (req.query[key] && (typeof req.query[key] !== 'string' || Number.isNaN(new Date(req.query[key]).getTime()))) fail(`Invalid ${key}`);
      }
      if (req.user.role === 'Teacher' && !reading && req.body?.classId) {
        const assigned = await prisma.class.findFirst({ where: { id: req.body.classId, schoolId: req.schoolId, OR: [{ classTeacherId: req.user.teacherId || noProfileId }, { subjects: { some: { teacherId: req.user.teacherId || noProfileId } } }] } });
        if (!assigned) fail('You are not assigned to this class', 403);
      }
      if (!reading) {
        await validateReferences(req);
        if (model && req.body?.id) await requireRecord(req, model, req.body.id);
      }
      next();
    } catch (error) { res.status(error.status || 503).json({ error: error.status ? error.message : 'Unable to validate school records' }); }
  });
  if (model) router.param('id', async (req, res, next, id) => {
    try { req.scopedRecord = await requireRecord(req, model, id); next(); }
    catch (error) { res.status(error.status || 503).json({ error: error.status ? error.message : 'Unable to validate school records' }); }
  });
}

module.exports = { secureRouter, validateReferences, validateRequestReferences, requireRecord, ADMIN_ROLES, STAFF_ROLES, SCHOOL_ROLES, safeUserSelect, studentScope, classScope, noProfileId };
