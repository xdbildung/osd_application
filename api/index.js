const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');

const app = express();

// 警告：在Vercel环境中，文件系统是只读的
// 这里使用内存存储作为临时解决方案
// 生产环境建议使用数据库或云存储
let submissions = [];
let paymentSubmissions = [];

// 默认配置（减少对环境变量的依赖）
const config = {
    NODE_ENV: process.env.NODE_ENV || 'production',
    WEBHOOK_URL: process.env.WEBHOOK_URL || 'https://n8n.talentdual.com/webhook/submit-payment'
};

// 考试选项代码到中文名称的映射
const examSessionNameMap = {
    'A1_BJ_VIP': '北京A1全科（VIP专场）',
    'A1_CD_Full': '成都A1全科',
    'A1_CD_Written': '成都A1笔试',
    'A1_CD_Oral': '成都A1口试',
    'A2_CD_Full': '成都A2全科',
    'A2_CD_Written': '成都A2笔试',
    'A2_CD_Oral': '成都A2口试',
    'B1_CD_Full': '成都B1全科',
    'B1_CD_Listening': '成都B1听力',
    'B1_CD_Oral': '成都B1口语',
    'B1_CD_Reading': '成都B1阅读',
    'B1_CD_Written': '成都B1写作'
};

// 将考试选项代码转换为中文名称
function convertExamSessionsToChinese(examSessions) {
    if (!examSessions || !Array.isArray(examSessions)) {
        return '未选择考试科目';
    }
    
    return examSessions.map(session => {
        return examSessionNameMap[session] || session;
    }).join('、');
}

// 提取考试等级信息
function extractExamLevels(examSessions) {
    if (!examSessions || !Array.isArray(examSessions)) {
        return [];
    }
    
    const levels = new Set();
    examSessions.forEach(session => {
        if (session.startsWith('A1_')) {
            levels.add('A1');
        } else if (session.startsWith('A2_')) {
            levels.add('A2');
        } else if (session.startsWith('B1_')) {
            levels.add('B1');
        }
    });
    
    return Array.from(levels).sort();
}

// 生成考试场次显示信息
function generateExamSessionsDisplay(examSessions) {
    if (!examSessions || !Array.isArray(examSessions)) {
        return '未选择考试科目';
    }
    
    return convertExamSessionsToChinese(examSessions);
}

// 生成考试日期信息
function generateExamDate(examSessions) {
    if (!examSessions || !Array.isArray(examSessions)) {
        return '待定';
    }
    
    const cityDateMap = {
        'BJ': '2025/9/6 (北京)',
        'CD': '2025/8/27 (成都)'
    };
    
    const cities = new Set();
    examSessions.forEach(session => {
        if (session.includes('_BJ_')) {
            cities.add('BJ');
        } else if (session.includes('_CD_')) {
            cities.add('CD');
        }
    });
    
    const cityDates = Array.from(cities).map(city => cityDateMap[city]).sort();
    return cityDates.length > 0 ? cityDates.join('； ') : '待定';
}

// 配置multer使用内存存储
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
            'application/msword', 
            'application/pdf', 
            'image/jpeg', 
            'image/png'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传Word文档(.doc/.docx)、PDF文件或图片文件(.jpg/.png)'));
        }
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 根路径处理 - 提供index.html
app.get('/', (req, res) => {
    try {
        // 在Vercel环境中，尝试读取index.html
        const indexPath = path.join(__dirname, '..', 'index.html');
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            // 如果找不到文件，返回基本的HTML响应
            res.status(404).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>页面未找到</title>
                    <meta charset="UTF-8">
                </head>
                <body>
                    <h1>页面未找到</h1>
                    <p>请检查URL是否正确。</p>
                    <p>如果问题持续存在，请联系技术支持。</p>
                </body>
                </html>
            `);
        }
    } catch (error) {
        console.error('Error serving index.html:', error);
        res.status(500).send('Internal Server Error');
    }
});

// API endpoint for form submission
app.post('/api/submit', async (req, res) => {
    try {
        const formData = req.body;
        
        // 转换考试选项代码为中文名称
        if (formData.examSessions) {
            formData.examSessionsChinese = convertExamSessionsToChinese(formData.examSessions);
            formData.examSessionsDisplay = generateExamSessionsDisplay(formData.examSessions);
            formData.examLevel = extractExamLevels(formData.examSessions).join('、');
            formData.examDate = generateExamDate(formData.examSessions);
        }
        
        // 添加时间戳 - 使用北京时间
        const beijingTime = new Date(new Date().getTime() + (8 * 60 * 60 * 1000));
        formData.timestamp = beijingTime.toISOString();
        
        // 存储到内存数组
        submissions.push(formData);
        
        // 在这里可以添加发送到Google Sheets的逻辑
        console.log('Form submission processed:', {
            localSave: 'Success (Memory)',
            dataCount: submissions.length,
            studentName: `${formData.firstName} ${formData.lastName}`,
            examSessions: formData.examSessionsChinese || '未选择考试科目',
            examSessionsDisplay: formData.examSessionsDisplay || '未选择考试科目',
            examLevel: formData.examLevel || '未选择等级',
            examDate: formData.examDate || '待定',
            formData: formData
        });
        
        res.json({ 
            success: true, 
            message: 'Form submitted successfully',
            submissionCount: submissions.length
        });
    } catch (error) {
        console.error('Error processing form submission:', error);
        res.status(500).json({ success: false, message: 'Error processing submission' });
    }
});

// API endpoint for payment proof upload
app.post('/api/submit-payment-proof', upload.single('paymentProof'), async (req, res) => {
    try {
        const paymentData = req.body;
        
        // 处理文件信息
        if (req.file) {
            paymentData.paymentProof = {
                originalName: req.file.originalname,
                filename: `payment-${Date.now()}-${req.file.originalname}`,
                size: req.file.size,
                mimetype: req.file.mimetype,
                buffer: req.file.buffer.toString('base64')
            };
        }
        
        // 转换考试选项代码为中文名称
        if (paymentData.examSessions) {
            paymentData.examSessionsChinese = convertExamSessionsToChinese(paymentData.examSessions);
            paymentData.examSessionsDisplay = generateExamSessionsDisplay(paymentData.examSessions);
            paymentData.examLevel = extractExamLevels(paymentData.examSessions).join('、');
            paymentData.examDate = generateExamDate(paymentData.examSessions);
        }
        
        // 添加时间戳 - 使用北京时间
        const beijingTime = new Date(new Date().getTime() + (8 * 60 * 60 * 1000));
        paymentData.paymentSubmissionTime = beijingTime.toISOString();
        
        // 存储到内存数组
        paymentSubmissions.push(paymentData);
        
        console.log('Payment proof submission processed:', {
            localSave: 'Success (Memory)',
            dataCount: paymentSubmissions.length,
            studentName: `${paymentData.firstName} ${paymentData.lastName}`,
            examSessions: paymentData.examSessionsChinese || '未选择考试科目',
            examSessionsDisplay: paymentData.examSessionsDisplay || '未选择考试科目',
            examLevel: paymentData.examLevel || '未选择等级',
            examDate: paymentData.examDate || '待定',
            paymentProof: paymentData.paymentProof ? 
                `${paymentData.paymentProof.originalName} (${paymentData.paymentProof.filename})` : 
                'No file'
        });
        
        res.json({ 
            success: true, 
            message: 'Payment proof submitted successfully',
            submissionCount: paymentSubmissions.length
        });
    } catch (error) {
        console.error('Error processing payment proof submission:', error);
        res.status(500).json({ success: false, message: 'Error processing payment proof submission' });
    }
});

// API endpoint to get all submissions
app.get('/api/submissions', (req, res) => {
    res.json(submissions);
});

// API endpoint to get all payment submissions
app.get('/api/payment-submissions', (req, res) => {
    res.json(paymentSubmissions);
});

// 开发配置API端点
app.get('/api/dev-config', (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const devConfigPath = path.join(__dirname, '..', 'dev-config.json');
        
        if (fs.existsSync(devConfigPath)) {
            const configData = fs.readFileSync(devConfigPath, 'utf8');
            const config = JSON.parse(configData);
            console.log('🔧 开发配置已加载:', config);
            res.json(config);
        } else {
            console.log('No dev-config.json found, running in production mode');
            res.json({ isDevelopment: false });
        }
    } catch (error) {
        console.error('Error reading dev-config.json:', error);
        res.json({ isDevelopment: false });
    }
});

// 模板文件下载
app.get('/download-template', (req, res) => {
    const filePath = path.join(__dirname, '..', 'public', 'SDI奥德考试中心报名须知.docx');
    
    // 检查文件是否存在
    if (require('fs').existsSync(filePath)) {
        res.download(filePath, 'SDI奥德考试中心报名须知.docx', (err) => {
            if (err) {
                console.error('文件下载错误:', err);
                res.status(500).send(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>下载错误</title>
                        <style>
                            body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
                            .error { color: #e74c3c; }
                        </style>
                    </head>
                    <body>
                        <h1 class="error">文件下载失败</h1>
                        <p>请联系管理员获取模板文件</p>
                        <p>邮箱: info@sdi-osd.de</p>
                        <a href="/">返回报名表</a>
                    </body>
                    </html>
                `);
            }
        });
    } else {
        res.status(404).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>文件未找到</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
                    .error { color: #e74c3c; }
                </style>
            </head>
            <body>
                <h1 class="error">模板文件未找到</h1>
                <p>请联系管理员获取模板文件</p>
                <p>邮箱: info@sdi-osd.de</p>
                <a href="/">返回报名表</a>
            </body>
            </html>
        `);
    }
});

// 管理页面
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin.html'));
});

// 设置页面
app.get('/setup', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'setup.html'));
});

// 404 处理
app.use((req, res) => {
    res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>404 - Page Not Found</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
                .error { color: #e74c3c; }
            </style>
        </head>
        <body>
            <h1 class="error">404 - Page Not Found</h1>
            <p>The page you're looking for doesn't exist.</p>
            <a href="/">Go back to the form</a>
        </body>
        </html>
    `);
});

// 导出应用程序供Vercel使用
module.exports = app; 