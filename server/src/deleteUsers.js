const prisma = require('./prismaClient');
async function run() {
  try {
    const res1 = await prisma.user.deleteMany({ 
      where: { 
        id: { in: ['b4c8332d-d476-40e7-bcaa-cef483d9b54d', 'ce1d40dd-49e9-4572-9fa3-ee6cedcfb9a8'] } 
      } 
    });
    console.log('Deleted by ID:', res1);
    
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
