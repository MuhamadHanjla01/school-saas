const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const sender = await prisma.user.findFirst();
    const receiver = await prisma.user.findFirst({ where: { id: { not: sender.id } } });

    console.log("Sender:", sender.id, "Receiver:", receiver.id);

    const message = await prisma.message.create({
      data: {
        senderId: sender.id,
        receiverId: receiver.id,
        content: 'Test message',
        schoolId: sender.schoolId
      }
    });
    console.log("Message created:", message.id);
  } catch (e) {
    console.error("Error creating message:", e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
