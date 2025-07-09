// Process payment proof data and attachments
const items = $input.all();

// 考试场次代码到中文名称的映射
const examSessionMapping = {
  // 北京考场
  'A1_BJ_VIP': 'A1全科（VIP专场）',
  
  // 成都考场 - A1等级
  'A1_CD_Full': 'A1全科',
  'A1_CD_Written': 'A1笔试',
  'A1_CD_Oral': 'A1口试',
  
  // 成都考场 - A2等级
  'A2_CD_Full': 'A2全科',
  'A2_CD_Written': 'A2笔试',
  'A2_CD_Oral': 'A2口试',
  
  // 成都考场 - B1等级
  'B1_CD_Full': 'B1全科',
  'B1_CD_Listening': 'B1听力',
  'B1_CD_Oral': 'B1口语',
  'B1_CD_Reading': 'B1阅读',
  'B1_CD_Written': 'B1写作'
};

// 考试场次代码到考试日期的映射
const examDateMapping = {
      'A1_BJ_VIP': '2025/9/13 (北京)',
  'A1_CD_Full': '2025/8/27 (成都)',
  'A1_CD_Written': '2025/8/27 (成都)',
  'A1_CD_Oral': '2025/8/27 (成都)',
  'A2_CD_Full': '2025/8/27 (成都)',
  'A2_CD_Written': '2025/8/27 (成都)',
  'A2_CD_Oral': '2025/8/27 (成都)',
  'B1_CD_Full': '2025/8/27 (成都)',
  'B1_CD_Listening': '2025/8/27 (成都)',
  'B1_CD_Oral': '2025/8/27 (成都)',
  'B1_CD_Reading': '2025/8/27 (成都)',
  'B1_CD_Written': '2025/8/27 (成都)'
};

// 考试等级映射
const examLevelMapping = {
  'A1': 'A1等级考试',
  'A2': 'A2等级考试', 
  'B1': 'B1等级考试'
};

for (let item of items) {
  // Handle nationality field
  if (item.json.body.nationality === 'Other' && item.json.body.otherNationality) {
    item.json.body.nationality = item.json.body.otherNationality;
  }
  
  // Process exam sessions to determine exam level and exam date
  if (item.json.body.examSessions) {
    const sessions = Array.isArray(item.json.body.examSessions) ? 
      item.json.body.examSessions : [item.json.body.examSessions];
    
    // Extract exam levels and locations from session codes
    const levels = new Set();
    const locations = new Set();
    const examDetails = [];
    const examDates = new Set();
    
    sessions.forEach(sessionCode => {
      // 解析考试场次代码
      const parts = sessionCode.split('_');
      if (parts.length >= 3) {
        const level = parts[0];     // A1, A2, B1
        const location = parts[1];  // BJ (北京), CD (成都)
        const module = parts[2];    // VIP, Full, Written, Oral, Listening, Reading
        
        // 转换位置代码为中文
        const locationChinese = location === 'BJ' ? '北京' : '成都';
        
        // 获取中文名称
        const sessionName = examSessionMapping[sessionCode] || sessionCode;
        
        // 获取考试日期
        const examDate = examDateMapping[sessionCode] || 'TBD';
        
        levels.add(level);
        locations.add(locationChinese);
        examDates.add(examDate);
        
        examDetails.push({
          location: locationChinese,
          level: level,
          module: module,
          sessionCode: sessionCode,
          sessionName: sessionName,
          examDate: examDate
        });
      }
    });
    
    // Set exam level (显示格式：A1、A2等级考试)
    if (!item.json.body.examLevel || item.json.body.examLevel === '') {
      const sortedLevels = Array.from(levels).sort();
      if (sortedLevels.length === 1) {
        item.json.body.examLevel = examLevelMapping[sortedLevels[0]] || `${sortedLevels[0]}等级考试`;
      } else {
        item.json.body.examLevel = sortedLevels.map(level => examLevelMapping[level] || `${level}等级考试`).join('、');
      }
    }
    
    // Set exam date based on selected sessions
    const uniqueDates = Array.from(examDates);
    if (uniqueDates.length === 1) {
      item.json.body.examDate = uniqueDates[0];
    } else if (uniqueDates.length > 1) {
      // 如果有多个日期，按日期排序
      item.json.body.examDate = uniqueDates.sort().join('； ');
    } else {
      item.json.body.examDate = 'TBD';
    }
    
    // Set exam sessions display (中文名称)
    const sessionNames = sessions.map(code => examSessionMapping[code] || code);
    item.json.body.examSessionsDisplay = sessionNames.join('、');
    
    item.json.body.examDetails = examDetails;
  } else {
    item.json.body.examDate = 'TBD';
    item.json.body.examSessionsDisplay = '无';
    item.json.body.examLevel = 'N/A';
  }
  
  // Process payment proof attachment
  if (item.json.body.paymentProof && item.json.body.paymentProof.content) {
    const paymentData = item.json.body.paymentProof;
    
    // Convert base64 to binary buffer
    const binaryBuffer = Buffer.from(paymentData.content, 'base64');
    
    // Create binary data property for payment proof
    item.binary = item.binary || {};
    item.binary.paymentProof = {
      data: binaryBuffer,
      mimeType: paymentData.mimeType || 'application/octet-stream',
      fileName: paymentData.filename || 'payment_proof'
    };
    
    // Mark payment as uploaded
    item.json.body.paymentUploaded = true;
  } else {
    item.json.body.paymentUploaded = false;
  }
  
  // Process signed document if still present
  if (item.json.body.signedDocument && item.json.body.signedDocument.content) {
    const attachmentData = item.json.body.signedDocument;
    const binaryBuffer = Buffer.from(attachmentData.content, 'base64');
    
    item.binary = item.binary || {};
    item.binary.signedDocument = {
      data: binaryBuffer,
      mimeType: attachmentData.mimeType || 'application/octet-stream',
      fileName: attachmentData.filename || 'signed_document'
    };
  }
  
  // Process passport upload if present
  if (item.json.body.passportUpload && item.json.body.passportUpload.content) {
    const passportData = item.json.body.passportUpload;
    const binaryBuffer = Buffer.from(passportData.content, 'base64');
    
    item.binary = item.binary || {};
    item.binary.passport = {
      data: binaryBuffer,
      mimeType: passportData.mimeType || 'application/octet-stream',
      fileName: passportData.filename || 'passport'
    };
  }
  
  // Add payment submission timestamp
  if (!item.json.body.paymentSubmissionTime) {
    item.json.body.paymentSubmissionTime = new Date().toISOString();
  }
  
  // Format timestamps for display
  item.json.body.paymentSubmissionTimeFormatted = new Date(item.json.body.paymentSubmissionTime).toLocaleString('zh-CN');
  item.json.body.originalSubmissionTimeFormatted = new Date(item.json.body.timestamp).toLocaleString('zh-CN');
}

return items;
