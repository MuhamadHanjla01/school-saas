const express = require('express');
const communicationRoutes = require('./routes/communicationRoutes');
const request = require('supertest');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

// Mock auth middleware
app.use((req, res, next) => {
  prisma.user.findFirst().then(user => {
    req.user = { userId: user.id };
    req.schoolId = user.schoolId;
    next();
  });
});

app.use('/api', communicationRoutes);

async function test() {
  const receiver = await prisma.user.findFirst({ skip: 1 });
  const res = await request(app)
    .post('/api/messages')
    .send({
      receiverId: receiver.id,
      content: 'Hello world'
    });
  
  console.log("Status:", res.status);
  console.log("Body:", res.body);
  await prisma.$disconnect();
}
test();
