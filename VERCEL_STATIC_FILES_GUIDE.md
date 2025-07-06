# Vercel 静态文件处理规则指南

## 📋 目录
- [问题背景](#问题背景)
- [Vercel静态文件处理机制](#vercel静态文件处理机制)
- [本地开发vs生产环境差异](#本地开发vs生产环境差异)
- [最佳实践](#最佳实践)
- [常见问题解决方案](#常见问题解决方案)
- [故障排除清单](#故障排除清单)

## 🔍 问题背景

在开发过程中，我们遇到了以下问题：
- 本地开发环境CSS文件找不到（404错误）
- Vercel生产环境前端CSS文件无法加载
- 修改CSS文档后本地和服务器版本不统一

## 🏗️ Vercel静态文件处理机制

### Vercel的静态文件规则
1. **public目录特殊处理**
   - `public/` 目录中的文件会被Vercel直接映射到根路径
   - `public/styles.css` → 访问路径：`/styles.css`
   - `public/script.js` → 访问路径：`/script.js`

2. **vercel.json配置**
   ```json
   {
     "rewrites": [
       {
         "source": "/((?!styles\\.css|script\\.js|payment_QR_example\\.png|SDI_exam_notification\\.pdf).*)",
         "destination": "/api/index.js"
       }
     ]
   }
   ```
   - 需要在正则表达式中排除所有静态文件
   - 未排除的文件会被重定向到API路由

## 🖥️ 本地开发vs生产环境差异

### 本地开发环境
- **服务器启动方式**: `python3 -m http.server 8000 --directory .`
- **文件结构**: 从项目根目录提供服务
- **访问路径**: 
  - `public/styles.css` → `http://localhost:8000/public/styles.css`
  - `styles.css` → `http://localhost:8000/styles.css`

### Vercel生产环境
- **文件结构**: `public/` 目录内容映射到根路径
- **访问路径**: 
  - `public/styles.css` → `https://yourdomain.com/styles.css`
  - 不能通过 `/public/styles.css` 访问

## ✅ 最佳实践

### 1. 双重部署策略
```bash
# 项目结构
project/
├── public/           # 源文件存储
│   ├── styles.css
│   ├── script.js
│   └── images/
├── styles.css        # 复制到根目录（用于本地开发）
├── script.js         # 复制到根目录（用于本地开发）
└── index.html        # 使用根路径引用
```

### 2. HTML文件中的正确引用
```html
<!-- ✅ 正确：使用根路径 -->
<link rel="stylesheet" href="/styles.css">
<script src="/script.js"></script>

<!-- ❌ 错误：使用public路径 -->
<link rel="stylesheet" href="/public/styles.css">
<script src="/public/script.js"></script>
```

### 3. vercel.json配置模板
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.js"
    },
    {
      "source": "/((?!styles\\.css|script\\.js|.*\\.png|.*\\.pdf|.*\\.jpg|.*\\.jpeg).*)",
      "destination": "/api/index.js"
    }
  ]
}
```

### 4. 自动化同步脚本
创建 `sync-assets.js` 脚本自动同步静态文件：
```javascript
const fs = require('fs');
const path = require('path');

const staticFiles = [
    'styles.css',
    'script.js',
    'payment_QR_example.png',
    'SDI_exam_notification.pdf'
];

staticFiles.forEach(file => {
    const srcPath = path.join('public', file);
    const destPath = file;
    
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✅ 已复制: ${file}`);
    }
});
```

## 🛠️ 常见问题解决方案

### 问题1: CSS文件404错误
**症状**: 浏览器控制台显示 `Failed to load resource: 404 (File not found)`

**解决方案**:
1. 检查HTML文件中的路径引用
2. 确保静态文件存在于正确位置
3. 运行 `node sync-assets.js` 同步文件

### 问题2: 本地和生产环境样式不一致
**症状**: 本地显示正常，生产环境样式异常

**解决方案**:
1. 确保 `public/styles.css` 和根目录 `styles.css` 内容一致
2. 运行同步脚本更新根目录文件
3. 提交并推送到Git触发重新部署

### 问题3: 修改CSS后更新不生效
**症状**: 修改CSS文件后，网站样式未更新

**解决方案**:
1. 确保修改的是 `public/styles.css`（源文件）
2. 运行 `node sync-assets.js` 同步到根目录
3. 提交更改到Git
4. 等待Vercel自动部署

## 📋 故障排除清单

### 本地开发环境检查
- [ ] 是否从项目根目录启动服务器
- [ ] 静态文件是否存在于根目录
- [ ] HTML文件中是否使用正确的路径（`/styles.css`）
- [ ] 是否运行了 `node sync-assets.js`

### Vercel生产环境检查
- [ ] `vercel.json` 是否正确配置静态文件排除
- [ ] 静态文件是否存在于 `public/` 目录
- [ ] HTML文件中是否使用根路径引用
- [ ] 是否已提交并推送到Git

### 开发工作流程
1. **修改静态文件**: 始终修改 `public/` 目录中的源文件
2. **同步文件**: 运行 `node sync-assets.js`
3. **本地测试**: 使用 `./start-dev.sh` 启动本地服务器
4. **提交更改**: `git add . && git commit -m "更新静态文件"`
5. **推送部署**: `git push origin main`
6. **验证部署**: 检查生产环境是否正常

## 🚀 快速启动命令

```bash
# 启动本地开发服务器（自动处理端口冲突和文件同步）
./start-dev.sh

# 手动同步静态文件
node sync-assets.js

# 检查端口占用并清理
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

# 快速提交和部署
git add . && git commit -m "更新静态文件" && git push origin main
```

## 📝 维护注意事项

1. **始终编辑源文件**: 修改 `public/` 目录中的文件，不要直接修改根目录的副本
2. **定期同步**: 每次修改静态文件后运行同步脚本
3. **版本控制**: 确保 `public/` 目录和根目录的静态文件都被Git跟踪
4. **测试部署**: 每次部署后验证生产环境是否正常

---

**最后更新**: 2025年7月6日
**版本**: 1.0.0
**维护者**: AI Assistant
