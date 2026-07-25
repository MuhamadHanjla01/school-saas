require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with multi-tenant data...');
  const hash = await bcrypt.hash('admin123', 10);

  // ─── Clean up (if needed, but usually we start fresh) ───
  // Note: Prisma migrate reset will handle cleanup.

  // ─── School (Tenant Root) ──────────────────────────────────────────────────────
  const school = await prisma.school.upsert({
    where: { slug: 'erpzo-academy' },
    update: {},
    create: {
      name: 'ERPzo Academy',
      slug: 'erpzo-academy',
      domain: 'academy.erpzo.com',
      logo: 'https://ui-avatars.com/api/?name=EA&background=0060ac&color=fff',
      address: '123 Education Lane, Learning City',
      phone: '+1 800 555 1234',
      email: 'contact@erpzo-academy.com',
      plan: 'Pro'
    }
  });
  const sid = school.id;

  // ─── Users ─────────────────────────────────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@erpzo.com' },
    update: {},
    create: { email: 'admin@erpzo.com', passwordHash: hash, role: 'SuperAdmin', schoolId: sid },
  });
  const schoolAdmin = await prisma.user.upsert({
    where: { email: 'schooladmin@erpzo.com' },
    update: {},
    create: { email: 'schooladmin@erpzo.com', passwordHash: hash, role: 'SchoolAdmin', schoolId: sid },
  });

  // ─── Teachers (create profiles first, then link users) ─────────────────
  const teachersData = [
    { employeeId: 'T-2024', name: 'Dr. Sarah Jenkins', department: 'Science', phone: '+1 (555) 123-4567', status: 'Active', title: 'HOD (Head of Dept)', address: '124 Academic Way', qualifications: 'Ph.D. Physics' },
    { employeeId: 'T-2025', name: 'Prof. John Smith', department: 'Mathematics', phone: '+1 (555) 234-5678', status: 'Active', title: 'Teacher', address: '88 Scholar Ave', qualifications: 'M.Sc. Mathematics' },
    { employeeId: 'T-2026', name: 'Ms. Emily Davis', department: 'English', phone: '+1 (555) 345-6789', status: 'Active', title: 'Teacher', address: '42 Campus Dr', qualifications: 'M.A. English Literature' },
    { employeeId: 'T-2027', name: 'Mr. Raj Patel', department: 'Computer Science', phone: '+91 98765 12345', status: 'On Leave', title: 'Teacher', address: '15 Tech Park Rd', qualifications: 'M.Tech Computer Science' },
    { employeeId: 'T-2028', name: 'Mrs. Lisa Brown', department: 'History', phone: '+1 (555) 456-7890', status: 'Active', title: 'Teacher', address: '77 Heritage St', qualifications: 'M.A. History' },
    { employeeId: 'T-2029', name: 'Dr. Michael Lee', department: 'Science', phone: '+1 (555) 567-8901', status: 'Active', title: 'Teacher', address: '305 Lab Blvd', qualifications: 'Ph.D. Chemistry' },
  ];

  const teachers = [];
  for (const t of teachersData) {
    const teacher = await prisma.teacher.upsert({
      where: { employeeId: t.employeeId },
      update: {},
      create: { ...t, schoolId: sid },
    });
    teachers.push(teacher);
  }

  const teacherEmails = [
    'sarah.jenkins@erpzo.com', 'john.smith@erpzo.com', 'emily.davis@erpzo.com',
    'raj.patel@erpzo.com', 'lisa.brown@erpzo.com', 'michael.lee@erpzo.com',
  ];
  for (let i = 0; i < teachers.length; i++) {
    await prisma.user.upsert({
      where: { email: teacherEmails[i] },
      update: { teacherId: teachers[i].id, plainPassword: 'teacher123', schoolId: sid },
      create: { email: teacherEmails[i], passwordHash: hash, plainPassword: 'teacher123', role: 'Teacher', teacherId: teachers[i].id, schoolId: sid },
    });
  }

  // ─── Staff ──────────────────────────────────────────────────────────────
  const staffData = [
    { staffId: 'S-1001', name: 'Alice Walker', role: 'Librarian', department: 'Library', phone: '555-0101', email: 'alice@erpzo.com', status: 'Active' },
    { staffId: 'S-1002', name: 'Bob Security', role: 'Security Guard', department: 'Security', phone: '555-0102', email: 'bob@erpzo.com', status: 'Active' },
  ];
  for (const st of staffData) {
    await prisma.staff.upsert({
      where: { staffId: st.staffId },
      update: {},
      create: { ...st, schoolId: sid },
    });
  }

  // ─── Classes ───────────────────────────────────────────────────────────
  const classesData = [
    { name: '9-A', room: 'Room 101', classTeacherId: teachers[2].id },
    { name: '9-B', room: 'Room 102', classTeacherId: teachers[3].id },
    { name: '10-A', room: 'Room 201', classTeacherId: teachers[0].id },
    { name: '10-B', room: 'Room 202', classTeacherId: teachers[1].id },
    { name: '11-A', room: 'Room 301', classTeacherId: teachers[4].id },
    { name: '11-C', room: 'Room 303', classTeacherId: teachers[5].id },
    { name: '12-A', room: 'Room 401', classTeacherId: teachers[0].id },
    { name: '12-B', room: 'Room 402', classTeacherId: teachers[1].id },
  ];

  const classes = [];
  const classMap = {};
  for (const c of classesData) {
    // Unique on name, schoolId
    const cls = await prisma.class.upsert({
      where: { name_schoolId: { name: c.name, schoolId: sid } },
      update: {},
      create: { ...c, schoolId: sid },
    });
    classes.push(cls);
    classMap[c.name] = cls;
  }

  // ─── Parents ────────────────────────────────────────────────────────────
  const parentsData = [
    { parentId: 'P-1001', name: 'Carlos Martinez', phone: '+1 234 567 8900', email: 'carlos@mail.com', occupation: 'Engineer' },
    { parentId: 'P-1002', name: 'Li Chen', phone: '+1 234 567 8901', email: 'lichen@mail.com', occupation: 'Doctor' },
  ];
  const parents = [];
  for (const p of parentsData) {
    const parent = await prisma.parent.upsert({
      where: { parentId: p.parentId },
      update: {},
      create: { ...p, schoolId: sid },
    });
    parents.push(parent);
  }

  // ─── Students ──────────────────────────────────────────────────────────
  const studentsData = [
    { studentId: 'STD-2023-0045', name: 'Maria Martinez', guardianName: 'Carlos Martinez', phone: '+1 234 567 8900', status: 'Active', className: '10-A', parentIdx: 0 },
    { studentId: 'STD-2023-0112', name: 'Alex Chen', guardianName: 'Li Chen', phone: '+1 234 567 8901', status: 'Active', className: '10-B', parentIdx: 1 },
    { studentId: 'STD-2023-0089', name: 'Sarah Johnson', guardianName: 'Mark Johnson', phone: '+1 234 567 8902', status: 'Active', className: '12-A' },
    { studentId: 'STD-2023-0201', name: 'David Wilson', guardianName: 'Emily Wilson', phone: '+1 234 567 8903', status: 'Active', className: '11-C' },
    { studentId: 'STD-2023-0144', name: 'Elena Rodriguez', guardianName: 'Sofia Rodriguez', phone: '+1 234 567 8904', status: 'Inactive', className: '9-A' },
    { studentId: 'STD-2024-0301', name: 'Aarav Sharma', guardianName: 'Priya Sharma', phone: '+91 98765 43210', status: 'Active', className: '10-A' },
    { studentId: 'STD-2024-0302', name: 'Emma Williams', guardianName: 'Robert Williams', phone: '+1 234 567 8905', status: 'Active', className: '11-A' },
    { studentId: 'STD-2024-0303', name: 'Liam Brown', guardianName: 'Jane Brown', phone: '+1 234 567 8906', status: 'Active', className: '9-A' },
    { studentId: 'STD-2024-0304', name: 'Sophia Garcia', guardianName: 'Maria Garcia', phone: '+1 234 567 8907', status: 'Active', className: '9-B' },
    { studentId: 'STD-2024-0305', name: 'Noah Davis', guardianName: 'Tom Davis', phone: '+1 234 567 8908', status: 'Active', className: '12-B' },
    { studentId: 'STD-2024-0306', name: 'Olivia Miller', guardianName: 'Susan Miller', phone: '+1 234 567 8909', status: 'Active', className: '10-A' },
    { studentId: 'STD-2024-0307', name: 'James Taylor', guardianName: 'Mike Taylor', phone: '+1 234 567 8910', status: 'Active', className: '10-B' },
  ];

  const students = [];
  for (const s of studentsData) {
    const { className, parentIdx, ...data } = s;
    const parentId = parentIdx !== undefined ? parents[parentIdx].id : null;
    const student = await prisma.student.upsert({
      where: { studentId: data.studentId },
      update: {},
      create: { ...data, classId: classMap[className].id, schoolId: sid, parentId },
    });
    students.push(student);
  }

  const studentEmails = [
    'maria.martinez@student.erpzo.com', 'alex.chen@student.erpzo.com', 'sarah.johnson@student.erpzo.com',
    'david.wilson@student.erpzo.com', 'elena.rodriguez@student.erpzo.com', 'aarav.sharma@student.erpzo.com',
    'emma.williams@student.erpzo.com', 'liam.brown@student.erpzo.com', 'sophia.garcia@student.erpzo.com',
    'noah.davis@student.erpzo.com', 'olivia.miller@student.erpzo.com', 'james.taylor@student.erpzo.com',
  ];
  for (let i = 0; i < students.length; i++) {
    await prisma.user.upsert({
      where: { email: studentEmails[i] },
      update: { studentId: students[i].id, plainPassword: 'student123', schoolId: sid },
      create: { email: studentEmails[i], passwordHash: hash, plainPassword: 'student123', role: 'Student', studentId: students[i].id, schoolId: sid },
    });
  }

  await prisma.user.upsert({
    where: { email: 'teacher@erpzo.com' },
    update: {},
    create: { email: 'teacher@erpzo.com', passwordHash: hash, role: 'Teacher', schoolId: sid },
  });
  await prisma.user.upsert({
    where: { email: 'student@erpzo.com' },
    update: {},
    create: { email: 'student@erpzo.com', passwordHash: hash, role: 'Student', schoolId: sid },
  });

  // ─── Subjects ──────────────────────────────────────────────────────────
  const subjectsData = [
    { name: 'English', classNames: ['9-A', '10-A', '10-B'], teacherIdx: 2 },
    { name: 'History', classNames: ['9-A', '11-A'], teacherIdx: 4 },
    { name: 'Science', classNames: ['9-A', '10-A'], teacherIdx: 0 },
    { name: 'Mathematics', classNames: ['9-B', '10-B', '11-A'], teacherIdx: 1 },
    { name: 'Computer Science', classNames: ['9-B'], teacherIdx: 3 },
    { name: 'Physics', classNames: ['10-A', '11-C', '12-A'], teacherIdx: 0 },
    { name: 'Chemistry', classNames: ['10-A', '11-C'], teacherIdx: 5 },
    { name: 'Biology', classNames: ['10-A'], teacherIdx: 0 },
    { name: 'Geography', classNames: ['11-A'], teacherIdx: 4 },
    { name: 'Economics', classNames: ['11-A'], teacherIdx: 4 },
    { name: 'Advanced Physics', classNames: ['12-A'], teacherIdx: 0 },
    { name: 'Quantum Mechanics', classNames: ['12-A'], teacherIdx: 0 },
    { name: 'Calculus', classNames: ['12-B'], teacherIdx: 1 },
    { name: 'Statistics', classNames: ['12-B'], teacherIdx: 1 },
  ];

  const subjectRecords = [];
  for (const s of subjectsData) {
    for (const cn of s.classNames) {
      const sub = await prisma.subject.upsert({
        where: { name_classId: { name: s.name, classId: classMap[cn].id } },
        update: {},
        create: { name: s.name, teacherId: teachers[s.teacherIdx].id, classId: classMap[cn].id, schoolId: sid },
      });
      subjectRecords.push(sub);
    }
  }

  // ─── Timetable ─────────────────────────────────────────────────────────
  const class10A = classMap['10-A'];
  const physicsSubject = subjectRecords.find(s => s.name === 'Physics' && s.classId === class10A.id);
  const mathSubject = subjectRecords.find(s => s.name === 'Mathematics' && s.classId === classMap['10-B'].id);
  const englishSubject = subjectRecords.find(s => s.name === 'English' && s.classId === class10A.id);
  const chemSubject = subjectRecords.find(s => s.name === 'Chemistry' && s.classId === class10A.id);
  const historySubject = subjectRecords.find(s => s.name === 'History' && s.classId === classMap['9-A'].id);
  const scienceSubject = subjectRecords.find(s => s.name === 'Science' && s.classId === class10A.id);
  const bioSubject = subjectRecords.find(s => s.name === 'Biology' && s.classId === class10A.id);
  const csSubject = subjectRecords.find(s => s.name === 'Computer Science' && s.classId === classMap['9-B'].id);

  const mondaySlots = [
    { dayOfWeek: 'Monday', startTime: '08:00', endTime: '08:45', classId: class10A.id, subjectId: scienceSubject?.id || physicsSubject.id, teacherId: teachers[0].id, schoolId: sid },
    { dayOfWeek: 'Monday', startTime: '08:50', endTime: '09:35', classId: class10A.id, subjectId: physicsSubject.id, teacherId: teachers[0].id, schoolId: sid },
    { dayOfWeek: 'Monday', startTime: '09:40', endTime: '10:25', classId: class10A.id, subjectId: englishSubject.id, teacherId: teachers[2].id, schoolId: sid },
    { dayOfWeek: 'Monday', startTime: '10:40', endTime: '11:25', classId: class10A.id, subjectId: chemSubject.id, teacherId: teachers[5].id, schoolId: sid },
    { dayOfWeek: 'Monday', startTime: '11:30', endTime: '12:15', classId: class10A.id, subjectId: historySubject?.id || englishSubject.id, teacherId: teachers[4].id, schoolId: sid },
  ];

  await prisma.timetable.deleteMany({});
  for (const slot of mondaySlots) {
    await prisma.timetable.create({ data: slot });
  }

  // ─── Attendance ────────────────────────────────────────────────────────
  await prisma.attendance.deleteMany({});
  const today = new Date();
  const statuses = ['Present', 'Present', 'Present', 'Present', 'Absent', 'Late', 'Present', 'Present'];
  for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    date.setHours(0, 0, 0, 0);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    for (const student of students) {
      if (student.status === 'Inactive') continue;
      const statusIdx = Math.floor(Math.random() * statuses.length);
      try {
        await prisma.attendance.create({
          data: { date, status: statuses[statusIdx], studentId: student.id, classId: student.classId, schoolId: sid },
        });
      } catch (e) { }
    }
  }

  // Teacher attendance
  await prisma.teacherAttendance.deleteMany({});
  for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    date.setHours(0, 0, 0, 0);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    for (const teacher of teachers) {
      const st = teacher.status === 'On Leave' ? 'Leave' : (Math.random() > 0.05 ? 'Present' : 'Absent');
      try {
        await prisma.teacherAttendance.create({
          data: { date, status: st, teacherId: teacher.id, schoolId: sid },
        });
      } catch (e) { }
    }
  }

  // ─── Assignments ───────────────────────────────────────────────────────
  await prisma.assignment.deleteMany({});
  const assignmentsData = [
    { title: 'Newton\'s Laws Lab Report', description: 'Write a detailed lab report on the experiments conducted to verify Newton\'s three laws of motion.', dueDate: new Date('2024-07-25'), teacherId: teachers[0].id, classId: class10A.id, subjectId: physicsSubject.id, schoolId: sid },
  ];
  for (const a of assignmentsData) {
    await prisma.assignment.create({ data: a });
  }

  // ─── Exams ─────────────────────────────────────────────────────────────
  await prisma.examClass.deleteMany({});
  await prisma.examResult.deleteMany({});
  await prisma.exam.deleteMany({});

  const examsData = [
    { name: 'Mid-Term Examination', type: 'Internal', startDate: new Date('2024-07-22'), endDate: new Date('2024-07-30'), status: 'Upcoming', classNames: ['9-A', '9-B', '10-A', '10-B', '11-A', '11-C', '12-A', '12-B'] },
    { name: 'Unit Test 1', type: 'Internal', startDate: new Date('2024-05-10'), endDate: new Date('2024-05-14'), status: 'Completed', classNames: ['9-A', '9-B', '10-A', '10-B', '11-A', '11-C', '12-A', '12-B'] },
  ];

  const exams = [];
  for (const e of examsData) {
    const { classNames, ...data } = e;
    const exam = await prisma.exam.create({ data: { ...data, schoolId: sid } });
    exams.push(exam);
    for (const cn of classNames) {
      await prisma.examClass.create({ data: { examId: exam.id, classId: classMap[cn].id } });
    }
  }

  const unitTest1 = exams[1];
  const examStudents = students.filter(s => s.status === 'Active');
  for (const student of examStudents) {
    const studentSubs = subjectRecords.filter(s => s.classId === student.classId);
    for (const sub of studentSubs.slice(0, 3)) { 
      const marks = Math.floor(Math.random() * 40) + 60;
      const grade = marks >= 90 ? 'A+' : marks >= 80 ? 'A' : marks >= 70 ? 'B' : marks >= 60 ? 'C' : 'D';
      try {
        await prisma.examResult.create({
          data: { marks, maxMarks: 100, grade, examId: unitTest1.id, studentId: student.id, subjectId: sub.id },
        });
      } catch (e) { }
    }
  }

  // ─── Fees ──────────────────────────────────────────────────────────────
  await prisma.feePayment.deleteMany({});
  await prisma.fee.deleteMany({});

  const feeAmount = { '9-A': 2500, '9-B': 2500, '10-A': 2500, '10-B': 2500, '11-A': 2800, '11-C': 2800, '12-A': 3000, '12-B': 3000 };
  const fees = {};
  for (const [className, amount] of Object.entries(feeAmount)) {
    const fee = await prisma.fee.create({
      data: { name: `Tuition Fee - Term 2`, amount, dueDate: new Date('2024-07-15'), classId: classMap[className].id, schoolId: sid },
    });
    fees[className] = fee;
  }

  const feeStatusMap = {
    'STD-2023-0045': { status: 'Paid', paidDate: new Date('2024-07-12') },
    'STD-2023-0112': { status: 'Pending', paidDate: null },
    'STD-2023-0089': { status: 'Paid', paidDate: new Date('2024-07-10') },
    'STD-2023-0201': { status: 'Paid', paidDate: new Date('2024-07-14') },
  };

  for (const student of students) {
    const classObj = classes.find(c => c.id === student.classId);
    if (!classObj) continue;
    const fee = fees[classObj.name];
    if (!fee) continue;
    const feeInfo = feeStatusMap[student.studentId] || { status: 'Paid', paidDate: new Date() };
    try {
      await prisma.feePayment.create({
        data: { amount: fee.amount, paidDate: feeInfo.paidDate, status: feeInfo.status, studentId: student.id, feeId: fee.id, schoolId: sid },
      });
    } catch (e) { }
  }

  // ─── Notices, Events, Audit Logs ────────────────────────────────────────────
  await prisma.notice.deleteMany({});
  await prisma.notice.create({ data: { title: 'Annual Day', content: 'Annual Day celebrations.', type: 'Event', audience: 'All', priority: 'High', date: new Date('2024-07-18'), schoolId: sid } });

  await prisma.event.deleteMany({});
  await prisma.event.create({ data: { title: 'Parent-Teacher Meeting', date: new Date('2024-07-18'), type: 'event', schoolId: sid } });

  await prisma.auditLog.deleteMany({});
  await prisma.auditLog.create({ data: { userId: superAdmin.id, userName: superAdmin.email, action: 'System Setup', entity: 'System', severity: 'Info', schoolId: sid } });

  console.log('✅ Database seeded successfully with multi-tenant data!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
