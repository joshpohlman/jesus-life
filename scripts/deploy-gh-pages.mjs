import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const root = path.resolve('.');
const dist = path.join(root, 'dist');

fs.writeFileSync(path.join(dist, '.nojekyll'), '\n');

process.chdir(dist);
if (!fs.existsSync(path.join(dist, '.git'))) {
  execSync('git init', { stdio: 'inherit' });
  execSync('git remote add origin https://github.com/joshpohlman/jesus-life.git', { stdio: 'inherit' });
}
execSync('git add -A', { stdio: 'inherit' });
try {
  execSync('git commit -m "Deploy site"', { stdio: 'inherit' });
} catch {
  console.log('No changes to deploy.');
  process.exit(0);
}
execSync('git branch -M gh-pages', { stdio: 'inherit' });
execSync('git push -f origin gh-pages', { stdio: 'inherit' });
console.log('\nLive at https://joshpohlman.github.io/jesus-life/');