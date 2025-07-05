const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');
const GoogleSheetsService = require('./googleSheetsService');

const app = express();
const PORT = process.env.PORT || 3000;

// 初始化Google Sheets服务
const googleSheetsService = new GoogleSheetsService();

// Google Apps Script Web App URL（用户需要配置）
const GOOGLE_APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL || '';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                            'application/msword', 'application/pdf', 'image/jpeg', 'image/png'];
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

// Serve static files
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(uploadsDir));

// API endpoint for form submission with file upload
app.post('/api/submit', upload.single('signedDocument'), async (req, res) => {
    try {
        const formData = req.body;
        
        // Add file information
        if (req.file) {
            formData.signedDocument = {
                originalName: req.file.originalname,
                filename: req.file.filename,
                size: req.file.size,
                mimetype: req.file.mimetype,
                uploadPath: `/uploads/${req.file.filename}`
            };
        }
        
        // Add timestamp
        formData.timestamp = new Date().toISOString();
        
        // Save to file (in a real application, you'd save to a database)
        const submissionsFile = path.join(__dirname, 'submissions.json');
        let submissions = [];
        
        try {
            if (fs.existsSync(submissionsFile)) {
                const fileContent = fs.readFileSync(submissionsFile, 'utf8');
                submissions = JSON.parse(fileContent);
            }
        } catch (error) {
            console.error('Error reading submissions file:', error);
        }
        
        submissions.push(formData);
        
        try {
            // 保存到本地JSON文件
            fs.writeFileSync(submissionsFile, JSON.stringify(submissions, null, 2));
            
            // 发送到Google Sheets
            const sheetsResult = await googleSheetsService.sendToGoogleSheets(formData);
            
            // 如果配置了Google Apps Script URL，尝试发送数据
            let googleSheetsStatus = 'Not configured';
            if (GOOGLE_APPS_SCRIPT_URL) {
                try {
                    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            rowData: sheetsResult.rowData,
                            formData: sheetsResult.data
                        })
                    });
                    
                    const result = await response.json();
                    googleSheetsStatus = result.success ? 'Success' : `Error: ${result.error}`;
                } catch (err) {
                    console.error('Error sending to Google Sheets:', err);
                    googleSheetsStatus = `Error: ${err.message}`;
                }
            }
            
            console.log('Form submission processed:', {
                localSave: 'Success',
                googleSheets: googleSheetsStatus,
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
                googleSheetsStatus: googleSheetsStatus
            });
        } catch (error) {
            console.error('Error saving submission:', error);
            res.status(500).json({ success: false, message: 'Error saving submission' });
        }
    } catch (error) {
        console.error('Error processing form submission:', error);
        res.status(500).json({ success: false, message: 'Error processing submission' });
    }
});

// API endpoint for payment proof upload
app.post('/api/submit-payment-proof', upload.single('paymentProof'), async (req, res) => {
    try {
        const paymentData = req.body;
        
        // Add file information
        if (req.file) {
            paymentData.paymentProof = {
                originalName: req.file.originalname,
                filename: req.file.filename,
                size: req.file.size,
                mimetype: req.file.mimetype,
                uploadPath: `/uploads/${req.file.filename}`
            };
        }
        
        // Add timestamp
        paymentData.paymentSubmissionTime = new Date().toISOString();
        
        // Save to payment submissions file
        const paymentsFile = path.join(__dirname, 'payment_submissions.json');
        let payments = [];
        
        try {
            if (fs.existsSync(paymentsFile)) {
                const fileContent = fs.readFileSync(paymentsFile, 'utf8');
                payments = JSON.parse(fileContent);
            }
        } catch (error) {
            console.error('Error reading payment submissions file:', error);
        }
        
        payments.push(paymentData);
        
        try {
            // 保存到本地JSON文件
            fs.writeFileSync(paymentsFile, JSON.stringify(payments, null, 2));
            
            // 发送到Google Sheets（付费凭证表）
            const sheetsResult = await googleSheetsService.sendPaymentProofToGoogleSheets(paymentData);
            
            console.log('Payment proof submission processed:', {
                localSave: 'Success',
                studentName: `${paymentData.firstName} ${paymentData.lastName}`,
                paymentProof: paymentData.paymentProof ? 
                    `${paymentData.paymentProof.originalName} (${paymentData.paymentProof.filename})` : 
                    'No file'
            });
            
            res.json({ 
                success: true, 
                message: 'Payment proof submitted successfully'
            });
        } catch (error) {
            console.error('Error saving payment proof:', error);
            res.status(500).json({ success: false, message: 'Error saving payment proof' });
        }
    } catch (error) {
        console.error('Error processing payment proof submission:', error);
        res.status(500).json({ success: false, message: 'Error processing payment proof submission' });
    }
});

// API endpoint to get all submissions (for admin purposes)
app.get('/api/submissions', (req, res) => {
    const submissionsFile = path.join(__dirname, 'submissions.json');
    
    try {
        if (fs.existsSync(submissionsFile)) {
            const fileContent = fs.readFileSync(submissionsFile, 'utf8');
            const submissions = JSON.parse(fileContent);
            res.json(submissions);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error('Error reading submissions:', error);
        res.status(500).json({ error: 'Error reading submissions' });
    }
});

// API endpoint to get all payment submissions (for admin purposes)
app.get('/api/payment-submissions', (req, res) => {
    const paymentsFile = path.join(__dirname, 'payment_submissions.json');
    
    try {
        if (fs.existsSync(paymentsFile)) {
            const fileContent = fs.readFileSync(paymentsFile, 'utf8');
            const payments = JSON.parse(fileContent);
            res.json(payments);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error('Error reading payment submissions:', error);
        res.status(500).json({ error: 'Error reading payment submissions' });
    }
});

// Download template file
app.get('/download-template', (req, res) => {
    const templatePath = path.join(__dirname, 'public', 'SDI_exam_notification.docx');
    
    if (fs.existsSync(templatePath)) {
        res.download(templatePath, 'SDI_exam_notification.docx', (err) => {
            if (err) {
                console.error('Error downloading template:', err);
                res.status(500).send('Error downloading template file');
            }
        });
    } else {
        res.status(404).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>模板文件未找到</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
                    .error { color: #e74c3c; }
                    .info { color: #3498db; margin-top: 20px; }
                </style>
            </head>
            <body>
                <h1 class="error">模板文件未找到</h1>
                <p>请联系管理员上传模板文件</p>
                <div class="info">
                    <p>文件应该放在: /public/SDI_exam_notification.docx</p>
                </div>
                <a href="/">返回报名表</a>
            </body>
            </html>
        `);
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Admin page to view submissions
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Google Sheets setup page
app.get('/setup', (req, res) => {
    res.sendFile(path.join(__dirname, 'setup.html'));
});

// API endpoint to get Google Apps Script code
app.get('/api/google-apps-script', (req, res) => {
    const scriptCode = googleSheetsService.generateGoogleAppsScriptCode();
    res.json({ 
        success: true, 
        scriptCode: scriptCode,
        instructions: `
1. 打开您的Google Sheets文档: https://docs.google.com/spreadsheets/d/1e7IBYNKiEvdZOscI0YaBK9uk6ReymltU0bWHJZ1e3D8/edit
2. 点击 "扩展程序" > "Apps Script"
3. 删除默认代码，粘贴下面的代码
4. 保存并部署为Web应用
5. 将Web应用URL配置到环境变量中
        `
    });
});

// 404 handler
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

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Form available at: http://localhost:${PORT}`);
    console.log(`⚙️  Admin panel at: http://localhost:${PORT}/admin`);
    console.log(`📊 API endpoints:`);
    console.log(`   - POST /api/submit - Submit form data`);
    console.log(`   - POST /api/submit-payment-proof - Submit payment proof`);
    console.log(`   - GET /api/submissions - View all submissions`);
    console.log(`   - GET /api/payment-submissions - View all payment submissions`);
}); 