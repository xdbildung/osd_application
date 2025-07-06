const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');

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

// 静态文件服务
app.use(express.static(path.join(__dirname, '..')));

// API endpoint for form submission
app.post('/api/submit', async (req, res) => {
    try {
        const formData = req.body;
        
            // 添加时间戳 - 使用北京时间
    const beijingTime = new Date(new Date().getTime() + (8 * 60 * 60 * 1000));
    formData.timestamp = beijingTime.toISOString();
        
        // 存储到内存数组
        submissions.push(formData);
        
        // 在这里可以添加发送到Google Sheets的逻辑
        console.log('Form submission processed:', {
            localSave: 'Success (Memory)',
            dataCount: submissions.length,
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
        
            // 添加时间戳 - 使用北京时间
    const beijingTime = new Date(new Date().getTime() + (8 * 60 * 60 * 1000));
    paymentData.paymentSubmissionTime = beijingTime.toISOString();
        
        // 存储到内存数组
        paymentSubmissions.push(paymentData);
        
        console.log('Payment proof submission processed:', {
            localSave: 'Success (Memory)',
            dataCount: paymentSubmissions.length,
            studentName: `${paymentData.firstName} ${paymentData.lastName}`,
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


// 主页面
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
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