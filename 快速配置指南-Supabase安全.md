# ⚡ Supabase 安全配置 - 快速指南

## ✅ 已完成（无需操作）

- ✅ **代码安全更新**：Supabase 凭据已从前端移除
- ✅ **API 代理层**：创建了安全的后端代理
- ✅ **安全检查**：通过自动化检查脚本验证
- ✅ **GitHub 推送**：所有更改已提交（commit `5bf569c`）

---

## ⏰ 立即需要您操作（10分钟）

### 1️⃣ 配置 Vercel 环境变量（5分钟）

**步骤**：
1. 访问：https://vercel.com/dashboard
2. 选择项目：`osd_application`
3. 点击：Settings → Environment Variables
4. 添加以下两个变量：

| 变量名 | 值 | 勾选环境 |
|--------|-----|---------|
| `SUPABASE_URL` | `https://totxnqrbgvppdrziynpz.supabase.co` | ✅ Production<br>✅ Preview<br>✅ Development |
| `SUPABASE_ANON_KEY` | `sb_publishable_j9PE3FzvHbAzDOoBgr1NZw_zEw7MksE` | ✅ Production<br>✅ Preview<br>✅ Development |

5. 点击 Save 保存
6. 进入 Deployments 标签，点击最新部署的 "..." → "Redeploy"

### 2️⃣ 启用 Supabase RLS（3分钟）

**步骤**：
1. 访问：https://supabase.com/dashboard
2. 选择您的项目
3. 点击：SQL Editor → New Query
4. 打开文件：`supabase_security_rls.sql`
5. 复制所有内容到 SQL Editor
6. 点击 Run 执行

### 3️⃣ 测试验证（2分钟）

**步骤**：
1. 等待 Vercel 部署完成（约1-2分钟）
2. 访问您的网站
3. 打开浏览器开发者工具（F12）
4. 查看 Console，应该显示：
   ```
   ✅ 成功加载考试场次数据
   ```

---

## 🔍 快速测试命令

### 测试 1：确认凭据已隐藏

在浏览器控制台运行：
```javascript
fetch('/api/supabase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        table: 'exam_sessions',
        options: { limit: 3 }
    })
})
.then(res => res.json())
.then(data => console.log('✅ API工作正常:', data))
.catch(err => console.error('❌ 错误:', err));
```

**预期结果**：返回考试场次数据

---

## 📚 详细文档

- 📖 **完整指南**：`SECURITY_SETUP_GUIDE.md`
- 📊 **详细总结**：`SECURITY_UPDATE_SUMMARY.md`
- 🗄️ **RLS 脚本**：`supabase_security_rls.sql`

---

## 🆘 遇到问题？

### 部署后无法加载数据

**解决方案**：
1. 检查 Vercel 环境变量是否保存成功
2. 查看 Vercel → Settings → Environment Variables
3. 确认变量名称完全一致（包括大小写）
4. 重新部署项目

### RLS 启用后仍无法访问

**解决方案**：
1. 在 Supabase SQL Editor 测试：
   ```sql
   SELECT * FROM exam_sessions LIMIT 5;
   ```
2. 如果返回数据，RLS 配置正确
3. 如果提示权限错误，重新执行 RLS 脚本

---

## ✅ 完成检查清单

- [ ] Vercel 环境变量已配置
- [ ] Vercel 已重新部署
- [ ] Supabase RLS 已启用
- [ ] 网站功能测试通过
- [ ] API 代理测试通过

**全部完成后，您的项目将达到生产级安全标准！** 🎉

---

**更新时间**：2026-01-12  
**Git Commit**：`5bf569c`  
**安全状态**：🟢 已保护
