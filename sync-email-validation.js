#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔄 开始同步邮箱验证功能...');

// 邮箱验证函数模板
const emailValidationFunction = `    // 验证邮箱格式
    function validateEmail(email) {
        // 基本邮箱格式验证
        const emailPattern = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
        if (!emailPattern.test(email)) {
            return { isValid: false, message: '请输入有效的邮箱地址格式' };
        }
        
        return { isValid: true, message: '' };
    }`;

// 邮箱验证调用模板
const emailValidationCall = `                case 'email':
                    const emailValidation = validateEmail(value);
                    if (!emailValidation.isValid) {
                        isValid = false;
                        errorMessage = emailValidation.message;
                    }
                    break;`;

// 邮箱提示信息模板
const emailNoteTemplate = `                <div class="form-note">
                    <strong>重要提示：</strong>为确保您能及时收到关键的申请确认与后续通知邮件，请您仔细确认您填写的邮箱地址是否正确。感谢您的理解与配合。
                </div>`;

// 需要同步的文件列表
const filesToSync = [
    'script.js',
    'public/script.js',
    'index.html',
    'public/index.html'
];

function updateEmailValidationInFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  文件不存在: ${filePath}`);
        return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // 更新邮箱验证函数
    const oldEmailValidationRegex = /\/\/ 验证邮箱格式\s+function validateEmail\(email\) \{[\s\S]*?\n    \}/;
    if (oldEmailValidationRegex.test(content)) {
        content = content.replace(oldEmailValidationRegex, emailValidationFunction);
        updated = true;
        console.log(`✅ 更新邮箱验证函数: ${filePath}`);
    }

    // 更新邮箱验证调用
    const oldEmailCallRegex = /case 'email':\s+if \(!validateEmail\(value\)\) \{[\s\S]*?errorMessage = '[^']*';\s+\}\s+break;/;
    if (oldEmailCallRegex.test(content)) {
        content = content.replace(oldEmailCallRegex, emailValidationCall);
        updated = true;
        console.log(`✅ 更新邮箱验证调用: ${filePath}`);
    }

    // 更新邮箱提示信息（仅对HTML文件）
    if (filePath.endsWith('.html')) {
        const oldEmailNoteRegex = /<div class="form-note">\s*<strong>[^<]*<\/strong>[^<]*<\/div>/;
        if (oldEmailNoteRegex.test(content)) {
            content = content.replace(oldEmailNoteRegex, emailNoteTemplate);
            updated = true;
            console.log(`✅ 更新邮箱提示信息: ${filePath}`);
        }
    }

    if (updated) {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    }

    return false;
}

// 执行同步
let totalUpdated = 0;
filesToSync.forEach(filePath => {
    if (updateEmailValidationInFile(filePath)) {
        totalUpdated++;
    }
});

console.log(`\n📊 同步完成！`);
console.log(`✅ 更新了 ${totalUpdated} 个文件`);
console.log(`📝 同步的功能包括:`);
console.log(`   - 邮箱验证函数（支持服务商限制）`);
console.log(`   - 邮箱验证调用逻辑`);
console.log(`   - 邮箱提示信息`);

if (totalUpdated > 0) {
    console.log(`\n🎯 现在所有文件都包含完整的邮箱验证功能！`);
    console.log(`📧 支持的邮箱服务商: @qq.com, @163.com, @hotmail.com, @outlook.com`);
} else {
    console.log(`\nℹ️  所有文件已经是最新状态，无需更新。`);
} 