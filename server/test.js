
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  try {
    const teachers = await prisma.teacher.findMany({
      where: {},
      include: {
        subjects: { select: { name: true } },
        classTeacher: { select: { name: true } },
        user: { select: { id: true } }
      },
      orderBy: { name: 'asc' },
    });
    console.log('Teachers fetch success, count:', teachers.length);

    const students = await prisma.student.findMany({
      where: {},
      include: { 
        class: { select: { name: true } },
        user: { select: { id: true } }
      },
      orderBy: { createdAt: 'desc' },
    });
    console.log('Students fetch success, count:', students.length);
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
run();

