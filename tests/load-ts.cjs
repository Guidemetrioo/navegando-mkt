/* eslint-disable @typescript-eslint/no-require-imports -- Test-only CommonJS compiler adapter. */
const fs=require('node:fs');const path=require('node:path');const Module=require('node:module');const ts=require('typescript');
const project=path.resolve(__dirname,'..');
const resolve=Module._resolveFilename;
Module._resolveFilename=function(request,parent,...rest){return resolve.call(this,request.startsWith('@/')?path.join(project,'src',request.slice(2)):request,parent,...rest);};
Module._extensions['.ts']=(module,filename)=>{const output=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;module._compile(output,filename);};
