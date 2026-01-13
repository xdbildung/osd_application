# 🔒 Supabase 安全配置指南

## ⚠️ 安全问题说明

之前 Supabase 的 URL 和 API Key 直接暴露在前端代码中，存在以下风险：
- ✅ **项目公开**：GitHub 仓库是 public 的，任何人都能看到凭据
- ✅ **未设置 RLS**：Supabase 没有配置行级安全策略（Row Level Security）
- ✅ **数据暴露**：任何人可以直接访问数据库读取/修改数据

## ✅ 解决方案

### 架构变更

**之前（不安全）**：
```
前端浏览器 → 直接调用 Supabase API (暴露凭据)
```

**现在（安全）**：
```
前端浏览器 → Vercel API 代理 → Supabase API (凭据在服务器端)
```

---

## 📋 配置步骤

### 1. 在 Vercel 配置环境变量

#### 方法 A：通过 Vercel Dashboard（推荐）

1. **登录 Vercel**
   - 访问：https://vercel.com/dashboard
   - 找到您的项目：`osd_application`

2. **进入项目设置**
   - 点击项目名称
   - 点击顶部菜单的 "Settings"
   - 左侧菜单选择 "Environment Variables"

3. **添加环境变量**

   添加以下三个环境变量：

   | 变量名 | 值 | 环境 |
   |--------|-----|------|
   | `SUPABASE_URL` | `https://totxnqrbgvppdrziynpz.supabase.co` | Production, Preview, Development |
   | `SUPABASE_ANON_KEY` | `sb_publishable_j9PE3FzvHbAzDOoBgr1NZw_zEw7MksE` | Production, Preview, Development |
   | `NODE_ENV` | `production` | Production |

   **添加步骤**：
   - 点击 "Add New" 按钮
   - 输入变量名（例如：`SUPABASE_URL`）
   - 输入变量值
   - 选择环境：勾选 ✅ Production ✅ Preview ✅ Development
   - 点击 "Save"
   - 重复以上步骤添加其他变量

4. **重新部署**
   - 点击顶部菜单的 "Deployments"
   - 点击最新部署右侧的 "..." 菜单
   - 选择 "Redeploy"
   - 等待部署完成（约 1-2 分钟）

#### 方法 B：通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 链接项目
vercel link

# 添加环境变量
vercel env add SUPABASE_URL
# 输入值: https://totxnqrbgvppdrziynpz.supabase.co
# 选择环境: Production, Preview, Development

vercel env add SUPABASE_ANON_KEY
# 输入值: sb_publishable_j9PE3FzvHbAzDOoBgr1NZw_zEw7MksE
# 选择环境: Production, Preview, Development

# 重新部署
vercel --prod
```

---

### 2. 验证配置

#### 检查环境变量是否生效

1. **查看部署日志**
   - Vercel Dashboard → Deployments → 最新部署
   - 点击 "View Function Logs"
   - 搜索 `Supabase`，应该看到类似：
     ```
     ✅ Successfully fetched 10 records from exam_sessions
     ```

2. **测试前端功能**
   - 访问测试链接或生产站点
   - 打开浏览器开发者工具（F12）
   - 查看 Console 面板
   - 应该看到：
     ```
     🔄 正在从 Supabase 加载考试场次数据...
     ✅ 成功加载 X 个考试场次
     ```

3. **检查网络请求**
   - 开发者工具 → Network 标签
   - 刷新页面
   - 找到 `/api/supabase` 请求
   - 状态应该是 `200 OK`
   - 响应内容是 JSON 数组

---

## 🔐 安全增强建议

### 立即实施（强烈推荐）

#### 1. 在 Supabase 启用 Row Level Security (RLS)

```sql
-- 登录 Supabase Dashboard
-- 进入 SQL Editor
-- 执行以下 SQL

-- 1. 启用 RLS
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- 2. 允许公开读取（但不允许写入）
CREATE POLICY "Allow public read access" ON exam_sessions
FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON exam_products
FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON coupons
FOR SELECT USING (true);

-- 3. 只允许通过 service_role 写入（管理员操作）
-- 不创建 INSERT/UPDATE/DELETE 策略，这样普通用户无法修改数据
```

#### 2. 限制 API 访问来源

在 `api/supabase.js` 中添加 CORS 限制：

```javascript
// 在文件开头添加
const ALLOWED_ORIGINS = [
    'https://osd-application.vercel.app',
    'https://your-custom-domain.com',
    // 本地开发
    'http://localhost:3000',
    'http://localhost:8080'
];

// 在 module.exports 函数开头添加
const origin = req.headers.origin;
if (!ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Access from this origin is not allowed'
    });
}
```

#### 3. 添加 API 速率限制

使用 Vercel Edge Config 或第三方服务（如 Upstash Redis）：

```javascript
// 示例：使用简单的内存缓存（开发环境）
const rateLimitMap = new Map();

function checkRateLimit(ip) {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1分钟
    const maxRequests = 60; // 每分钟最多60次请求

    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, []);
    }

    const requests = rateLimitMap.get(ip);
    const recentRequests = requests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= maxRequests) {
        return false;
    }

    recentRequests.push(now);
    rateLimitMap.set(ip, recentRequests);
    return true;
}
```

#### 4. 监控异常访问

在 Supabase Dashboard 中：
- 进入 "Database" → "Logs"
- 监控异常查询模式
- 设置告警通知

---

## 📊 安全检查清单

完成以下检查后，您的应用将达到生产级别安全标准：

### 必须完成 ✅

- [x] **移除前端硬编码凭据**：已完成（本次更新）
- [x] **创建后端 API 代理**：已完成（`/api/supabase.js`）
- [x] **配置 Vercel 环境变量**：待您操作
- [ ] **启用 Supabase RLS**：强烈建议立即执行
- [ ] **测试代理 API 功能**：部署后测试

### 推荐完成 🌟

- [ ] **添加 CORS 限制**：限制 API 访问来源
- [ ] **添加速率限制**：防止 API 滥用
- [ ] **设置 Supabase 告警**：监控异常访问
- [ ] **审计数据库访问日志**：定期检查

---

## 🧪 测试验证

### 测试 1：前端不再暴露凭据

```bash
# 查看 GitHub 源代码
curl https://raw.githubusercontent.com/xdbildung/osd_application/main/script.js | grep -i "supabase"

# 应该看不到 SUPABASE_URL 和 SUPABASE_ANON_KEY
# 只能看到 SUPABASE_PROXY_URL
```

### 测试 2：API 代理正常工作

```bash
# 在浏览器控制台执行
fetch('/api/supabase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        table: 'exam_sessions',
        options: { select: '*', limit: 5 }
    })
})
.then(res => res.json())
.then(data => console.log('✅ API 代理工作正常:', data))
.catch(err => console.error('❌ API 代理错误:', err));
```

### 测试 3：未授权表访问被拒绝

```bash
# 在浏览器控制台执行
fetch('/api/supabase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        table: 'unauthorized_table',  // 不在白名单中
        options: { select: '*' }
    })
})
.then(res => res.json())
.then(data => console.log('响应:', data))
.catch(err => console.error('预期错误:', err));

// 应该返回 403 Forbidden 错误
```

---

## 🚨 紧急回滚步骤

如果新配置导致问题，可以快速回滚：

### 方法 1：Vercel Dashboard 回滚

1. Deployments → 找到上一个正常工作的部署
2. 点击 "..." → "Promote to Production"

### 方法 2：Git 回滚

```bash
# 回滚到之前的提交
git log --oneline  # 找到上一个正常的 commit
git revert <commit-hash>
git push origin main
```

---

## 📞 支持联系

如果遇到配置问题：
1. 检查 Vercel Function Logs
2. 检查浏览器 Console 错误
3. 查看本文档的"测试验证"部分
4. 联系技术支持

---

## 🎉 完成！

完成以上步骤后，您的应用已经：
- ✅ 不再在前端暴露 Supabase 凭据
- ✅ 通过安全的后端代理访问数据库
- ✅ 可以安全地公开 GitHub 仓库
- ✅ 符合生产环境安全标准

**下一步**：启用 Supabase RLS 以进一步增强安全性！
