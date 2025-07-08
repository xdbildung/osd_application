#!/usr/bin/env node

/**
 * 同步public目录的静态文件到根目录
 * 用于确保本地开发和Vercel生产环境的一致性
 */

const fs = require('fs');
const path = require('path');

// 需要同步的文件列表
const filesToSync = [
    'styles.css',
    'script.js',
    'index.html' // 新增 index.html
];

console.log('🔄 开始同步静态文件...');

filesToSync.forEach(file => {
    const rootPath = file;
    const publicPath = path.join('public', file);

    const rootExists = fs.existsSync(rootPath);
    const publicExists = fs.existsSync(publicPath);

    if (!rootExists && !publicExists) {
        console.warn(`- ⚠️ 文件在两处均不存在，跳过: ${file}`);
        return;
    }

    if (rootExists && !publicExists) {
        console.log(`- 📥 public/${file} 不存在，从根目录复制...`);
        fs.copyFileSync(rootPath, publicPath);
        console.log(`  ✅ ${rootPath} -> ${publicPath}`);
        return;
    }

    if (!rootExists && publicExists) {
        console.log(`- 📥 ${file} 不存在，从 public/ 目录复制...`);
        fs.copyFileSync(publicPath, rootPath);
        console.log(`  ✅ ${publicPath} -> ${rootPath}`);
        return;
    }

    // Both exist, compare modification times
    const rootStat = fs.statSync(rootPath);
    const publicStat = fs.statSync(publicPath);

    if (rootStat.mtimeMs > publicStat.mtimeMs) {
        console.log(`- 🔄 根目录中的 ${file} 是最新版本，同步到 public/ ...`);
        fs.copyFileSync(rootPath, publicPath);
        console.log(`  ✅ ${rootPath} -> ${publicPath}`);
    } else if (publicStat.mtimeMs > rootStat.mtimeMs) {
        console.log(`- 🔄 public/ 中的 ${file} 是最新版本，同步到根目录...`);
        fs.copyFileSync(publicPath, rootPath);
        console.log(`  ✅ ${publicPath} -> ${rootPath}`);
    } else {
        console.log(`- ✅ 文件 ${file} 版本一致，无需同步。`);
    }
});

console.log('\n🎉 静态文件同步完成！');
