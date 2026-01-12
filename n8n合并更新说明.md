# n8n 工作流合并更新说明

## 📅 更新日期：2026-01-12

## 🎯 合并目的
合并两个 n8n 工作流 JSON 文件，确保包含所有最新的修改：
- **OSD_Reg_Official.json**: 包含更新的邮件正文（动态日期参数）
- **OSD_Reg_Official_1.json**: 包含更新的 Google Sheets 配置（支持所有城市的动态同步）

---

## ✅ 合并完成的更新

### 1. Process Form Data 代码 ✅

**状态**: 两个文件相同，已是最新版本 v2.0

**特性**:
- ✅ 支持 Supabase 动态数据
- ✅ 动态地点映射（支持所有城市：BJ, CD, SH, GZ, SZ, HZ, NJ, WX, XA, QD, ZZ）
- ✅ 灵活的模块类型映射
- ✅ 专属代码（Coupon）处理
- ✅ 折扣费用显示支持

---

### 2. Google Sheets 数据同步配置 ✅

**来源**: OSD_Reg_Official_1.json

**关键改进**:

#### 新增字段
1. **ExamLocation** - 考试地点（支持多个地点显示）
2. **CouponCode** - 专属代码
3. **CouponApplied** - 是否使用专属代码
4. **PssportUploaded** - 护照是否上传
5. **RegTime** - 报名时间（替代旧的 Reg_Time）

#### 动态考试科目检测

**旧方式** (硬编码城市):
```json
"A1_CD_Written": "={{ $json.body.examSessions ? (...includes('A1_CD_Written')...) }}"
```

**新方式** (正则表达式动态匹配):
```json
"A1_Written": "={{ $json.body.examSessions ? ($json.body.examSessions.some(s => s.match(/^A1_[A-Z]+_(Written|Full)$/)) ? 'TRUE' : 'FALSE') : 'FALSE' }}"
```

**优势**:
- ✅ 支持所有城市（BJ, CD, SH, GZ, WX, 等）
- ✅ 自动识别全科（Full）包含的单科
- ✅ 无需为每个城市单独配置列
- ✅ 易于扩展到新城市

#### 完整的列映射

| 列名 | 数据源 | 说明 |
|------|--------|------|
| `ChineseName` | `lastName + firstName` | 中文姓名 |
| `FirstName` | `firstName` | 名 |
| `LastName` | `lastName` | 姓 |
| `Gender` | `gender` | 性别 |
| `BirthDate` | `birthDate` | 出生日期 |
| `Nationality` | `nationality` | 国籍 |
| `BirthPlace` | `birthPlace` | 出生地 |
| `Passport` | `passportNumber` | 护照号 |
| `E-mail` | `email` | 邮箱 |
| `Mobile` | `phoneNumber` | 手机号 |
| `First_Time` | `firstTimeExam` | 是否首次考试 |
| **`ExamLocation`** | **`examLocations`** | **考试地点** ✨ |
| `TestDate` | `examDate` | 考试日期 |
| `applicationID` | `applicationID` | 申请编号 |
| `totalFee` | `totalFee` | 总费用 |
| **`RegTime`** | **`timestamp`** | **报名时间** ✨ |
| `A1_Full` | 动态匹配 | A1全科（任意城市） |
| `A1_Written` | 动态匹配 | A1笔试（任意城市） |
| `A1_Oral` | 动态匹配 | A1口试（任意城市） |
| `A2_Full` | 动态匹配 | A2全科（任意城市） |
| `A2_Written` | 动态匹配 | A2笔试（任意城市） |
| `A2_Oral` | 动态匹配 | A2口试（任意城市） |
| `B1_Full` | 动态匹配 | B1全科（任意城市） |
| `B1_Listening` | 动态匹配 | B1听力（任意城市） |
| `B1_Reading` | 动态匹配 | B1阅读（任意城市） |
| `B1_Writing` | 动态匹配 | B1写作（任意城市） |
| `B1_Oral` | 动态匹配 | B1口试（任意城市） |
| **`CouponCode`** | **`couponCodeUsed`** | **专属代码** ✨ |
| **`CouponApplied`** | **`hasCoupon`** | **是否使用代码** ✨ |
| **`PssportUploaded`** | **`passportUpload`** | **护照上传状态** ✨ |

---

### 3. 邮件正文更新 ✅

**来源**: OSD_Reg_Official.json

**关键改进**:

#### 动态日期参数

**位置 1: 最终席位确认截止日期**
```html
原文本: 北京时间 2025-10-31 24:00
更新后: 北京时间 {{ $json.body.registrationDeadlineFormatted || '2025年10月31日' }} 17:00
```

**位置 2: 报名取消政策截止日期**
```html
原文本: 北京时间2025年10月31日前
更新后: 北京时间{{ $json.body.registrationDeadlineFormatted || '2025年10月31日' }}前
```

**数据来源**:
- 前端从 `exam_sessions.is_active_until` 提取
- 格式化为 `YYYY年MM月DD日`
- 作为 `registrationDeadlineFormatted` 传输到 n8n

---

## 📊 数据流程图

```
前端提交表单
    ↓
Webhook Trigger (接收数据)
    ↓
Process Form Data (处理数据)
    ├─ 提取考试场次信息
    ├─ 处理专属代码
    ├─ 格式化费用明细HTML
    ├─ 处理附件（护照、付款凭证）
    └─ 格式化时间戳
    ↓
[并行处理]
    ├─ Google Sheets (同步到表格)
    │   └─ 使用动态正则匹配考试科目
    │   └─ 记录专属代码信息
    │   └─ 记录考试地点
    ├─ Google Drive (下载附件)
    │   ├─ SDI_exam_notification.pdf
    │   └─ payment_QR.png
    └─ Send Admin Notification (通知管理员)
    ↓
Merge Binary Data (合并附件)
    ↓
Convert QR to Base64 (处理二维码)
    ↓
Send Success Email to Student (发送学生邮件)
    └─ 使用动态日期参数
    └─ 包含费用明细HTML
    └─ 附带考试须知PDF和支付二维码
    ↓
Respond to Webhook (返回成功响应)
```

---

## 🔍 对比总结

| 特性 | OSD_Reg_Official.json (旧) | OSD_Reg_Official_1.json (新) | **合并后** |
|------|---------------------------|----------------------------|----------|
| Process Form Data | v2.0 ✅ | v2.0 ✅ | **v2.0 ✅** |
| Google Sheets 配置 | 固定城市列 ❌ | 动态正则匹配 ✅ | **动态正则匹配 ✅** |
| 专属代码字段 | 无 ❌ | 有 ✅ | **有 ✅** |
| ExamLocation字段 | 无 ❌ | 有 ✅ | **有 ✅** |
| 邮件动态日期 | 有 ✅ | 无 ❌ | **有 ✅** |
| 城市支持 | 仅 BJ, CD | 所有城市 ✅ | **所有城市 ✅** |

---

## 🚀 部署步骤

### 1. 备份当前工作流
在 n8n 后台导出当前的工作流作为备份。

### 2. 导入合并后的工作流
1. 登录 n8n 后台
2. 删除或停用旧的 "OSD_Reg_Official" 工作流
3. 导入更新后的 `OSD_Reg_Official.json`
4. 激活工作流

### 3. 验证配置
- ✅ 检查 Webhook URL 是否正确
- ✅ 检查 Google Sheets 凭证
- ✅ 检查 Google Drive 凭证
- ✅ 检查 SMTP 邮件凭证

### 4. 测试工作流
1. 提交测试报名（使用不同城市的考试场次）
2. 检查 Google Sheets 是否正确记录
3. 检查学生邮件是否包含正确的动态日期
4. 验证专属代码字段是否正确记录

---

## 📝 主要优势

### 1. 可扩展性 ✨
- 添加新城市无需修改 n8n 工作流
- 正则表达式自动识别所有城市的考试科目
- 前端控制场次，后端自动适配

### 2. 数据完整性 ✨
- 记录考试地点（ExamLocation）
- 记录专属代码使用情况（CouponCode, CouponApplied）
- 记录护照上传状态（PssportUploaded）

### 3. 用户体验 ✨
- 邮件显示动态截止日期（从数据库实时获取）
- 费用明细支持折扣显示
- 时间显示自动转换为北京时间

### 4. 维护性 ✨
- 代码结构清晰，注释完整
- 使用辅助函数提高可读性
- 统一的数据格式和命名规范

---

## 🔧 配置文件位置

- **合并后的工作流**: `f:\我的坚果云\B-其他资料\n8n自动化资料\OSD_Reg_Official.json`
- **原始版本 1**: `f:\我的坚果云\B-其他资料\n8n自动化资料\OSD_Reg_Official.json.backup`
- **原始版本 2**: `f:\我的坚果云\B-其他资料\n8n自动化资料\OSD_Reg_Official_1.json`

---

## ⚠️ 注意事项

1. **Google Sheets 列名更新**:
   - `Reg_Time` → `RegTime`
   - 确保 Google Sheets 中有对应的列

2. **新增列**:
   - `ExamLocation`
   - `CouponCode`
   - `CouponApplied`
   - `PssportUploaded`

3. **考试科目列变化**:
   - 移除了城市特定的列（如 `A1_CD_Written`）
   - 使用通用列（如 `A1_Written`），支持所有城市

4. **邮件日期**:
   - 确保前端传输 `registrationDeadlineFormatted` 字段
   - 如果缺失，将显示默认值 "2025年10月31日"

---

## ✅ 合并完成检查清单

- [x] Process Form Data 代码已更新为 v2.0
- [x] Google Sheets 配置已更新为动态正则匹配
- [x] 新增 ExamLocation, CouponCode, CouponApplied, PssportUploaded 字段
- [x] 邮件正文包含动态日期参数
- [x] Schema 已更新以匹配新的列配置
- [x] 节点位置坐标已同步
- [x] 所有连接关系保持不变

---

**合并完成！✅**

**最终文件**: `f:\我的坚果云\B-其他资料\n8n自动化资料\OSD_Reg_Official.json`
