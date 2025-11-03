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
- 修改CSS或HTML文档后本地和服务器版本不统一

## 🏗️ Vercel静态文件处理机制

### Vercel的静态文件规则
1. **public目录特殊处理**
   - `public/` 目录中的文件会被Vercel直接映射到根路径
   - `public/styles.css` → 访问路径：`/styles.css`
   - `public/script.js` → 访问路径：`/script.js`
   - `public/index.html` → 访问路径：`/`

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
- **服务器启动方式**: `node server.js`
- **文件结构**: 从项目根目录提供服务
- **访问路径**: 
  - `public/styles.css` → 本地不直接访问，通过同步到根目录的 `styles.css`
  - `styles.css` → `http://localhost:8090/styles.css`
  - `index.html` → `http://localhost:8090/`

### Vercel生产环境
- **文件结构**: `public/` 目录内容映射到根路径
- **访问路径**: 
  - `public/index.html` → `https://yourdomain.com/`
  - `public/styles.css` → `https://yourdomain.com/styles.css`
  - 不能通过 `/public/` 路径访问

## ✅ 最佳实践

### 1. 智能同步策略
我们不再采用固定的单向覆盖，而是实现了一套智能同步机制。`index.html`, `styles.css`, `script.js` 这三个文件在根目录和 `public/` 目录下都存在副本。

**核心逻辑**: 无论您修改了哪个位置的文件，运行同步脚本后，程序都会自动比较两个位置文件的**最后修改时间**，并将较旧的文件更新为最新版本。

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
为了确保根目录和 `public/` 目录下的静态文件版本一致，我们创建了 `sync-assets.js` 脚本。此脚本会自动检测哪个文件是最新版本，并进行双向同步。

**脚本内容 (`sync-assets.js`)**:
```javascript
const fs = require('fs');
const path = require('path');

// 需要同步的文件列表
const filesToSync = [
    'styles.css',
    'script.js',
    'index.html' // 新增 index.html
];

console.log('🔄 开始同步静态文件...');

filesToSync.forEach(file => {
    const rootPath = file;
    const publicPath = path.join('public', file);

    const rootExists = fs.existsSync(rootPath);
    const publicExists = fs.existsSync(publicPath);

    if (!rootExists && !publicExists) {
        console.warn(`- ⚠️ 文件在两处均不存在，跳过: ${file}`);
        return;
    }

    if (rootExists && !publicExists) {
        console.log(`- 📥 public/${file} 不存在，从根目录复制...`);
        fs.copyFileSync(rootPath, publicPath);
        console.log(`  ✅ ${rootPath} -> ${publicPath}`);
        return;
    }

    if (!rootExists && publicExists) {
        console.log(`- 📥 ${file} 不存在，从 public/ 目录复制...`);
        fs.copyFileSync(publicPath, rootPath);
        console.log(`  ✅ ${publicPath} -> ${rootPath}`);
        return;
    }

    // Both exist, compare modification times
    const rootStat = fs.statSync(rootPath);
    const publicStat = fs.statSync(publicPath);

    if (rootStat.mtimeMs > publicStat.mtimeMs) {
        console.log(`- 🔄 根目录中的 ${file} 是最新版本，同步到 public/ ...`);
        fs.copyFileSync(rootPath, publicPath);
        console.log(`  ✅ ${rootPath} -> ${publicPath}`);
    } else if (publicStat.mtimeMs > rootStat.mtimeMs) {
        console.log(`- 🔄 public/ 中的 ${file} 是最新版本，同步到根目录...`);
        fs.copyFileSync(publicPath, rootPath);
        console.log(`  ✅ ${publicPath} -> ${rootPath}`);
    } else {
        console.log(`- ✅ 文件 ${file} 版本一致，无需同步。`);
    }
});

console.log('\\n🎉 静态文件同步完成！');
```

## 🛠️ 常见问题解决方案

### 问题1: CSS或页面布局404/显示异常
**症状**: 浏览器控制台显示 `404` 错误，或页面样式、内容不是最新的。

**解决方案**:
1.  **运行同步脚本**：这通常是首要步骤，确保两个位置的文件已同步。
    ```bash
    node sync-assets.js
    ```
2.  **检查HTML引用**：确保 `index.html` 中对 `styles.css` 和 `script.js` 的引用是根路径 (`/styles.css`)。
3.  **强制刷新浏览器**：清除浏览器缓存（Ctrl+Shift+R 或 Cmd+Shift+R）。

### 问题2: 本地和生产环境样式/内容不一致
**症状**: 本地显示正常，但Vercel线上版本是旧的。

**解决方案**:
1.  **确认同步**：运行 `node sync-assets.js`。
2.  **确认提交**：确保所有相关文件（根目录和 `public/` 目录下的副本）都已通过 `git add .` 添加到暂存区。
3.  **提交并推送**：`git commit` 并 `git push` 以触发Vercel的重新部署。

## 📋 开发工作流程

1.  **任意修改文件**: 您可以修改根目录或 `public/` 目录下的 `index.html`, `styles.css`, `script.js`。
2.  **运行同步脚本**: 修改后，务必运行 `node sync-assets.js` 来同步文件。
3.  **本地测试**: 使用 `./start-dev.sh` 或 `node server.js` 启动本地服务器进行测试。
4.  **提交更改**: `git add . && git commit -m "你的提交信息"`。
5.  **推送部署**: `git push origin main`。
6.  **验证部署**: 检查生产环境是否正常。

## 📝 维护注意事项

1.  **同步是关键**: 记住，**修改文件后，同步是必要步骤**。新的脚本让您可以灵活地在任一位置编辑，但同步操作确保了版本的一致性。
2.  **版本控制**: 确保 `public/` 目录和根目录下的所有静态文件副本都被Git正确跟踪。
3.  **测试部署**: 每次部署后验证生产环境是否正常。

---

**最后更新**: 2025年7月8日
**版本**: 1.1.0
**维护者**: AI Assistant
