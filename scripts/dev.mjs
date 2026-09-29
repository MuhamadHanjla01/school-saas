import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const children=[spawn(process.execPath,['src/index.js'],{cwd:path.join(root,'server'),stdio:'inherit'}),spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1'],{cwd:root,stdio:'inherit'})];
let stopping=false;
const stop=()=>{if(stopping)return;stopping=true;for(const child of children)child.kill('SIGTERM');};
process.on('SIGINT',stop);process.on('SIGTERM',stop);
for(const child of children)child.on('exit',code=>{stop();process.exitCode=code||0;});
