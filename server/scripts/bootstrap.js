const path=require('node:path');require('dotenv').config({path:path.join(__dirname,'../.env'),quiet:true});
const prisma=require('../src/prismaClient');const bcrypt=require('bcryptjs');
(async()=>{
 const email=process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase(),password=process.env.BOOTSTRAP_ADMIN_PASSWORD;
 if(!email||!password||password.length<12||Buffer.byteLength(password)>72)throw new Error('Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD (12–72 bytes). Existing accounts are never overwritten.');
 const existing=await prisma.user.findUnique({where:{email}});if(existing)throw new Error('This email already exists. No credentials were changed.');
 const passwordHash=await bcrypt.hash(password,12);
 await prisma.$transaction(async db=>{const school=await db.school.upsert({where:{slug:'erpzo-platform'},update:{},create:{name:'ERPZO Platform',slug:'erpzo-platform'}});await db.user.create({data:{email,passwordHash,name:'Platform Administrator',role:'SuperAdmin',schoolId:school.id}});});
 console.log('Platform administrator created. Sign in and onboard a school.');
})().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>prisma.$disconnect());
