#!/usr/bin/env node

/**
 * 同步public目录的静态文件到根目录
 * 用于确保本地开发和Vercel生产环境的一致性
 */

const fs = require('fs');
const path = require('path');

const staticFiles = [
    'styles.css',
    'script.js'
];

console.log('🔄 同步静态文件...');

staticFiles.forEach(file => {
    const srcPath = path.join('public', file);
    const destPath = file;
    
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✅ 已复制: ${file}`);
    } else {
        console.log(`❌ 文件不存在: ${srcPath}`);
    }
});

console.log('🎉 静态文件同步完成！');
