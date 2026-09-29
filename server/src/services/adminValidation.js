const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
const field = (name, label, type = 'text', options = {}) => ({ name, label, type, ...options });
function validate(fields, body, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail('A JSON object is required');
  const result = {};
  for (const f of fields) {
    let value = body[f.name];
    if (value === undefined && partial) continue;
    if (value === undefined) value = f.default ?? '';
    if (value === null && !f.required && f.type !== 'checkbox' && f.type !== 'number') value = '';
    if (f.required && (value === '' || value === null)) fail(`${f.label} is required`);
    if (f.type === 'checkbox') {
      if (typeof value !== 'boolean') fail(`${f.label} must be true or false`);
    } else if (f.type === 'number') {
      if ((typeof value !== 'string' && typeof value !== 'number') || String(value).trim() === '') fail(`${f.label} must be a number`);
      value = Number(value);
      if (!Number.isSafeInteger(value) || value < (f.min ?? 0) || value > (f.max ?? 2147483647)) fail(`${f.label} is outside the allowed range`);
    } else {
      if (typeof value !== 'string') fail(`${f.label} must be text`);
      value = f.type === 'password' ? value : value.trim();
      if (f.required && !value) fail(`${f.label} is required`);
      if (value.length > (f.maxLength ?? (f.type === 'textarea' ? 20000 : 300))) fail(`${f.label} is too long`);
      if (f.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) fail('Invalid email address');
      if (f.type === 'email') value = value.toLowerCase();
      if (f.type === 'password' && value && (value.length < 8 || Buffer.byteLength(value) > 72)) fail('Password must be at least 8 characters and no more than 72 bytes');
      if (f.type === 'date' && value) {
        if (!/^\d{4}-\d{2}-\d{2}/.test(value) || Number.isNaN(Date.parse(value))) fail(`Invalid ${f.label}`);
        value = new Date(value);
      } else if (f.type === 'date') value = null;
      if (f.options && !f.options.includes(value)) fail(`Invalid ${f.label}`);
    }
    result[f.name] = value;
  }
  if (result.startDate && result.endDate && result.endDate < result.startDate) fail('End date must be on or after start date');
  return result;
}
function pagination(req) {
  const page = Number(req.query.page ?? 1), limit = Number(req.query.limit ?? 25);
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 200) fail('Invalid pagination');
  if (req.query.search !== undefined && typeof req.query.search !== 'string') fail('Invalid search');
  return { page, take: limit, skip: (page - 1) * limit };
}
function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const messages = { LIMIT_FILE_SIZE: [413, 'Uploaded file exceeds the size limit'], P2002: [409, 'A record with these unique details already exists'], P2003: [409, 'This record is in use. Remove its dependencies first'], P2025: [404, 'Record not found'] };
  const [status, message] = messages[error.code] || [error.status || 500, error.status ? error.message : 'Unable to complete the request'];
  if (status >= 500) console.error('[admin]', error.code || error.name, error.message);
  res.status(status).json({ error: message });
}
async function audit(db, req, action, entity, entityId, schoolId) {
  await db.auditLog.create({ data: { schoolId: schoolId || req.schoolId || req.user.schoolId, userId: req.user.userId, userName: req.user.email, action, entity, entityId, ipAddress: req.ip } });
}
module.exports = { field, validate, fail, pagination, errorHandler, audit };
