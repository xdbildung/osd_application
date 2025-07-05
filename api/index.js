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
app.post('/api/submit', upload.single('signedDocument'), async (req, res) => {
    try {
        const formData = req.body;
        
        // 处理文件信息
        if (req.file) {
            formData.signedDocument = {
                originalName: req.file.originalname,
                filename: `${Date.now()}-${req.file.originalname}`,
                size: req.file.size,
                mimetype: req.file.mimetype,
                // 在生产环境中，应该将文件上传到云存储
                buffer: req.file.buffer.toString('base64')
            };
        }
        
        // 添加时间戳
        formData.timestamp = new Date().toISOString();
        
        // 存储到内存数组
        submissions.push(formData);
        
        // 在这里可以添加发送到Google Sheets的逻辑
        console.log('Form submission processed:', {
            localSave: 'Success (Memory)',
            dataCount: submissions.length,
            formData: {
                ...formData,
                signedDocument: formData.signedDocument ? 
                    `${formData.signedDocument.originalName} (${formData.signedDocument.filename})` : 
                    'No file'
            }
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
        
        // 添加时间戳
        paymentData.paymentSubmissionTime = new Date().toISOString();
        
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
    res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>模板文件下载</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
                .info { color: #3498db; margin-top: 20px; }
            </style>
        </head>
        <body>
            <h1>模板文件下载</h1>
            <p>请联系管理员获取模板文件</p>
            <div class="info">
                <p>邮箱: info@sdi-osd.de</p>
            </div>
            <a href="/">返回报名表</a>
        </body>
        </html>
    `);
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