# Google Sheets 考试科目列优化方案

## 🎯 问题分析

### 当前设计的问题：
如果为每个城市的每个科目都创建单独的列：
```
❌ 列数暴增的问题：
A1_CD_Written, A1_CD_Oral, A1_CD_Full
A1_WX_Written, A1_WX_Oral, A1_WX_Full
A1_BJ_Written, A1_BJ_Oral, A1_BJ_Full
A1_HZ_Written, A1_HZ_Oral, A1_HZ_Full
... (11个城市 × 3个等级 × 多个科目 = 上百列！)
```

### 优化思路：
✅ 已有 `ExamLocation` 列记录城市  
✅ 科目列不需要区分城市  
✅ 简化为按等级和模块类型设置列  

---

## ✅ 推荐方案：按等级和模块设置列（不区分城市）

### 优点：
1. **大幅减少列数**：从上百列减少到约15列
2. **结构清晰**：便于筛选和统计
3. **易于维护**：添加新城市无需修改表格结构
4. **信息完整**：配合 ExamLocation 列，信息不丢失

### 列结构：

#### 基础信息列（保持不变）
- ChineseName（姓名）
- FirstName（名）
- LastName（姓）
- Gender（性别）
- BirthDate（出生日期）
- Nationality（国籍）
- Email（邮箱）
- Mobile（手机）
- Passport（护照号）
- applicationID（申请编号）
- Reg_Time（注册时间）
- **ExamLocation**（考试地点）← 已添加
- **TestDate**（考试日期）

#### 考试科目列（优化后）

##### A1 等级
- `A1_Full`（A1全科）
- `A1_Written`（A1笔试）
- `A1_Oral`（A1口试）

##### A2 等级
- `A2_Full`（A2全科）
- `A2_Written`（A2笔试）
- `A2_Oral`（A2口试）

##### B1 等级
- `B1_Full`（B1全科）
- `B1_Listening`（B1听力）
- `B1_Reading`（B1阅读）
- `B1_Oral`（B1口语）
- `B1_Written`（B1写作）

#### 费用和状态列
- **totalFee**（总费用）
- **CouponCode**（专属代码）← 新增
- **CouponApplied**（是否使用专属代码）← 新增
- **PassportUploaded**（护照已上传）

---

## 📝 Google Sheets 节点配置代码

### 完整的列映射配置：

```javascript
{
  "mappingMode": "defineBelow",
  "value": {
    // ========================================
    // 基础信息
    // ========================================
    "ChineseName": "={{ $json.body.lastName }}{{ $json.body.firstName }}",
    "FirstName": "={{ $json.body.firstName }}",
    "LastName": "={{ $json.body.lastName }}",
    "Gender": "={{ $json.body.gender }}",
    "BirthDate": "={{ $json.body.birthDate }}",
    "Nationality": "={{ $json.body.nationality }}",
    "BirthPlace": "={{ $json.body.birthPlace }}",
    "Passport": "={{ $json.body.passportNumber }}",
    "E-mail": "={{ $json.body.email }}",
    "Mobile": "={{ $json.body.phoneNumber }}",
    "First_Time": "={{ $json.body.firstTimeExam }}",
    "applicationID": "={{ $json.body.applicationID }}",
    "Reg_Time": "={{ $json.body.timestamp }}",
    
    // ========================================
    // 🆕 考试信息（优化后）
    // ========================================
    "ExamLocation": "={{ $json.body.examLocations }}",
    "TestDate": "={{ $json.body.examDate }}",
    
    // ========================================
    // 🆕 A1 等级科目（不区分城市）
    // ========================================
    "A1_Full": "={{ $json.body.examSessions ? ($json.body.examSessions.some(s => s.match(/^A1_[A-Z]+_Full$/)) ? 'TRUE' : 'FALSE') : 'FALSE' }}",
    "A1_Written": "={{ $json.body.examSessions ? ($json.body.examSessions.some(s => s.match(/^A1_[A-Z]+_(Written|Full)$/)) ? 'TRUE' : 'FALSE') : 'FALSE' }}",
    "A1_Oral": "={{ $json.body.examSessions ? ($json.body.examSessions.some(s => s.match(/^A1_[A-Z]+_(Oral|Full)$/)) ? 'TRUE' : 'FALSE') : 'FALSE' }}",
    
    // ========================================
    // 🆕 A2 等级科目（不区分城市）
    // ========================================
    "A2_Full": "={{ $json.body.examSessions ? ($json.body.examSessions.some(s => s.match(/^A2_[A-Z]+_Full$/)) ? 'TRUE' : 'FALSE') : 'FALSE' }}",
    "A2_Written": "={{ $json.body.examSessions ? ($json.body.examSessions.some(s => s.match(/^A2_[A-Z]+_(Written|Full)$/)) ? 'TRUE' : 'FALSE') : 'FALSE' }}",
    "A2_Oral": "={{ $json.body.examSessions ? ($json.body.examSessions.some(s => s.match(/^A2_[A-Z]+_(Oral|Full)$/)) ? 'TRUE' : 'FALSE') : 'FALSE' }}",
    
    // ========================================
    // 🆕 B1 等级科目（不区分城市）
    // ========================================
    "B1_Full": "={{ $json.body.examSessions ? ($json.body.examSessions.some(s => s.match(/^B1_[A-Z]+_Full$/)) ? 'TRUE' : 'FALSE') : 'FALSE' }}",
    "B1_Listening": "={{ $json.body.examSessions ? ($json.body.examSessions.some(s => s.match(/^B1_[A-Z]+_(Listening|Full)$/)) ? 'TRUE' : 'FALSE') : 'FALSE' }}",
    "B1_Reading": "={{ $json.body.examSessions ? ($json.body.examSessions.some(s => s.match(/^B1_[A-Z]+_(Reading|Full)$/)) ? 'TRUE' : 'FALSE') : 'FALSE' }}",
    "B1_Oral": "={{ $json.body.examSessions ? ($json.body.examSessions.some(s => s.match(/^B1_[A-Z]+_(Oral|Full)$/)) ? 'TRUE' : 'FALSE') : 'FALSE' }}",
    "B1_Written": "={{ $json.body.examSessions ? ($json.body.examSessions.some(s => s.match(/^B1_[A-Z]+_(Written|Full)$/)) ? 'TRUE' : 'FALSE') : 'FALSE' }}",
    
    // ========================================
    // 🆕 费用和专属代码
    // ========================================
    "totalFee": "={{ $json.body.totalFee }}",
    "CouponCode": "={{ $json.body.couponCodeUsed }}",
    "CouponApplied": "={{ $json.body.hasCoupon ? 'TRUE' : 'FALSE' }}",
    
    // ========================================
    // 其他
    // ========================================
    "PassportUploaded": "={{ $json.body.passportUpload ? 'TRUE' : 'FALSE' }}"
  }
}
```

---

## 🔍 逻辑说明

### 关键改进：使用正则表达式匹配

#### 旧方式（硬编码城市）：
```javascript
"A1_CD_Written": "={{ $json.body.examSessions.includes('A1_CD_Written') || $json.body.examSessions.includes('A1_CD_Full') ? 'TRUE' : 'FALSE' }}"
```
❌ 问题：只能匹配成都（CD），无法匹配其他城市

#### 新方式（动态匹配所有城市）：
```javascript
"A1_Written": "={{ $json.body.examSessions.some(s => s.match(/^A1_[A-Z]+_(Written|Full)$/)) ? 'TRUE' : 'FALSE' }}"
```
✅ 优点：匹配任何城市的 A1 笔试或全科
- `A1_CD_Written` ✅
- `A1_WX_Written` ✅
- `A1_BJ_Written` ✅
- `A1_CD_Full` ✅（全科包含笔试）

### 正则表达式解释：

#### `^A1_[A-Z]+_Full$`
- `^` - 字符串开始
- `A1_` - 固定前缀
- `[A-Z]+` - 一个或多个大写字母（城市代码：CD, WX, BJ 等）
- `_Full` - 固定后缀
- `$` - 字符串结束

**匹配：** `A1_CD_Full`, `A1_WX_Full`, `A1_BJ_Full` 等

#### `^A1_[A-Z]+_(Written|Full)$`
- `(Written|Full)` - 匹配 Written 或 Full

**匹配：** `A1_CD_Written`, `A1_WX_Written`, `A1_CD_Full`, `A1_WX_Full` 等

---

## 📊 数据示例

### 示例 1：成都考场 A1 全科
```
ExamLocation: 成都
A1_Full: TRUE
A1_Written: TRUE  ← 全科包含笔试
A1_Oral: TRUE     ← 全科包含口试
A2_Full: FALSE
...
```

### 示例 2：无锡考场 A1 笔试 + 口试
```
ExamLocation: 无锡
A1_Full: FALSE
A1_Written: TRUE
A1_Oral: TRUE
A2_Full: FALSE
...
```

### 示例 3：北京考场 B1 全科
```
ExamLocation: 北京
B1_Full: TRUE
B1_Listening: TRUE  ← 全科包含听力
B1_Reading: TRUE    ← 全科包含阅读
B1_Oral: TRUE       ← 全科包含口语
B1_Written: TRUE    ← 全科包含写作
...
```

---

## 📈 对比分析

### 方案对比：

| 特性 | 旧方案（按城市分列） | 新方案（不分城市） |
|------|---------------------|-------------------|
| 列数 | 约100列+ | 约15列 |
| 维护难度 | 每新增城市需添加N列 | 无需修改 |
| 数据筛选 | 复杂（需考虑多列） | 简单（一列即可） |
| 统计分析 | 需要SUM多列 | 直接COUNT |
| 可读性 | 差（列太多） | 好（清晰简洁） |

### 功能完整性：

✅ **完全保留所有信息**
- 通过 `ExamLocation` 知道城市
- 通过 `A1_Written` 等知道科目
- 通过 `TestDate` 知道日期

✅ **便于数据分析**
```
示例查询：
- 统计 A1 笔试人数：COUNT(A1_Written=TRUE)
- 筛选成都考场：ExamLocation=成都
- 组合筛选：成都的A1笔试考生
```

---

## 🔄 迁移步骤

### 步骤 1：在 Google Sheets 中调整列

**删除旧的按城市分列的列：**
- A1_CD_Written, A1_CD_Oral
- A2_CD_Written, A2_CD_Oral
- B1_CD_Listening, B1_CD_Oral, B1_CD_Reading, B1_CD_Written
- A1_BJ_VIP

**添加新的通用列：**
- ExamLocation
- A1_Full, A1_Written, A1_Oral
- A2_Full, A2_Written, A2_Oral
- B1_Full, B1_Listening, B1_Reading, B1_Oral, B1_Written
- CouponCode, CouponApplied

### 步骤 2：更新 n8n Google Sheets 节点

将上面的完整列映射代码复制到 n8n 的 Google Sheets 节点配置中。

### 步骤 3：测试

提交测试数据，验证：
1. 成都考场数据正确
2. 无锡考场数据正确
3. ExamLocation 显示正确
4. 科目列正确标记

---

## 💡 进一步优化建议

### 可选：添加辅助列

如果需要更详细的分析，可以添加：

#### 1. 考试等级列
```javascript
"ExamLevel": "={{ $json.body.examLevel }}"
```
值示例：`A1等级考试`, `A2等级考试`

#### 2. 考试模块列（文本描述）
```javascript
"ExamModules": "={{ $json.body.examSessionsDisplay }}"
```
值示例：`A1全科`, `A1笔试、A1口试`

#### 3. 是否使用折扣
```javascript
"HasDiscount": "={{ $json.body.hasCoupon ? 'TRUE' : 'FALSE' }}"
```

---

## ✅ 推荐的最终列结构

### 顺序建议：

1. **学生信息**（10列）
   - ChineseName, FirstName, LastName
   - Gender, BirthDate, Nationality, BirthPlace
   - Email, Mobile, Passport

2. **申请信息**（3列）
   - applicationID
   - Reg_Time
   - First_Time

3. **考试信息**（3列）
   - ExamLocation ← 新增
   - TestDate
   - ExamLevel ← 可选

4. **A1 科目**（3列）
   - A1_Full, A1_Written, A1_Oral

5. **A2 科目**（3列）
   - A2_Full, A2_Written, A2_Oral

6. **B1 科目**（5列）
   - B1_Full, B1_Listening, B1_Reading, B1_Oral, B1_Written

7. **费用信息**（3列）
   - totalFee
   - CouponCode ← 新增
   - CouponApplied ← 新增

8. **其他**（1列）
   - PassportUploaded

**总计：约 31 列**（vs 旧方案的 100+ 列）

---

## 🎯 总结

### 优化效果：
✅ **列数减少 70%**（从 100+ 到 31）  
✅ **更易维护**（添加城市无需修改）  
✅ **更易分析**（简洁的列结构）  
✅ **信息完整**（配合 ExamLocation）  

### 实施建议：
1. 先在测试表格中实施
2. 验证所有场景（成都、无锡、北京等）
3. 确认无误后应用到正式表格
4. 更新 n8n 节点配置

---

**这个优化方案既简洁又完整，强烈推荐采用！** 🎉
