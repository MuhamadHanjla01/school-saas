const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const sender = await prisma.user.findFirst();
    
    const messages = await prisma.message.findMany({
      where: { schoolId: sender.schoolId },
      include: {
        sender: { select: { id: true, email: true, role: true, teacher: { select: { name: true } }, student: { select: { name: true } } } },
        receiver: { select: { id: true, email: true, role: true, teacher: { select: { name: true } }, student: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    console.log("Found messages:", messages.length);
  } catch (e) {
    console.error("Error finding messages:", e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
