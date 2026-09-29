const path=require('node:path');const fs=require('node:fs');require('dotenv').config({path:path.join(__dirname,'../.env'),quiet:true});
const prisma=require('../src/prismaClient');
(async()=>{
 const folder=path.resolve(process.argv[2]||path.join(__dirname,'../backups',new Date().toISOString().replaceAll(':','-')));
 fs.mkdirSync(folder,{recursive:true});const target=path.join(folder,'erpzo.db');
 if(fs.existsSync(target))throw new Error('Backup destination already contains erpzo.db; choose a new directory.');
 await prisma.$executeRawUnsafe(`VACUUM INTO '${target.replaceAll("'","''")}'`);
 const uploads=process.env.UPLOAD_DIR || path.join(__dirname,'../public/uploads');if(fs.existsSync(uploads))fs.cpSync(uploads,path.join(folder,'uploads'),{recursive:true});
 fs.writeFileSync(path.join(folder,'manifest.json'),JSON.stringify({format:'erpzo-sqlite-backup-v1',createdAt:new Date(),database:'erpzo.db',uploads:'uploads'},null,2));
 console.log(`Backup saved to ${folder}. Verify a restore before relying on this backup.`);
})().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>prisma.$disconnect());
