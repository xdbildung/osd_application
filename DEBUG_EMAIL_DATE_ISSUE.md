# 邮件日期显示问题 - 调试和修复指南

## 🔍 问题描述

前端传输给n8n的字段是 `deadlineDate`（提交时间+7天），而不是数据库的 `is_active_until`（报名截止日期）。导致n8n邮件中使用的 `registrationDeadlineFormatted` 为空，显示了默认值。

## ✅ 修复内容

### 1. 已修复的文件

- ✅ `script.js` - 添加了从场次提取 `is_active_until` 的代码和调试日志
- ✅ `public/script.js` - 同步添加了相同的代码

### 2. 修复的逻辑

**修复前：**
```javascript
// ❌ 缺少从场次提取 is_active_until 的代码
const submitData = {
    deadlineDate: deadlineDateString, // 只有提交时间+7天
    // ❌ 缺少 registrationDeadline 和 registrationDeadlineFormatted
};
```

**修复后：**
```javascript
// ✅ 从选中的场次中提取报名截止日期
const selectedVenueCheckboxes = document.querySelectorAll('input[name="selectedVenues"]:checked');
let registrationDeadline = null;
let registrationDeadlineFormatted = null;

if (selectedVenueCheckboxes.length > 0) {
    const firstCheckbox = selectedVenueCheckboxes[0];
    const deadlineStr = firstCheckbox.dataset.deadline; // 从 data-deadline 读取
    
    if (deadlineStr && deadlineStr.trim() !== '') {
        registrationDeadline = deadlineStr; // ISO格式: YYYY-MM-DD
        // 格式化为邮件显示格式: YYYY年MM月DD日
        const deadlineDateObj = new Date(deadlineStr);
        const year = deadlineDateObj.getFullYear();
        const month = String(deadlineDateObj.getMonth() + 1).padStart(2, '0');
        const day = String(deadlineDateObj.getDate()).padStart(2, '0');
        registrationDeadlineFormatted = `${year}年${month}月${day}日`;
    }
}

const submitData = {
    deadlineDate: deadlineDateString, // 保留原字段（付款截止）
    registrationDeadline: registrationDeadline, // ✅ 新增：报名截止日期 ISO格式
    registrationDeadlineFormatted: registrationDeadlineFormatted, // ✅ 新增：报名截止日期中文格式
};
```

## 🧪 测试步骤

### 步骤1：部署代码到线上

```bash
# 提交到Git
git add script.js public/script.js
git commit -m "Fix: Add registrationDeadlineFormatted from is_active_until"
git push

# Vercel会自动部署
```

### 步骤2：在浏览器测试

1. **刷新前端页面**（清除缓存：Ctrl+Shift+R 或 Cmd+Shift+R）

2. **打开浏览器控制台**（F12）

3. **填写表单并选择场次**

4. **查看控制台日志**，应该看到：
   ```
   🔍 调试：选中的场次数量: 1
   🔍 调试：第一个场次的 data-deadline: 2026-03-08
   🔍 调试：第一个场次的所有 dataset: {...}
   ✅ 成功提取报名截止日期: {
       registrationDeadline: "2026-03-08",
       registrationDeadlineFormatted: "2026年03月08日"
   }
   ```

5. **提交表单后查看完整提交数据**：
   ```
   📋 完整提交数据: {
       deadlineDate: "2026-01-21",  // 付款截止（提交时间+7天）
       registrationDeadline: "2026-03-08",  // ✅ 报名截止（数据库）
       registrationDeadlineFormatted: "2026年03月08日",  // ✅ 中文格式
       ...
   }
   ```

### 步骤3：检查n8n数据

在n8n工作流执行日志中，查看 "Process Form Data" 节点的输出：

**预期输出：**
```json
{
  "body": {
    "applicationID": "REG202601140001",
    "registrationDeadline": "2026-03-08",
    "registrationDeadlineFormatted": "2026年03月08日"
  }
}
```

**如果看到以下输出，说明仍有问题：**
```json
{
  "body": {
    "applicationID": "REG202601140001",
    "registrationDeadline": null,
    "registrationDeadlineFormatted": null
  }
}
```

### 步骤4：检查邮件

**Gmail 和 QQ邮箱都应该显示：**

> 为确保您的考试席位，请务必在 **北京时间 2026年03月08日 17:00** 前完成以下所有步骤。

> 如需取消报名，须在**北京时间2026年03月08日前**以书面形式提出申请

## 🔧 故障排查

### 问题1：控制台显示 "⚠️ 警告：场次的 data-deadline 为空！"

**原因：** 数据库中的 `is_active_until` 字段为空

**解决：** 在Supabase执行：
```sql
-- 检查场次数据
SELECT id, date, location, is_active_until FROM exam_sessions WHERE is_active = true;

-- 如果 is_active_until 为 NULL，更新它
UPDATE exam_sessions
SET is_active_until = date - INTERVAL '7 days'
WHERE is_active_until IS NULL;
```

### 问题2：控制台显示 undefined 或 null

**原因：** 场次checkbox没有正确设置 `data-deadline` 属性

**解决：** 检查场次渲染代码（`renderExamSessions` 函数）：
```javascript
// 应该有这一行（第322行）
data-deadline="${session.is_active_until || ''}"
```

### 问题3：n8n仍然收到 null

**原因：** 前端代码更新后没有清除浏览器缓存

**解决：**
1. 硬刷新页面：Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac)
2. 或清除浏览器缓存
3. 或在无痕模式打开网站

### 问题4：Supabase RLS问题

**原因：** 如果之前设置了 `security_invoker = true`，可能仍然影响数据读取

**解决：** 执行 `fix_supabase_views.sql` 中的修复代码：
```sql
ALTER VIEW public.exam_sessions_with_coupons SET (security_invoker = false);
ALTER VIEW public.exam_products_pricing SET (security_invoker = false);
ALTER VIEW public.active_exam_sessions SET (security_invoker = false);
```

## 📊 调试检查清单

- [ ] 代码已推送到GitHub
- [ ] Vercel已完成部署
- [ ] 浏览器已清除缓存/硬刷新
- [ ] 控制台显示 "✅ 成功提取报名截止日期"
- [ ] `registrationDeadlineFormatted` 不为 null
- [ ] n8n收到正确的数据
- [ ] Gmail邮件显示正确日期
- [ ] QQ邮箱显示正确日期

## ✅ 预期结果

修复成功后：

1. **控制台日志**：显示从数据库提取的正确日期
2. **n8n输入**：包含 `registrationDeadlineFormatted`
3. **邮件内容**：所有邮箱客户端都显示相同的正确日期
4. **不再显示默认值**："2025年10月31日" 不再出现

## 🎯 关键字段说明

| 字段名 | 来源 | 格式 | 示例 | 用途 |
|--------|------|------|------|------|
| `deadlineDate` | 前端计算 | YYYY-MM-DD | 2026-01-21 | 付款截止日期（提交+7天） |
| `registrationDeadline` | 数据库 is_active_until | YYYY-MM-DD | 2026-03-08 | 报名截止日期（ISO格式） |
| `registrationDeadlineFormatted` | 前端格式化 | YYYY年MM月DD日 | 2026年03月08日 | 邮件显示用（中文格式） |

---

**最后更新**: 2026-01-14
**状态**: ✅ 已修复，等待测试验证
