const config = require('./config');

class GoogleSheetsService {
    constructor() {
        this.spreadsheetId = config.googleSheets.spreadsheetId;
        this.columnMapping = config.googleSheets.columnMapping;
    }

    // 将表单数据转换为Google Sheets行数据
    transformFormData(formData) {
        // 处理考试模块数据
        const examModules = Array.isArray(formData.examModules) ? formData.examModules : [formData.examModules];
        
        // 初始化所有考试模块字段为空
        const moduleFields = {
            b1Listening: '',
            b1Reading: '',
            b1Writing: '',
            b1Speaking: '',
            a2Written: '',
            a2Oral: '',
            a1Written: '',
            a1Oral: ''
        };

        // 根据选择的模块填充对应字段
        examModules.forEach(module => {
            if (module) {
                switch(module) {
                    case '单科B1-听力':
                        moduleFields.b1Listening = '✓';
                        break;
                    case '单科B1-阅读':
                        moduleFields.b1Reading = '✓';
                        break;
                    case '单科B1-写作':
                        moduleFields.b1Writing = '✓';
                        break;
                    case '单科B1-口语':
                        moduleFields.b1Speaking = '✓';
                        break;
                    case 'B1全科':
                        moduleFields.b1Listening = '✓';
                        moduleFields.b1Reading = '✓';
                        moduleFields.b1Writing = '✓';
                        moduleFields.b1Speaking = '✓';
                        break;
                    case '单科A2笔试':
                        moduleFields.a2Written = '✓';
                        break;
                    case '单科A2口试':
                        moduleFields.a2Oral = '✓';
                        break;
                    case 'A2全科':
                        moduleFields.a2Written = '✓';
                        moduleFields.a2Oral = '✓';
                        break;
                    case '单科A1笔试':
                        moduleFields.a1Written = '✓';
                        break;
                    case '单科A1口试':
                        moduleFields.a1Oral = '✓';
                        break;
                    case 'A1全科':
                        moduleFields.a1Written = '✓';
                        moduleFields.a1Oral = '✓';
                        break;
                }
            }
        });

        // 构建完整的数据对象
        const transformedData = {
            chineseName: `${formData.lastName || ''} ${formData.firstName || ''}`.trim(),
            firstName: formData.firstName || '',
            lastName: formData.lastName || '',
            gender: formData.gender || '',
            birthDate: formData.birthDate || '',
            nationality: formData.nationality || '',
            birthPlace: formData.birthPlace || '',
            passportNumber: formData.passportNumber || '',
            email: formData.email || '',
            examLevel: formData.examLevel || '',
            ...moduleFields,
            phoneNumber: formData.phoneNumber || '',
            firstTimeExam: formData.firstTimeExam || '',
            timestamp: new Date(formData.timestamp).toLocaleString('zh-CN') || '',
            examDate: formData.examDate || ''
        };

        return transformedData;
    }

    // 将数据对象转换为Google Sheets行数组
    dataToRowArray(data) {
        const headers = [
            'ChineseName', 'FirstName', 'LastName', 'Gender', 'BirthDate', 
            'Nationality', 'BirthPlace', 'Passport', 'E-mail', 'Level',
            'B1_Listening', 'B1_Reading', 'B1_Writing', 'B1_Speaking',
            'A2_Written', 'A2_Oral', 'A1_Written', 'A1_Oral',
            'Mobile', 'First_Time', 'Reg_Time', 'TestDate'
        ];

        return headers.map(header => {
            const fieldName = this.columnMapping[header];
            return data[fieldName] || '';
        });
    }

    // 使用Google Apps Script Web App URL发送数据
    async sendToGoogleSheets(formData) {
        try {
            const transformedData = this.transformFormData(formData);
            const rowData = this.dataToRowArray(transformedData);

            // 这里需要用户创建一个Google Apps Script Web App
            // 暂时返回转换后的数据，用于调试
            console.log('准备发送到Google Sheets的数据:', {
                transformedData,
                rowData
            });

            // TODO: 实际的Google Sheets写入逻辑
            // 用户需要创建Google Apps Script Web App来接收这些数据
            
            return {
                success: true,
                data: transformedData,
                rowData: rowData,
                message: 'Data prepared for Google Sheets'
            };

        } catch (error) {
            console.error('Google Sheets集成错误:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 处理付费凭证数据并发送到Google Sheets
    async sendPaymentProofToGoogleSheets(paymentData) {
        try {
            // 转换付费凭证数据
            const transformedPaymentData = this.transformPaymentData(paymentData);
            const rowData = this.paymentDataToRowArray(transformedPaymentData);

            console.log('准备发送到Google Sheets的付费凭证数据:', {
                transformedPaymentData,
                rowData
            });

            // TODO: 实际的Google Sheets写入逻辑
            // 用户需要创建Google Apps Script Web App来接收这些数据
            
            return {
                success: true,
                data: transformedPaymentData,
                rowData: rowData,
                message: 'Payment proof data prepared for Google Sheets'
            };

        } catch (error) {
            console.error('付费凭证Google Sheets集成错误:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 将付费凭证数据转换为Google Sheets行数据
    transformPaymentData(paymentData) {
        const selectedSessions = Array.isArray(paymentData.examSessions) 
            ? paymentData.examSessions 
            : [paymentData.examSessions];

        const transformedData = {
            chineseName: `${paymentData.lastName || ''} ${paymentData.firstName || ''}`.trim(),
            firstName: paymentData.firstName || '',
            lastName: paymentData.lastName || '',
            email: paymentData.email || '',
            phoneNumber: paymentData.phoneNumber || '',
            examSessions: selectedSessions.filter(session => session).join(', '),
            paymentProofFile: paymentData.paymentProof ? paymentData.paymentProof.originalName : '',
            paymentSubmissionTime: new Date(paymentData.paymentSubmissionTime).toLocaleString('zh-CN') || '',
            originalSubmissionTime: new Date(paymentData.timestamp).toLocaleString('zh-CN') || ''
        };

        return transformedData;
    }

    // 将付费凭证数据对象转换为Google Sheets行数组
    paymentDataToRowArray(data) {
        const headers = [
            'ChineseName', 'FirstName', 'LastName', 'Email', 'PhoneNumber',
            'ExamSessions', 'PaymentProofFile', 'PaymentSubmissionTime', 'OriginalSubmissionTime'
        ];

        return headers.map(header => {
            const fieldName = header.charAt(0).toLowerCase() + header.slice(1);
            return data[fieldName] || '';
        });
    }

    // 生成Google Apps Script代码（供用户使用）
    generateGoogleAppsScriptCode() {
        return `
function doPost(e) {
  try {
    // 获取当前活动的表格
    var sheet = SpreadsheetApp.getActiveSheet();
    
    // 解析接收到的数据
    var data = JSON.parse(e.postData.contents);
    var rowData = data.rowData;
    
    // 检查是否有标题行
    var lastRow = sheet.getLastRow();
    if (lastRow === 0) {
      // 添加标题行
      var headers = [
        'ChineseName', 'FirstName', 'LastName', 'Gender', 'BirthDate',
        'Nationality', 'BirthPlace', 'Passport', 'E-mail', 'Level',
        'B1_Listening', 'B1_Reading', 'B1_Writing', 'B1_Speaking',
        'A2_Written', 'A2_Oral', 'A1_Written', 'A1_Oral',
        'Mobile', 'First_Time', 'Reg_Time', 'TestDate'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      lastRow = 1;
    }
    
    // 添加新行数据
    sheet.getRange(lastRow + 1, 1, 1, rowData.length).setValues([rowData]);
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, message: 'Data added successfully'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 处理付费凭证数据的函数
function doPostPaymentProof(e) {
  try {
    // 获取付费凭证表格（假设是第二个工作表）
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('付费凭证') || ss.insertSheet('付费凭证');
    
    // 解析接收到的数据
    var data = JSON.parse(e.postData.contents);
    var rowData = data.rowData;
    
    // 检查是否有标题行
    var lastRow = sheet.getLastRow();
    if (lastRow === 0) {
      // 添加标题行
      var headers = [
        'ChineseName', 'FirstName', 'LastName', 'Email', 'PhoneNumber',
        'ExamSessions', 'PaymentProofFile', 'PaymentSubmissionTime', 'OriginalSubmissionTime'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      lastRow = 1;
    }
    
    // 添加新行数据
    sheet.getRange(lastRow + 1, 1, 1, rowData.length).setValues([rowData]);
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, message: 'Payment proof data added successfully'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
        `;
    }
}

module.exports = GoogleSheetsService; 