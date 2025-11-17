#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = __dirname;

console.log('🧹 Cleaning up TanStack Start build artifacts...\n');

// Get all files in the directory
const files = fs.readdirSync(rootDir);

let deletedCount = 0;

files.forEach(file => {
  // Check if it matches the pattern app.config.timestamp_*.js
  if (file.startsWith('app.config.timestamp_') && file.endsWith('.js')) {
    try {
      const filePath = path.join(rootDir, file);
      fs.unlinkSync(filePath);
      deletedCount++;
      if (deletedCount % 10 === 0) {
        console.log(`Deleted ${deletedCount} files...`);
      }
    } catch (err) {
      console.error(`Failed to delete ${file}:`, err.message);
    }
  }
});

console.log(`\n✅ Cleanup complete! Deleted ${deletedCount} build artifact files.`);
console.log('These files will not accumulate anymore thanks to .gitignore');
