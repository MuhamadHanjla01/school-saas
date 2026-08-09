const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'teacher1@school.com' },
      include: {
        student: { include: { class: true } },
        teacher: true
      }
    });
    console.log(user ? user.id : 'not found');
  } catch (e) {
    console.error("Prisma error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
