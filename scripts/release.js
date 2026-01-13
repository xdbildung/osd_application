#!/usr/bin/env node

/**
 * 版本发布脚本
 * 自动化版本更新、Git 标签和部署流程
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// 读取当前版本
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const currentVersion = packageJson.version;

console.log('🚀 版本发布工具');
console.log('================\n');
console.log(`📦 当前版本: v${currentVersion}\n`);

// 检查 Git 状态
try {
    const gitStatus = execSync('git status --porcelain').toString();
    if (gitStatus.trim()) {
        console.error('❌ 错误: 存在未提交的更改');
        console.log('请先提交所有更改后再发布新版本\n');
        console.log(gitStatus);
        process.exit(1);
    }
} catch (error) {
    console.error('❌ 错误: 无法检查 Git 状态');
    process.exit(1);
}

console.log('✅ Git 工作目录干净\n');

// 创建 Git Tag
console.log(`📌 创建 Git Tag: v${currentVersion}`);
try {
    execSync(`git tag -a v${currentVersion} -m "Release v${currentVersion}"`, { stdio: 'inherit' });
    console.log('✅ Git Tag 创建成功\n');
} catch (error) {
    console.error('❌ 创建 Git Tag 失败');
    process.exit(1);
}

// 推送到 GitHub
console.log('📤 推送到 GitHub...');
try {
    execSync('git push origin main', { stdio: 'inherit' });
    execSync(`git push origin v${currentVersion}`, { stdio: 'inherit' });
    console.log('✅ 推送成功\n');
} catch (error) {
    console.error('❌ 推送失败');
    // 删除本地 tag
    execSync(`git tag -d v${currentVersion}`);
    process.exit(1);
}

// 生成版本信息文件
const versionInfo = {
    version: currentVersion,
    releaseDate: new Date().toISOString(),
    gitCommit: execSync('git rev-parse HEAD').toString().trim(),
    gitBranch: execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
};

const versionInfoPath = path.join(__dirname, '..', 'version.json');
fs.writeFileSync(versionInfoPath, JSON.stringify(versionInfo, null, 2));
console.log('✅ 生成 version.json\n');

console.log('🎉 发布完成！\n');
console.log('部署信息:');
console.log(`  版本: v${currentVersion}`);
console.log(`  提交: ${versionInfo.gitCommit.substring(0, 7)}`);
console.log(`  分支: ${versionInfo.gitBranch}`);
console.log(`  时间: ${new Date(versionInfo.releaseDate).toLocaleString('zh-CN')}\n`);
console.log('Vercel 将自动检测并部署此版本 🚀');
