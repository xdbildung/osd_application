const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

class ProjectBackup {
    constructor() {
        this.projectRoot = __dirname;
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        this.backupName = `forms_backup_${this.timestamp}`;
        this.backupDir = path.join(this.projectRoot, 'backups');
        this.backupPath = path.join(this.backupDir, this.backupName);
        
        // 需要备份的文件和目录
        this.includePatterns = [
            '*.html',
            '*.css', 
            '*.js',
            '*.json',
            '*.md',
            '*.pdf',
            '*.docx',
            'public/**/*',
            'uploads/**/*'
        ];
        
        // 排除的文件和目录
        this.excludePatterns = [
            'node_modules',
            'backups',
            '.DS_Store',
            '.git',
            'backup.js', // 排除备份脚本自身
            '*.log',
            'tmp',
            'temp'
        ];
    }

    // 创建备份目录
    createBackupDir() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
        
        if (!fs.existsSync(this.backupPath)) {
            fs.mkdirSync(this.backupPath, { recursive: true });
        }
    }

    // 检查文件是否应该被排除
    shouldExclude(filePath) {
        const relativePath = path.relative(this.projectRoot, filePath);
        return this.excludePatterns.some(pattern => {
            if (pattern.includes('/')) {
                return relativePath.startsWith(pattern);
            }
            return relativePath.includes(pattern);
        });
    }

    // 递归复制文件
    copyDirectory(src, dest) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }

        const entries = fs.readdirSync(src, { withFileTypes: true });
        
        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            
            if (this.shouldExclude(srcPath)) {
                continue;
            }
            
            if (entry.isDirectory()) {
                this.copyDirectory(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }

    // 生成备份信息文件
    generateBackupInfo() {
        const backupInfo = {
            timestamp: new Date().toISOString(),
            backupName: this.backupName,
            projectName: 'SDI奥德考试报名表单系统',
            version: '1.0.0',
            description: '完整的报名表单系统备份，包含付费功能',
            files: [],
            totalSize: 0
        };

        // 递归收集文件信息
        const collectFiles = (dir, relativePath = '') => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relativeFilePath = path.join(relativePath, entry.name);
                
                if (entry.isDirectory()) {
                    collectFiles(fullPath, relativeFilePath);
                } else {
                    const stats = fs.statSync(fullPath);
                    backupInfo.files.push({
                        path: relativeFilePath,
                        size: stats.size,
                        modified: stats.mtime.toISOString()
                    });
                    backupInfo.totalSize += stats.size;
                }
            }
        };

        collectFiles(this.backupPath);
        backupInfo.fileCount = backupInfo.files.length;
        backupInfo.totalSizeFormatted = this.formatBytes(backupInfo.totalSize);

        // 写入备份信息文件
        const infoPath = path.join(this.backupPath, 'BACKUP_INFO.json');
        fs.writeFileSync(infoPath, JSON.stringify(backupInfo, null, 2));

        return backupInfo;
    }

    // 格式化文件大小
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 创建压缩包
    createZipArchive() {
        return new Promise((resolve, reject) => {
            const zipPath = path.join(this.backupDir, `${this.backupName}.zip`);
            const output = fs.createWriteStream(zipPath);
            const archive = archiver('zip', {
                zlib: { level: 9 } // 最高压缩级别
            });

            output.on('close', () => {
                const zipSize = archive.pointer();
                resolve({
                    zipPath,
                    zipSize,
                    zipSizeFormatted: this.formatBytes(zipSize)
                });
            });

            archive.on('error', (err) => {
                reject(err);
            });

            archive.pipe(output);
            archive.directory(this.backupPath, this.backupName);
            archive.finalize();
        });
    }

    // 生成备份报告
    generateReport(backupInfo, zipInfo) {
        const report = `
# SDI奥德考试报名表单系统 - 备份报告

## 备份信息
- **备份时间**: ${backupInfo.timestamp}
- **备份名称**: ${backupInfo.backupName}
- **项目版本**: ${backupInfo.version}

## 文件统计
- **文件总数**: ${backupInfo.fileCount}
- **总大小**: ${backupInfo.totalSizeFormatted}
- **压缩后大小**: ${zipInfo.zipSizeFormatted}
- **压缩率**: ${((1 - zipInfo.zipSize / backupInfo.totalSize) * 100).toFixed(1)}%

## 备份内容
包含以下主要文件：
- 前端文件：index.html, styles.css, script.js
- 后端文件：server.js, googleSheetsService.js, config.js
- 配置文件：package.json, package-lock.json
- 数据文件：submissions.json, *.json
- 文档文件：README.md, *.md
- 资源文件：public/, uploads/
- 其他重要文件

## 恢复说明
1. 解压缩文件到目标目录
2. 运行 \`npm install\` 安装依赖
3. 配置环境变量（如有需要）
4. 运行 \`npm start\` 启动服务

## 备份位置
- **文件夹**: ${this.backupPath}
- **压缩包**: ${zipInfo.zipPath}

---
*备份完成时间: ${new Date().toLocaleString('zh-CN')}*
        `.trim();

        const reportPath = path.join(this.backupDir, `${this.backupName}_REPORT.md`);
        fs.writeFileSync(reportPath, report);

        return { reportPath, report };
    }

    // 执行备份
    async executeBackup() {
        try {
            console.log('🚀 开始备份 SDI奥德考试报名表单系统...');
            console.log(`📁 备份目录: ${this.backupPath}`);
            
            // 1. 创建备份目录
            this.createBackupDir();
            console.log('✅ 备份目录创建完成');
            
            // 2. 复制项目文件
            console.log('📋 正在复制项目文件...');
            this.copyDirectory(this.projectRoot, this.backupPath);
            console.log('✅ 项目文件复制完成');
            
            // 3. 生成备份信息
            const backupInfo = this.generateBackupInfo();
            console.log(`✅ 备份信息生成完成 (${backupInfo.fileCount} 个文件, ${backupInfo.totalSizeFormatted})`);
            
            // 4. 创建压缩包
            console.log('🗜️  正在创建压缩包...');
            const zipInfo = await this.createZipArchive();
            console.log(`✅ 压缩包创建完成 (${zipInfo.zipSizeFormatted})`);
            
            // 5. 生成备份报告
            const { reportPath, report } = this.generateReport(backupInfo, zipInfo);
            console.log(`✅ 备份报告生成完成`);
            
            // 6. 清理临时文件夹（可选）
            // fs.rmSync(this.backupPath, { recursive: true, force: true });
            
            console.log('\n🎉 备份完成！');
            console.log(`📦 压缩包位置: ${zipInfo.zipPath}`);
            console.log(`📄 备份报告: ${reportPath}`);
            console.log(`💾 压缩包大小: ${zipInfo.zipSizeFormatted}`);
            
            return {
                success: true,
                backupInfo,
                zipInfo,
                reportPath
            };
            
        } catch (error) {
            console.error('❌ 备份失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// 如果作为主程序运行
if (require.main === module) {
    const backup = new ProjectBackup();
    backup.executeBackup().then(result => {
        if (result.success) {
            console.log('\n🎊 备份成功完成！');
            process.exit(0);
        } else {
            console.error('\n💥 备份失败！');
            process.exit(1);
        }
    });
}

module.exports = ProjectBackup; 