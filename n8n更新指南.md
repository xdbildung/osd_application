# n8n 工作流更新指南

## 📋 更新概述

由于前端实现了以下新功能，n8n 工作流需要同步更新：

### 新功能：
1. ✅ Supabase 数据库集成（动态场次和产品）
2. ✅ 专属代码（Coupon）功能
3. ✅ 地点代码化（CD, BJ, WX 等）
4. ✅ 单科组合自动转全科
5. ✅ 报名截止日期字段

### 新增的表单字段：
- `couponCode`: 专属代码
- `couponApplied`: 是否应用专属代码
- `selectedVenues`: 选中的场次（现在是中文名称数组）
- `examDate`: 考试日期（从数据库动态获取）

---

## 🔧 需要更新的节点

### 1. ✅ Process Form Data 节点（必须更新）
### 2. ✅ Google Sheets 节点（建议更新）
### 3. ⚠️ Email 节点（可选更新）

---

## 1️⃣ Process Form Data 节点

### 更新内容：
- 移除硬编码的日期映射
- 支持所有城市代码（11个城市）
- 处理专属代码信息
- 优化地点转换逻辑
- 支持动态场次数据

### 完整更新后的代码：

```javascript
// ============================================
// Process Form Data - 处理表单数据
// 更新日期: 2026-01-07
// 版本: v2.0 (支持 Supabase 动态数据)
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
```

---

## 2️⃣ Google Sheets 节点

### 建议添加的新列：

在 Google Sheets 中添加以下列（可选）：

1. **CouponCode** - 专属代码
2. **CouponApplied** - 是否使用专属代码
3. **ExamLocation** - 考试地点
4. **RegistrationDeadline** - 报名截止日期

### 更新映射配置：

在 Google Sheets 节点的 `columns` 配置中添加：

```javascript
{
  // ... 现有字段 ...
  
  "CouponCode": "={{ $json.body.couponCodeUsed }}",
  "CouponApplied": "={{ $json.body.hasCoupon ? 'TRUE' : 'FALSE' }}",
  "ExamLocation": "={{ $json.body.examLocations }}",
  "ExamLocationCode": "={{ $json.body.examLocationCodes }}"
}
```

### 更新考试科目列的逻辑：

由于现在支持多城市，建议使用动态方式：

#### 选项 A：保持现有列结构（推荐）

继续使用固定列（A1_CD_Written, A1_CD_Oral 等），但添加新城市的列：

```javascript
// 无锡 A1
"A1_WX_Written": "={{ $json.body.examSessions ? ($json.body.examSessions.join(',').includes('A1_WX_Written') || $json.body.examSessions.join(',').includes('A1_WX_Full') ? 'TRUE' : 'FALSE') : 'FALSE' }}",
"A1_WX_Oral": "={{ $json.body.examSessions ? ($json.body.examSessions.join(',').includes('A1_WX_Oral') || $json.body.examSessions.join(',').includes('A1_WX_Full') ? 'TRUE' : 'FALSE') : 'FALSE' }}",

// 北京 A1
"A1_BJ_Written": "={{ $json.body.examSessions ? ($json.body.examSessions.join(',').includes('A1_BJ_Written') || $json.body.examSessions.join(',').includes('A1_BJ_Full') ? 'TRUE' : 'FALSE') : 'FALSE' }}",
"A1_BJ_Oral": "={{ $json.body.examSessions ? ($json.body.examSessions.join(',').includes('A1_BJ_Oral') || $json.body.examSessions.join(',').includes('A1_BJ_Full') ? 'TRUE' : 'FALSE') : 'FALSE' }}",

// ... 其他城市和等级 ...
```

#### 选项 B：使用合并列（简化方案）

只保留等级列，不区分城市：

```javascript
"A1_Written": "={{ $json.body.examSessions ? $json.body.examSessions.some(s => s.includes('A1') && s.includes('Written')) ? 'TRUE' : 'FALSE' : 'FALSE' }}",
"A1_Oral": "={{ $json.body.examSessions ? $json.body.examSessions.some(s => s.includes('A1') && s.includes('Oral')) ? 'TRUE' : 'FALSE' : 'FALSE' }}",
```

---

## 3️⃣ Email 节点（学生邮件）

### 可选更新：在邮件中显示专属代码信息

在学生确认邮件的 HTML 中添加专属代码信息：

```html
<!-- 在考试信息部分添加 -->
<div style="background: #FFF3E0; padding: 15px; border-radius: 8px; margin: 20px 0;">
  <h3>📚 考试信息</h3>
  <p>• <strong>考试场次：</strong>{{ $json.body.examSessionsDisplay }}</p>
  <p>• <strong>考试日期：</strong>{{ $json.body.examDate }}</p>
  <p>• <strong>考试等级：</strong>{{ $json.body.examLevel }}</p>
  <p>• <strong>考试地点：</strong>{{ $json.body.examLocations }}</p>
  
  <!-- 🆕 专属代码信息 -->
  {{ $json.body.hasCoupon ? '<p>• <strong>专属代码：</strong>' + $json.body.couponCodeUsed + ' <span style="color: #4CAF50;">✅ 已应用</span></p>' : '' }}
</div>
```

### 在费用信息部分添加折扣提示：

```html
<div style="background: #E3F2FD; padding: 15px; border-radius: 8px; margin: 20px 0;">
  <h3>💰 费用信息</h3>
  
  <!-- 费用明细 -->
  {{ $json.body.feeDetailsHtml }}
  
  <!-- 总费用 -->
  <div style="display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 2px solid #2196F3; font-size: 18px;">
    <span><strong>总计：</strong></span>
    <span><strong style="color: #2196F3;">¥{{ $json.body.totalFee }}</strong></span>
  </div>
  
  <!-- 🆕 折扣提示 -->
  {{ $json.body.hasCoupon ? '<p style="color: #4CAF50; margin-top: 10px; text-align: center;">✨ 已享受专属代码优惠</p>' : '' }}
</div>
```

---

## 4️⃣ Email 节点（管理员邮件）

### 更新内容：添加专属代码和地点信息

```html
<div style="background: #E8F5E8; padding: 15px; border-radius: 8px; margin: 20px 0;">
  <h3>👤 学生信息</h3>
  <p>• <strong>申请编号：</strong>{{ $json.body.applicationID }}</p>
  <p>• <strong>姓名：</strong>{{ $json.body.lastName }} {{ $json.body.firstName }}</p>
  <!-- ... 其他学生信息 ... -->
</div>

<div style="background: #FFF3E0; padding: 15px; border-radius: 8px; margin: 20px 0;">
  <h3>📚 考试信息</h3>
  <p>• <strong>考试场次：</strong>{{ $json.body.examSessionsDisplay }}</p>
  <p>• <strong>考试日期：</strong>{{ $json.body.examDate }}</p>
  <p>• <strong>考试等级：</strong>{{ $json.body.examLevel }}</p>
  <p>• <strong>考试地点：</strong>{{ $json.body.examLocations }}</p>
  
  <!-- 🆕 专属代码信息（管理员需要知道） -->
  {{ $json.body.hasCoupon ? 
    '<p>• <strong>使用专属代码：</strong>' + $json.body.couponCodeUsed + ' <span style="background: #4CAF50; color: white; padding: 2px 8px; border-radius: 3px;">已应用</span></p>' 
    : '<p>• <strong>专属代码：</strong>未使用</p>' 
  }}
</div>

<div style="background: #E3F2FD; padding: 15px; border-radius: 8px; margin: 20px 0;">
  <h3>💰 费用信息</h3>
  {{ $json.body.feeDetailsHtml }}
  <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #2196F3;">
    <p><strong>总费用：</strong><span style="font-size: 20px; color: #2196F3;">¥{{ $json.body.totalFee }}</span></p>
  </div>
</div>
```

---

## 📝 更新步骤总结

### 必须更新：
1. ✅ **Process Form Data 节点** - 复制上面的完整代码替换

### 建议更新：
2. ⚠️ **Google Sheets 节点** - 添加新列映射
3. ⚠️ **Email 节点** - 更新邮件模板

### 可选更新：
4. 📊 **Google Sheets** - 为新城市添加考试科目列

---

## 🧪 测试步骤

### 1. 更新后测试

在前端提交一个测试表单，包含：
- 选择非成都的城市（如无锡、杭州）
- 输入并验证专属代码
- 选择全科或单科考试

### 2. 检查 n8n 执行日志

查看 Process Form Data 节点的输出：
- `examDate` - 应该包含正确的日期和地点
- `examLocations` - 应该显示正确的城市名称
- `couponCodeUsed` - 应该显示专属代码
- `hasCoupon` - 应该为 true/false

### 3. 检查 Google Sheets

验证数据是否正确写入：
- 新列是否有数据
- 考试科目列是否正确
- 专属代码信息是否记录

### 4. 检查邮件

验证邮件内容：
- 考试地点显示正确
- 专属代码信息显示正确
- 费用明细包含折扣信息

---

## ⚠️ 注意事项

1. **向后兼容**：新代码兼容旧的数据格式
2. **地点扩展**：添加新城市只需在 `locationMapping` 中添加
3. **测试数据**：使用 `test: true` 标记测试提交
4. **错误处理**：代码包含完善的错误处理和日志

---

## 📞 如需帮助

如果更新过程中遇到问题：
1. 检查 n8n 执行日志
2. 查看前端控制台的提交数据
3. 验证数据结构是否匹配

---

**更新完成后，记得在 n8n 中保存并激活工作流！** 🎉
