# OSD申请表 - 奥德考试报名系统

## 项目简介

这是一个为慕尼黑SDI语言大学举办的奥德考试（ÖSD）设计的在线报名系统。系统提供了完整的报名流程，包括表单填写、费用计算、付费凭证上传和自动化邮件确认。

## 功能特点

### 🎯 核心功能
- **在线报名表单**：完整的学生信息收集
- **多考场支持**：支持北京、成都两个考场
- **考试等级选择**：A1、A2等级的全科或单科考试
- **费用自动计算**：根据选择的考试自动计算费用
- **文件上传**：支持护照、签字文件、付费凭证上传
- **付费确认**：银行转账和支付宝扫码两种付费方式

### 🔧 技术特性
- **响应式设计**：适配桌面和移动设备
- **实时表单验证**：即时反馈用户输入
- **文件拖拽上传**：支持拖拽和点击上传
- **自动化工作流**：与n8n集成的自动化邮件系统
- **Google Sheets集成**：自动记录报名信息

## 系统架构

```
前端 (HTML/CSS/JavaScript)
    ↓
n8n Webhook 工作流
    ↓
邮件服务 + Google Sheets
```

## 文件结构

```
osd_application/
├── index.html          # 主页面
├── styles.css          # 样式表
├── script.js           # 前端逻辑
├── server.js           # 后端服务器
├── config.js           # 配置文件
├── googleSheetsService.js  # Google Sheets API
├── package.json        # 依赖管理
└── public/             # 静态资源
    ├── payment_QR_example.png
    └── template-readme.txt
```

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 启动服务器
```bash
npm start
```

### 3. 访问应用
打开浏览器访问 `http://localhost:8080`

## ⚠️ 重要提示：端口配置

### 本地测试端口规定
**本系统固定使用端口 8080 进行本地测试和开发。**

- 🚀 **服务器端口**：`http://localhost:8080`
- 📝 **表单页面**：`http://localhost:8080`
- ⚙️ **管理面板**：`http://localhost:8080/admin`
- 📎 **文件下载**：`http://localhost:8080/public/...`

### 端口冲突解决方案

如果启动时遇到端口占用错误，请按以下步骤解决：

#### 1. 检查端口占用
```bash
# 查看8080端口占用情况
lsof -i :8080
# 或者
netstat -an | grep 8080
```

#### 2. 停止占用端口的进程
```bash
# 方法1：停止特定进程
kill -9 <PID>

# 方法2：停止所有相关Node.js进程
pkill -f "node.*server.js"

# 方法3：停止所有Node.js进程（谨慎使用）
pkill node
```

#### 3. 重新启动服务器
```bash
npm start
```

#### 4. 验证服务器启动
启动成功后应该看到以下输出：
```
🚀 Server running on http://localhost:8080
📝 Form available at: http://localhost:8080
⚙️  Admin panel at: http://localhost:8080/admin
📊 API endpoints:
   - POST /api/submit - Submit form data
   - POST /api/submit-payment-proof - Submit payment proof
   - GET /api/submissions - View all submissions
   - GET /api/payment-submissions - View all payment submissions
```

### 注意事项
- **不要使用其他端口**：系统配置和测试都基于8080端口
- **端口冲突原因**：通常是因为之前的服务器实例没有正确关闭
- **开发环境**：请确保本地开发环境始终使用8080端口
- **生产环境**：生产环境会使用环境变量`PORT`指定的端口

## 配置说明

### 环境配置
在 `config.js` 中配置：
- n8n Webhook URL
- 邮件服务设置
- Google Sheets API 凭证

### 考试配置
- 考试日期：北京 2025/9/13，成都 2025/8/27
- 考试费用：A1全科1550元，A2全科1650元
- 单科费用：A1笔试950元/口试600元，A2笔试1000元/口试650元

## 部署说明

### 生产环境部署
1. 确保所有配置文件正确设置
2. 上传到服务器
3. 配置反向代理（如nginx）
4. 启动服务：`npm start`

### 注意事项
- 确保文件上传目录有写权限
- 配置HTTPS以保证数据传输安全
- 定期备份报名数据

## 联系方式

如有问题请联系：info@sdi-osd.de

---

*© 2025 慕尼黑SDI语言大学* 