#!/usr/bin/env node

// Simple production build - remove debug code and optimize for shipping
const fs = require('fs');
const path = require('path');

const srcDir = './src';
const buildDir = './dist';

// Create dist directory
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

function processJSFile(content) {
  // Remove console statements (but keep console.error for critical errors)
  content = content.replace(/console\.(log|warn|info|debug)\([^)]*\);?\s*/g, '');
  
  // Remove debug comments
  content = content.replace(/\/\/\s*DEBUG:.*$/gm, '');
  content = content.replace(/\/\*\s*DEBUG:.*?\*\//gs, '');
  
  return content;
}

function copyAndProcess(src, dest) {
  const stats = fs.statSync(src);
  
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const files = fs.readdirSync(src);
    files.forEach(file => {
      copyAndProcess(path.join(src, file), path.join(dest, file));
    });
  } else {
    const ext = path.extname(src);
    let content = fs.readFileSync(src, 'utf8');
    
    if (ext === '.js') {
      content = processJSFile(content);
    }
    
    fs.writeFileSync(dest, content);
  }
}

console.log('🏗️ Building production version...');
copyAndProcess(srcDir, buildDir);

// Create simple production HTML
const indexContent = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf8');
const prodHtml = indexContent.replace('<title>DeckPro Designer</title>', '<title>DeckPro - Professional Deck Calculator</title>');
fs.writeFileSync(path.join(buildDir, 'index.html'), prodHtml);

console.log('✅ Production build complete in ./dist/');
console.log('📊 Removed debug code and optimized for shipping');