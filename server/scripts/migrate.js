const path=require('node:path');const fs=require('node:fs');const {spawnSync}=require('node:child_process');
require('dotenv').config({path:path.join(__dirname,'../.env'),quiet:true});
const url=process.env.DATABASE_URL;
if(!url?.startsWith('file:'))throw new Error('This release uses SQLite. Set DATABASE_URL=file:/absolute/path/erpzo.db.');
const filename=path.resolve(__dirname,'../prisma',url.slice(5).split('?')[0]);
fs.mkdirSync(path.dirname(filename),{recursive:true});
if(!fs.existsSync(filename))fs.closeSync(fs.openSync(filename,'wx'));
const result=spawnSync(process.execPath,[require.resolve('prisma/build/index.js'),'migrate','deploy'],{cwd:path.join(__dirname,'..'),stdio:'inherit',env:process.env});
process.exitCode=result.status??1;
