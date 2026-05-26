// Wrapper that loads real env vars and runs gen-images
const fs = require('fs');
const path = require('path');

// Read DATABASE_URL from .env.real (unmasked)
const realEnv = fs.readFileSync(path.join(__dirname, '..', '.env.real'), 'utf8');
const dbMatch = realEnv.match(/^DATABASE_URL=(.+)$/m);
if (dbMatch) process.env.DATABASE_URL = dbMatch[1].trim();

// Read DASHSCOPE_API_KEY and BLOB_TOKEN from .env.local
const localEnv = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
for (const line of localEnv.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.+)$/);
  if (m && !process.env[m[1]]) {
    process.env[m[1]] = m[2].trim();
  }
}

console.log('DB URL length:', process.env.DATABASE_URL?.length);
console.log('DASHSCOPE key length:', process.env.DASHSCOPE_API_KEY?.length);
console.log('BLOB token length:', process.env.BLOB_TOKEN?.length);

// Now require and run the main script
require('./gen-images.js');
