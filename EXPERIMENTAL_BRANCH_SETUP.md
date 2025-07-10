# Experimental Branch 部署配置指南

## 🎯 目标
为 `experimental` 分支配置独立的 Vercel 部署环境，使其与 `main` 分支的生产环境分离。

## 📋 已完成的配置

### 1. Git 分支设置
- ✅ 创建了 `experimental` 分支
- ✅ 推送到远程仓库 `origin/experimental`
- ✅ 设置了上游分支跟踪

### 2. 代码标识修改
- ✅ 页面标题添加了 `[实验版]` 标识
- ✅ 页面顶部添加了醒目的实验版横幅
- ✅ 底部版本号更新为 `v1.9.4-experimental`

## 🚀 Vercel 部署配置步骤

### 自动部署配置
Vercel 会自动为每个分支创建预览部署：

1. **主分支部署**
   - 分支：`main`
   - 类型：Production
   - 域名：您的生产域名（如 `your-app.vercel.app`）

2. **实验分支部署**
   - 分支：`experimental`
   - 类型：Preview
   - 域名：自动生成（如 `your-app-git-experimental-username.vercel.app`）

### 手动配置（可选）
如果需要更精细的控制，可以在 Vercel Dashboard 中：

1. 进入项目设置
2. 转到 "Git" 选项卡
3. 配置 "Production Branch" 为 `main`
4. 确保 "Automatic deployments" 已启用

## 🔗 访问链接

### 生产环境（main分支）
- 正式部署链接：`https://your-app.vercel.app`

### 实验环境（experimental分支）
- 预览部署链接：`https://your-app-git-experimental-username.vercel.app`
- 每次推送到 `experimental` 分支都会自动更新

## 🧪 使用方法

### 开发新功能
```bash
# 确保在 experimental 分支
git checkout experimental

# 开发新功能
# ... 编码 ...

# 提交更改
git add .
git commit -m "feat: 添加新的实验功能"

# 推送到远程
git push origin experimental
```

### 测试流程
1. 推送代码到 `experimental` 分支
2. Vercel 自动部署到预览环境
3. 分享预览链接给同事测试
4. 收集反馈并继续迭代

### 正式发布
```bash
# 切换到 main 分支
git checkout main

# 合并 experimental 分支
git merge experimental

# 推送到 main 分支
git push origin main

# 可选：删除已合并的远程分支
git push origin --delete experimental
```

## 🎨 视觉区分标识

### 实验版页面特征
- 🏷️ 浏览器标题：`ÖSD德语水平考试 - 在线报名 [实验版]`
- 🧪 页面顶部：醒目的实验版横幅
- 📝 底部版本：`v1.9.4-experimental`

### 生产版页面特征
- 🏷️ 浏览器标题：`ÖSD德语水平考试 - 在线报名`
- 🎯 页面顶部：无横幅，直接显示正式内容
- 📝 底部版本：`v1.9.4`

## 🛡️ 安全注意事项

- 实验版本包含警告横幅，避免用户误用
- 建议为实验版本添加访问控制（如密码保护）
- 测试完成后及时清理不需要的分支

## 📞 支持

如有问题，请联系开发团队或查阅 [Vercel 文档](https://vercel.com/docs)。 