module.exports = {
    // Google Sheets配置
    googleSheets: {
        spreadsheetId: '1e7IBYNKiEvdZOscI0YaBK9uk6ReymltU0bWHJZ1e3D8',
        // 服务账号密钥文件路径 - 需要用户提供
        // 或者使用API密钥进行简单认证
        // 注意：由于安全考虑，这里只能使用公开的方法或者让用户提供认证
        
        // 列映射 - 将表单字段映射到Google Sheets的列
        columnMapping: {
            'ChineseName': 'chineseName',      // lastName + firstName
            'FirstName': 'firstName',
            'LastName': 'lastName',
            'Gender': 'gender',
            'BirthDate': 'birthDate',
            'Nationality': 'nationality',
            'BirthPlace': 'birthPlace',
            'Passport': 'passportNumber',
            'E-mail': 'email',
            'Level': 'examLevel',
            'B1_Listening': 'b1Listening',
            'B1_Reading': 'b1Reading', 
            'B1_Writing': 'b1Writing',
            'B1_Speaking': 'b1Speaking',
            'A2_Written': 'a2Written',
            'A2_Oral': 'a2Oral',
            'A1_Written': 'a1Written',
            'A1_Oral': 'a1Oral',
            'Mobile': 'phoneNumber',
            'First_Time': 'firstTimeExam',
            'Reg_Time': 'timestamp',
            'TestDate': 'examDate'
        }
    },
    
    // 邮件配置（后续使用）
    email: {
        // 发送者邮箱配置
        smtp: {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: '', // 需要用户提供
                pass: ''  // 需要用户提供
            }
        },
        // 收件人
        recipient: '', // 需要用户提供
        // 邮件模板
        template: {
            subject: 'SDI考试报名申请 - {{firstName}} {{lastName}}',
            html: `
                <h2>新的考试报名申请</h2>
                <p><strong>报名时间：</strong>{{timestamp}}</p>
                <p><strong>学生姓名：</strong>{{lastName}} {{firstName}}</p>
                <p><strong>考试等级：</strong>{{examLevel}}</p>
                <p><strong>考试日期：</strong>{{examDate}}</p>
                <p><strong>联系邮箱：</strong>{{email}}</p>
                <p><strong>手机号码：</strong>{{phoneNumber}}</p>
                <hr>
                <p>详细信息请查看附件或访问管理面板。</p>
            `
        }
    }
}; 