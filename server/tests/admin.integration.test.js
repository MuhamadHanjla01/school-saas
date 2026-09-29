const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const crypto = require('node:crypto');
const work = path.join(__dirname, '../work'); fs.mkdirSync(work, { recursive: true });
const dbFile = path.join(work, `integration-${crypto.randomUUID()}.db`);
fs.writeFileSync(dbFile, '');
process.env.DATABASE_URL = `file:../work/${path.basename(dbFile)}`;
process.env.JWT_ACCESS_SECRET = crypto.randomBytes(32).toString('hex');
process.env.JWT_REFRESH_SECRET = crypto.randomBytes(32).toString('hex');
process.env.NODE_ENV = 'test';
process.env.SMTP_HOST = '';
const migration = spawnSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'], { cwd: path.join(__dirname, '..'), env: process.env, encoding: 'utf8' });
if (migration.status !== 0) throw new Error(migration.stderr + migration.stdout);
const prisma = require('../src/prismaClient');
const { app, io } = require('../src/index');
const request = require('supertest');
const bcrypt = require('bcryptjs');
let platformToken, schoolA, schoolB, tokenA, tokenB, classA, classB, studentA, studentB;
const password = 'Integration-Password-123';
const auth = token => ({ Authorization: `Bearer ${token}` });
async function login(email, pass = password) { const r = await request(app).post('/api/auth/login').send({ email, password: pass, clientType: 'web' }).expect(200); return r.body.accessToken; }
before(async () => {
 const root = await prisma.school.create({ data: { name:'Platform',slug:'platform' } });
 await prisma.user.create({ data: { email:'platform@test.example', passwordHash:await bcrypt.hash(password,10), role:'SuperAdmin', schoolId:root.id } });
 platformToken = await login('platform@test.example');
});
after(async () => { await prisma.$disconnect(); await new Promise(resolve => io.close(resolve)); fs.rmSync(dbFile,{force:true}); });
test('complete admin workflows with tenant isolation and persistence', async t => {
 await t.test('onboarding creates an immediately usable administrator, atomically', async () => {
  for(const [name,email,slug] of [['School A','a@test.example','school-a'],['School B','b@test.example','school-b']]){
   const r=await request(app).post('/api/superadmin/tenants/schools').set(auth(platformToken)).send({name,email,slug,adminName:'Administrator',password}).expect(201);
   if(slug==='school-a')schoolA=r.body.school;else schoolB=r.body.school;
  }
  tokenA=await login('a@test.example');tokenB=await login('b@test.example');
  const before=await prisma.school.count();
  await request(app).post('/api/superadmin/tenants/schools').set(auth(platformToken)).send({name:'Duplicate',slug:'duplicate',email:'a@test.example',adminName:'Duplicate',password}).expect(409);
  assert.equal(await prisma.school.count(),before);
  await request(app).get('/api/platform/overview').set(auth(tokenA)).expect(403);
  await request(app).get('/api/platform/overview').expect(401);
 });
 await t.test('school administrators cannot grant platform privileges',async()=>{
  await request(app).post('/api/users').set(auth(tokenA)).send({name:'Bad',email:'bad@test.example',password,role:'SuperAdmin'}).expect(403);
  const u=await prisma.user.findUnique({where:{email:'a@test.example'}});
  await request(app).put(`/api/users/${u.id}/role`).set(auth(tokenA)).send({role:'SuperAdmin'}).expect(403);
  await request(app).put(`/api/users/${u.id}/role`).set(auth(tokenA)).send({role:'Teacher'}).expect(409);
 });
 await t.test('school profile and academic settings persist independently',async()=>{
  const current=(await request(app).get('/api/school-admin/settings').set(auth(tokenA)).expect(200)).body;
  await request(app).put('/api/school-admin/settings').set(auth(tokenA)).send({...current.values,name:'School A Updated',academicYear:'2026-2027',passingMarks:45}).expect(200);
  assert.equal((await request(app).get('/api/school-admin/settings').set(auth(tokenA))).body.values.academicYear,'2026-2027');
  assert.equal((await request(app).get('/api/school-admin/settings').set(auth(tokenB))).body.values.academicYear,'');
 });
 await t.test('class, teacher and student creation produce linked accounts',async()=>{
  classA=(await request(app).post('/api/classes').set(auth(tokenA)).send({name:'10-A',room:'101'}).expect(201)).body.class;
  classB=(await request(app).post('/api/classes').set(auth(tokenB)).send({name:'10-A',room:'201'}).expect(201)).body.class;
  assert.ok(classA?.id);assert.ok(classB?.id);
  await request(app).post('/api/teachers').set(auth(tokenA)).send({name:'Teacher A',department:'Science',phone:'123456789',email:'teacher@test.example',password}).expect(201);
  await login('teacher@test.example');
  studentA=(await request(app).post('/api/students').set(auth(tokenA)).send({name:'Student A',guardianName:'Parent A',phone:'123456789',studentEmail:'student-a@test.example',classId:classA.id,password}).expect(201)).body.student;
  studentB=(await request(app).post('/api/students').set(auth(tokenB)).send({name:'Student B',guardianName:'Parent B',phone:'123456789',studentEmail:'student-b@test.example',classId:classB.id,password}).expect(201)).body.student;
  await request(app).get(`/api/students/${studentB.id}`).set(auth(tokenA)).expect(404);
  await request(app).post('/api/students').set(auth(tokenA)).send({name:'Cross tenant',guardianName:'Parent',phone:'123',classId:classB.id,password}).expect(404);
 });
 await t.test('fees assign dues, reject cross-school writes and duplicate settlement',async()=>{
  await request(app).post('/api/fees').set(auth(tokenA)).send({name:'Invalid',amount:-1,dueDate:'2026-12-01',classId:classA.id}).expect(400);
  await request(app).post('/api/fees').set(auth(tokenA)).send({name:'Cross school',amount:100,dueDate:'2026-12-01',classId:classB.id}).expect(404);
  const fee=(await request(app).post('/api/fees').set(auth(tokenA)).send({name:'Tuition',amount:100,dueDate:'2026-12-01',classId:classA.id}).expect(201)).body.fee;
  assert.equal((await request(app).get('/api/fees/payments').set(auth(tokenA))).body.payments.length,1);
  await request(app).post('/api/fees/payments').set(auth(tokenA)).send({studentId:studentB.id,feeId:fee.id,amount:100,status:'Paid'}).expect(404);
  await request(app).get(`/api/fees/student/${studentA.id}`).set(auth(tokenB)).expect(404);
  const pay={studentId:studentA.id,feeId:fee.id,amount:100,status:'Paid'};
  await request(app).post('/api/fees/payments').set(auth(tokenA)).send(pay).expect(200);
  await request(app).post('/api/fees/payments').set(auth(tokenA)).send(pay).expect(409);
  const studentToken=await login('student-a@test.example');
  await request(app).get('/api/fees/summary').set(auth(studentToken)).expect(403);
  await request(app).get(`/api/fees/student/${studentB.id}`).set(auth(studentToken)).expect(404);
 });
 await t.test('documents upload, download and delete only within their school',async()=>{
  const r=await request(app).post('/api/school-admin/documents').set(auth(tokenA)).field('category','Policy').attach('file',Buffer.from('School policy'),'policy.txt').expect(201);
  const id=r.body.document.id;
  assert.equal(r.body.document.content,undefined);
  await request(app).get(`/api/school-admin/documents/${id}/download`).set(auth(tokenB)).expect(404);
  await request(app).get(`/api/school-admin/documents/${id}/download`).expect(401);
  const file=await request(app).get(`/api/school-admin/documents/${id}/download`).set(auth(tokenA)).expect(200);assert.equal(file.text,'School policy');
  await request(app).delete(`/api/school-admin/documents/${id}`).set(auth(tokenA)).expect(200);
 });
 await t.test('packages, subscriptions and immutable payment ledger persist',async()=>{
  const plan=(await request(app).post('/api/platform/plans').set(auth(platformToken)).send({name:'Growth',priceMinor:9900,currency:'usd',interval:'Monthly',studentLimit:500,storageGb:10,features:'Attendance',active:true}).expect(201)).body;
  const sub=(await request(app).post('/api/platform/subscriptions').set(auth(platformToken)).send({schoolId:schoolA.id,planId:plan.id,status:'Active',startDate:'2026-01-01',endDate:'2027-01-01'}).expect(201)).body;
  const payment={subscriptionId:sub.id,amountMinor:9900,reference:'BANK-001',paidDate:'2026-09-18'};
  await request(app).post('/api/platform/transactions').set(auth(platformToken)).send(payment).expect(201);
  await request(app).post('/api/platform/transactions').set(auth(platformToken)).send(payment).expect(409);
  const overview=(await request(app).get('/api/platform/overview').set(auth(platformToken))).body;assert.equal(overview.revenue[0].amountMinor,9900);
 });
 await t.test('editorial writes protect against stale updates and invalid fields',async()=>{
  const r=await request(app).post('/api/platform/records/articles').set(auth(platformToken)).send({title:'Getting started',content:'Create a class',category:'Guide',status:'Published'}).expect(201);
  const rows=(await request(app).get('/api/platform/records/articles').set(auth(platformToken))).body.rows;
  await request(app).put(`/api/platform/records/articles/${r.body.id}`).set(auth(platformToken)).send({...rows[0],content:'Updated'}).expect(200);
  await request(app).put(`/api/platform/records/articles/${r.body.id}`).set(auth(platformToken)).send(rows[0]).expect(409);
  await request(app).get('/api/platform/plans?limit=9999').set(auth(platformToken)).expect(400);
 });
 await t.test('school support reaches platform and response returns to the school',async()=>{
  const ticket=(await request(app).post('/api/school-admin/support').set(auth(tokenA)).send({subject:'Need help',description:'How do I add a subject?',priority:'Normal'}).expect(201)).body.ticket;
  await request(app).put(`/api/platform/tickets/${ticket.id}`).set(auth(platformToken)).send({...ticket,status:'Resolved',response:'Use Subjects in the academic menu.'}).expect(200);
  assert.equal((await request(app).get('/api/school-admin/support').set(auth(tokenA))).body.tickets[0].status,'Resolved');
  assert.equal((await request(app).get('/api/school-admin/support').set(auth(tokenB))).body.tickets.length,0);
 });
 await t.test('school service records support create, update, issue and delete',async()=>{
  const cases=[['library',{bookId:'BOOK-TEST',title:'Science',author:'Teacher',category:'Science'}],['laboratory',{name:'Microscope',category:'Biology',quantity:3,status:'Good Condition'}],['health-records',{studentName:'Student A',bloodGroup:'A+',allergies:'None',lastCheckup:'2026-09-18',notes:'Routine check'}],['transport',{routeName:'North',vehicleNumber:'BUS-01',driverName:'Driver',capacity:40,fee:150}],['certificates',{studentName:'Student A',type:'Bonafide',issueDate:'2026-09-18',status:'Issued'}]];
  for(const [route,data] of cases){
   const created=(await request(app).post(`/api/${route}`).set(auth(tokenA)).send(data).expect(201)).body;
   assert.ok(created.id,route+' missing ID');
   assert.ok((await request(app).get(`/api/${route}`).set(auth(tokenA)).expect(200)).body.some(r=>r.id===created.id));
   await request(app).delete(`/api/${route}/${created.id}`).set(auth(tokenB)).expect(404);
   if(route==='library'){await request(app).put(`/api/library/${created.id}`).set(auth(tokenA)).send({status:'Issued',issuedTo:'Student A',dueDate:'2026-10-01'}).expect(200);await request(app).put(`/api/library/${created.id}`).set(auth(tokenA)).send({status:'Available',issuedTo:null,dueDate:null}).expect(200);}
   if(['transport','laboratory','health-records'].includes(route))await request(app).post(`/api/${route}`).set(auth(tokenA)).send({...data,id:created.id}).expect(200);
   await request(app).delete(`/api/${route}/${created.id}`).set(auth(tokenA)).expect(200);
  }
 });
 await t.test('academic scheduling, assignments, attendance and exam results',async()=>{
  const teacher=await prisma.teacher.findFirst({where:{schoolId:schoolA.id}});
  const subject=(await request(app).post('/api/subjects').set(auth(tokenA)).send({name:'Science',code:'SCI',classId:classA.id,teacherId:teacher.id}).expect(201)).body.subject;
  const slot={dayOfWeek:'Monday',startTime:'09:00',endTime:'10:00',classId:classA.id,subjectId:subject.id,teacherId:teacher.id};
  await request(app).post('/api/timetable').set(auth(tokenA)).send(slot).expect(201);
  await request(app).post('/api/timetable').set(auth(tokenA)).send(slot).expect(409);
  await request(app).post('/api/assignments').set(auth(tokenA)).send({title:'Science project',description:'Observe plants',dueDate:'2026-12-01',classId:classA.id,subjectId:subject.id,teacherId:teacher.id}).expect(201);
  await request(app).post('/api/attendance').set(auth(tokenA)).send({classId:classA.id,date:'2026-09-18',records:[{studentId:studentA.id,status:'Present'}]}).expect(200);
  const exam=(await request(app).post('/api/exams').set(auth(tokenA)).send({name:'Term exam',type:'Internal',startDate:'2026-12-01',endDate:'2026-12-05',classIds:[classA.id]}).expect(201)).body.exam;
  await request(app).post(`/api/exams/${exam.id}/results`).set(auth(tokenA)).send({marks:[{studentId:studentA.id,subjectId:subject.id,marks:85,maxMarks:100,grade:'A'}]}).expect(200);
  const event=(await request(app).post('/api/school/events').set(auth(tokenA)).send({title:'Sports day',date:'2026-12-01',type:'event'}).expect(201)).body.event;
  await request(app).put(`/api/school/events/${event.id}`).set(auth(tokenA)).send({title:'Sports day revised',date:'2026-12-02',type:'event'}).expect(200);
  await request(app).delete(`/api/school/events/${event.id}`).set(auth(tokenA)).expect(200);
 });
 await t.test('public inquiries persist and password recovery tokens are single use',async()=>{
  await request(app).post('/api/public/inquiries').send({name:'Visitor',email:'visitor@test.example',school:'Prospective School',interest:'Demo',content:'Please arrange a demo'}).expect(201);
  assert.ok(await prisma.platformEntry.findFirst({where:{kind:'inquiries',title:'Demo: Prospective School'}}));
  await request(app).post('/api/public/inquiries').send({email:'invalid'}).expect(400);
  const user=await prisma.user.findUnique({where:{email:'a@test.example'}});
  const token=crypto.randomBytes(32).toString('hex');
  await prisma.passwordResetToken.create({data:{userId:user.id,token:crypto.createHash('sha256').update(token).digest('hex'),expiresAt:new Date(Date.now()+60000)}});
  await request(app).post('/api/auth/reset-password').send({token,newPassword:'Recovered-Password-123'}).expect(200);
  await request(app).get('/api/auth/me').set(auth(tokenA)).expect(401);
  await request(app).post('/api/auth/reset-password').send({token,newPassword:'Repeated-Password-123'}).expect(400);
  tokenA=await login('a@test.example','Recovered-Password-123');
 });
 await t.test('password reset invalidates sessions and suspension blocks access',async()=>{
  const u=await prisma.user.findUnique({where:{email:'b@test.example'}});
  await request(app).post(`/api/superadmin/tenants/schools/${schoolB.id}/users/${u.id}/reset-password`).set(auth(platformToken)).send({newPassword:'Changed-Password-456'}).expect(200);
  await request(app).get('/api/auth/me').set(auth(tokenB)).expect(401);
  tokenB=await login('b@test.example','Changed-Password-456');
  await request(app).put(`/api/superadmin/tenants/schools/${schoolB.id}`).set(auth(platformToken)).send({status:'Suspended'}).expect(200);
  await request(app).get('/api/auth/me').set(auth(tokenB)).expect(401);
  await request(app).post('/api/auth/forgot-password').send({email:'a@test.example'}).expect(503);
 });
});
