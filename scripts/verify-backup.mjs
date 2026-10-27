import {readFile} from 'node:fs/promises';import {decryptBackup,verifyBundle} from './backup-codec.mjs';
if(!process.argv[2])throw new Error('Informe o caminho do arquivo .backup.');
console.log(JSON.stringify(verifyBundle(decryptBackup(await readFile(process.argv[2]),process.env.BACKUP_ENCRYPTION_KEY)),null,2));
