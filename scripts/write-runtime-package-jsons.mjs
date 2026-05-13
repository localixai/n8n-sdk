import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const cjsDir = resolve('dist/cjs');
const esmDir = resolve('dist/esm');

mkdirSync(cjsDir, { recursive: true });
mkdirSync(esmDir, { recursive: true });

writeFileSync(resolve(cjsDir, 'package.json'), `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`);
writeFileSync(resolve(esmDir, 'package.json'), `${JSON.stringify({ type: 'module' }, null, 2)}\n`);
