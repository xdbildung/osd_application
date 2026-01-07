// ============================================
// Process Form Data - 处理表单数据
// 更新日期: 2026-01-07
// 版本: v2.0 (支持 Supabase 动态数据)
// ============================================
// 
// 使用说明：
// 1. 在 n8n 中打开 "Process Form Data" 节点
// 2. 将此代码复制粘贴到 JavaScript Code 编辑器中
// 3. 保存并激活工作流
// ============================================

const items = $input.all();

// ============================================
// 地点代码映射配置（支持所有城市）
// ============================================
const locationMapping = {
  'CD': '成都',
  'BJ': '北京',
  'SH': '上海',
  'GZ': '广州',
  'SZ': '深圳',
  'HZ': '杭州',
  'NJ': '南京',
  'WX': '无锡',
  'XA': '西安',
  'QD': '青岛',
  'ZZ': '郑州'
};

// 反向映射（中文到代码）
const reverseLocationMapping = {};
Object.keys(locationMapping).forEach(code => {
  reverseLocationMapping[locationMapping[code]] = code;
});

// ============================================
// 考试模块类型映射
// ============================================
const moduleMapping = {
  'Full': '全科',
  'Written': '笔试',
  'Oral': '口试',
  'Listening': '听力',
  'Reading': '阅读',
  'VIP': 'VIP专场'
};

// 等级映射
const levelMapping = {
  'A1': 'A1等级考试',
  'A2': 'A2等级考试',
  'B1': 'B1等级考试'
};

// ============================================
// 辅助函数
// ============================================

// 解析考试代码为详细信息
function parseExamCode(sessionCode) {
  const parts = sessionCode.split('_');
  if (parts.length < 3) return null;
  
  const level = parts[0];        // A1, A2, B1
  const locationCode = parts[1];  // CD, BJ, WX 等
  const module = parts[2];        // Full, Written, Oral 等
  
  return {
    level,
    locationCode,
    locationName: locationMapping[locationCode] || locationCode,
    module,
    moduleName: moduleMapping[module] || module,
    displayName: `${level}${moduleMapping[module] || module}`
  };
}

// 格式化考试显示名称
function formatExamSessionDisplay(sessionCode) {
  const info = parseExamCode(sessionCode);
  if (!info) return sessionCode;
  return `${info.level}${info.moduleName}`;
}

// ============================================
// 处理每个表单项
// ============================================

for (let item of items) {
  // ========================================
  // 处理测试数据
  // ========================================
  if (item.json.body.test === true) {
    console.log('🧪 收到测试数据:', {
      applicationID: item.json.body.applicationID,
      couponCode: item.json.body.couponCode,
      couponApplied: item.json.body.couponApplied
    });
    continue; // 跳过测试数据的正常处理
  }

  // ========================================
  // 处理国籍字段
  // ========================================
  if (item.json.body.nationality === 'Other' && item.json.body.otherNationality) {
    item.json.body.nationality = item.json.body.otherNationality;
  }
  
  // ========================================
  // 🆕 处理专属代码信息
  // ========================================
  item.json.body.hasCoupon = item.json.body.couponApplied || false;
  item.json.body.couponCodeUsed = item.json.body.couponCode || '';
  
  // ========================================
  // 处理考试场次信息
  // ========================================
  if (item.json.body.examSessions) {
    const sessions = Array.isArray(item.json.body.examSessions) ? 
      item.json.body.examSessions : [item.json.body.examSessions];
    
    // 提取信息
    const levels = new Set();
    const locations = new Set();
    const locationCodes = new Set();
    const examDetails = [];
    
    sessions.forEach(sessionCode => {
      const info = parseExamCode(sessionCode);
      if (info) {
        levels.add(info.level);
        locations.add(info.locationName);
        locationCodes.add(info.locationCode);
        
        examDetails.push({
          code: sessionCode,
          level: info.level,
          location: info.locationName,
          locationCode: info.locationCode,
          module: info.module,
          displayName: info.displayName
        });
      }
    });
    
    // 设置考试等级
    const sortedLevels = Array.from(levels).sort();
    if (sortedLevels.length === 1) {
      item.json.body.examLevel = levelMapping[sortedLevels[0]] || `${sortedLevels[0]}等级考试`;
    } else {
      item.json.body.examLevel = sortedLevels
        .map(level => levelMapping[level] || `${level}等级考试`)
        .join('、');
    }
    
    // 🆕 设置考试日期（从前端传来，已包含地点信息）
    // 前端格式：examDate = "2026-03-15 (成都)"
    if (!item.json.body.examDate || item.json.body.examDate === 'TBD') {
      // 如果前端没有提供，尝试从 selectedVenues 构建
      if (item.json.body.selectedVenues && item.json.body.selectedVenues.length > 0) {
        const venue = item.json.body.selectedVenues[0];
        item.json.body.examDate = `TBD (${venue})`;
      } else {
        const locationNames = Array.from(locations);
        item.json.body.examDate = locationNames.length > 0 ? 
          `TBD (${locationNames[0]})` : 'TBD';
      }
    }
    
    // 设置考试场次显示（中文名称）
    const sessionNames = sessions.map(code => formatExamSessionDisplay(code));
    item.json.body.examSessionsDisplay = sessionNames.join('、');
    
    // 设置考试地点
    item.json.body.examLocations = Array.from(locations).join('、');
    item.json.body.examLocationCodes = Array.from(locationCodes).join(',');
    
    // 保存详细信息
    item.json.body.examDetails = examDetails;
    
  } else {
    // 没有选择考试场次
    item.json.body.examDate = 'TBD';
    item.json.body.examSessionsDisplay = '无';
    item.json.body.examLevel = 'N/A';
    item.json.body.examLocations = 'N/A';
    item.json.body.examLocationCodes = '';
  }
  
  // ========================================
  // 处理费用信息
  // ========================================
  
  // 总费用（必有）
  item.json.body.totalFee = item.json.body.totalFee || 0;
  
  // 🆕 处理费用明细HTML
  if (!item.json.body.feeDetailsHtml) {
    if (item.json.body.feeDetails && Array.isArray(item.json.body.feeDetails)) {
      // 生成费用明细HTML
      const feeDetailsHtml = item.json.body.feeDetails.map(detail => {
        let html = `<div style="display: flex; justify-content: space-between; margin: 5px 0;">
          <span>${detail.description}</span>`;
        
        // 🆕 如果有折扣，显示原价和折后价
        if (detail.isDiscounted && detail.originalFee && detail.discountedFee) {
          html += `<span>
            <span style="text-decoration: line-through; color: #999;">¥${detail.originalFee}</span>
            <strong style="color: #4CAF50; margin-left: 8px;">¥${detail.fee}</strong>
          </span>`;
        } else {
          html += `<span><strong>¥${detail.fee}</strong></span>`;
        }
        
        html += `</div>`;
        return html;
      }).join('');
      
      item.json.body.feeDetailsHtml = feeDetailsHtml;
    } else {
      item.json.body.feeDetailsHtml = '<div style="text-align: center; color: #666;">暂无费用信息</div>';
    }
  }
  
  // ========================================
  // 处理附件（护照、付款凭证等）
  // ========================================
  
  // 处理付款凭证
  if (item.json.body.paymentProof && item.json.body.paymentProof.content) {
    const paymentData = item.json.body.paymentProof;
    const binaryBuffer = Buffer.from(paymentData.content, 'base64');
    
    item.binary = item.binary || {};
    item.binary.paymentProof = {
      data: binaryBuffer,
      mimeType: paymentData.mimeType || 'application/octet-stream',
      fileName: paymentData.filename || 'payment_proof'
    };
    
    item.json.body.paymentUploaded = true;
  } else {
    item.json.body.paymentUploaded = false;
  }
  
  // 处理已签署文件
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
  
  // 处理护照上传
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
  
  // ========================================
  // 处理时间戳
  // ========================================
  
  if (!item.json.body.paymentSubmissionTime) {
    item.json.body.paymentSubmissionTime = new Date().toISOString();
  }
  
  // 格式化时间显示
  item.json.body.paymentSubmissionTimeFormatted = 
    new Date(item.json.body.paymentSubmissionTime).toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai'
    });
    
  item.json.body.originalSubmissionTimeFormatted = 
    new Date(item.json.body.timestamp).toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai'
    });
}

return items;
