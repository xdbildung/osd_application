# n8n 工作流快速更新清单

## ✅ 需要更新的节点

### 1. Process Form Data 节点 ⭐ **必须更新**

**位置：** 在 Webhook Trigger 之后

**更新方法：**
1. 在 n8n 中打开工作流
2. 点击 "Process Form Data" 节点
3. 将 `Process_Form_Data_Updated.js` 中的代码**完全替换**现有代码
4. 点击"Execute Node"测试
5. 保存

**主要变化：**
- ✅ 支持 11 个城市（不再硬编码）
- ✅ 处理专属代码（couponCode, couponApplied）
- ✅ 动态地点映射
- ✅ 支持费用折扣显示
- ✅ 移除硬编码的日期映射

---

### 2. Google Sheets 节点 ⚠️ **建议更新**

**更新内容：** 添加新的列映射

**步骤：**
1. 在 Google Sheets 中添加新列：
   - `CouponCode`
   - `CouponApplied`
   - `ExamLocation`

2. 在 n8n 的 Google Sheets 节点配置中添加：

```javascript
"CouponCode": "={{ $json.body.couponCodeUsed }}",
"CouponApplied": "={{ $json.body.hasCoupon ? 'TRUE' : 'FALSE' }}",
"ExamLocation": "={{ $json.body.examLocations }}"
```

3. 如果需要支持新城市的科目列，添加（可选）：

```javascript
// 无锡 A1
"A1_WX_Written": "={{ $json.body.examSessions ? ($json.body.examSessions.join(',').includes('A1_WX_Written') || $json.body.examSessions.join(',').includes('A1_WX_Full') ? 'TRUE' : 'FALSE') : 'FALSE' }}",
"A1_WX_Oral": "={{ $json.body.examSessions ? ($json.body.examSessions.join(',').includes('A1_WX_Oral') || $json.body.examSessions.join(',').includes('A1_WX_Full') ? 'TRUE' : 'FALSE') : 'FALSE' }}",

// ... 其他城市 ...
```

---

### 3. Send Email to Student 节点 📧 **可选更新**

**更新内容：** 在邮件中显示专属代码信息

**在 HTML 编辑器中添加（在考试信息部分）：**

```html
<!-- 专属代码信息 -->
{{ $json.body.hasCoupon ? 
   '<p>• <strong>专属代码：</strong>' + $json.body.couponCodeUsed + ' <span style="color: #4CAF50;">✅ 已应用</span></p>' 
   : '' 
}}
```

**在费用部分添加：**

```html
<!-- 折扣提示 -->
{{ $json.body.hasCoupon ? 
   '<p style="color: #4CAF50; margin-top: 10px; text-align: center;">✨ 已享受专属代码优惠</p>' 
   : '' 
}}
```

---

### 4. Send Email to Admin 节点 📧 **可选更新**

**更新内容：** 在管理员邮件中显示专属代码和地点

**在考试信息部分添加：**

```html
<p>• <strong>考试地点：</strong>{{ $json.body.examLocations }}</p>

<!-- 专属代码信息（管理员需要知道） -->
{{ $json.body.hasCoupon ? 
   '<p>• <strong>使用专属代码：</strong>' + $json.body.couponCodeUsed + ' <span style="background: #4CAF50; color: white; padding: 2px 8px; border-radius: 3px;">已应用</span></p>' 
   : '<p>• <strong>专属代码：</strong>未使用</p>' 
}}
```

---

## 📝 更新顺序

### 第一步：更新 Process Form Data（必须）
1. 复制 `Process_Form_Data_Updated.js` 的代码
2. 粘贴到 n8n 节点中
3. 测试执行
4. 保存工作流

### 第二步：更新 Google Sheets（建议）
1. 在 Google Sheets 中添加新列
2. 更新列映射配置
3. 测试数据写入

### 第三步：更新邮件模板（可选）
1. 更新学生邮件
2. 更新管理员邮件
3. 发送测试邮件验证

---

## 🧪 测试步骤

### 1. 准备测试数据

在前端提交测试表单，确保包含：
- ✅ 选择非成都城市（如无锡、杭州）
- ✅ 输入并验证专属代码
- ✅ 选择考试科目（全科或单科）

### 2. 检查 n8n 执行

在 n8n 中查看工作流执行：
- 打开执行历史
- 查看 "Process Form Data" 节点输出
- 验证以下字段：
  - `examLocations` - 城市名称（中文）
  - `examLocationCodes` - 城市代码（CD, WX 等）
  - `couponCodeUsed` - 专属代码
  - `hasCoupon` - true/false
  - `examDate` - 包含日期和地点

### 3. 检查 Google Sheets

打开 Google Sheets，检查最新行：
- ✅ 新列有数据
- ✅ CouponCode 列显示代码（如有）
- ✅ CouponApplied 显示 TRUE/FALSE
- ✅ ExamLocation 显示城市名称

### 4. 检查邮件

查看收到的邮件：
- ✅ 学生邮件包含完整信息
- ✅ 管理员邮件包含专属代码信息
- ✅ 费用明细显示正确
- ✅ 考试地点显示正确

---

## ⚠️ 常见问题

### 问题 1：Process Form Data 节点报错

**可能原因：**
- 代码粘贴不完整
- 缺少 return 语句

**解决方法：**
- 完整复制 `Process_Form_Data_Updated.js`
- 确保最后一行是 `return items;`

---

### 问题 2：Google Sheets 写入失败

**可能原因：**
- 列名不匹配
- 权限问题

**解决方法：**
- 检查列名是否与配置一致
- 确认 Google Sheets 权限
- 查看 n8n 执行日志

---

### 问题 3：邮件中专属代码不显示

**可能原因：**
- 前端没有传递 couponCode 字段
- Process Form Data 没有处理

**解决方法：**
- 检查前端提交的数据
- 验证 Process Form Data 节点是否更新
- 查看 `$json.body.couponCodeUsed` 的值

---

### 问题 4：新城市数据不显示

**可能原因：**
- locationMapping 中没有该城市代码
- 数据库中地点格式不对

**解决方法：**
- 在 Process Form Data 代码中添加城市映射
- 确认数据库 location 字段使用代码格式（WX, HZ 等）

---

## 📊 数据结构对比

### 旧数据结构：
```javascript
{
  examSessions: ['A1_CD_Full'],
  examDate: '2025/8/27 (成都)', // 硬编码
  // 没有专属代码相关字段
}
```

### 新数据结构：
```javascript
{
  examSessions: ['A1_WX_Full'],
  examDate: '2026-03-15 (无锡)', // 从数据库获取
  selectedVenues: ['无锡'],
  couponCode: 'WUXI2026',
  couponApplied: true,
  totalFee: 1400,
  feeDetails: [
    {
      description: 'A1全科',
      fee: 1400,
      originalFee: 1600,
      discountedFee: 1400,
      isDiscounted: true
    }
  ]
}
```

---

## ✅ 完成检查清单

更新完成后，确认以下项目：

- [ ] Process Form Data 节点代码已更新
- [ ] 节点测试执行成功（无错误）
- [ ] Google Sheets 新列已添加
- [ ] Google Sheets 列映射已更新
- [ ] 学生邮件模板已更新（可选）
- [ ] 管理员邮件模板已更新（可选）
- [ ] 提交测试表单验证
- [ ] Google Sheets 数据正确
- [ ] 邮件内容正确
- [ ] 工作流已保存并激活

---

## 📞 需要帮助？

如果遇到问题：

1. **查看 n8n 执行日志**
   - 点击工作流执行历史
   - 查看每个节点的输入输出
   - 检查错误信息

2. **检查前端提交的数据**
   - 在浏览器控制台查看
   - 确认数据结构正确

3. **逐步调试**
   - 先测试 Process Form Data 节点
   - 再测试 Google Sheets 节点
   - 最后测试邮件节点

---

**更新完成后记得保存工作流！** 💾

祝更新顺利！🎉
