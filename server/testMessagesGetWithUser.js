const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const sender = await prisma.user.findFirst();
    const withUser = 'some-uuid';
    const userId = sender.id;
    
    const where = {
      schoolId: sender.schoolId,
      OR: [{ senderId: userId }, { receiverId: userId }],
    };
    if (withUser) {
      where.OR = [
        { senderId: userId, receiverId: withUser },
        { senderId: withUser, receiverId: userId },
      ];
    }

    const messages = await prisma.message.findMany({
      where,
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
