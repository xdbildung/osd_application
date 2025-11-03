# SDI奥德考试中心报名系统 (Webhook版本)

## 系统概述

本项目为SDI成都奥德考试中心提供在线报名解决方案，采用前端表单 + n8n webhook的架构。用户在前端填写表单后，数据通过webhook发送到n8n工作流进行处理。

## 架构说明

```
前端表单 → Webhook POST → n8n工作流 → 数据处理 → JSON响应 → 前端显示结果
                                      ├── Google Sheets存储
                                      ├── 管理员邮件
                                      └── 学生确认邮件
```

## 功能特点

- ✅ **独立前端表单** - 完全自定义的表单界面
- ✅ **Webhook集成** - 通过POST请求调用n8n工作流
- ✅ **实时验证** - 前端表单验证和错误提示
- ✅ **文件上传支持** - 签字文件上传处理
- ✅ **自动数据存储** - 直接保存到Google Sheets
- ✅ **双重邮件发送** - 给用户和管理员发送邮件
- ✅ **响应式设计** - 支持手机和桌面设备

## 项目文件

```
forms/
├── OSD_Reg_modified.json       # n8n Webhook工作流配置
├── index-webhook.html          # 前端表单页面
├── public/                     # 模板文件目录
│   └── SDI奥德考试中心报名须知.docx
├── README_webhook.md           # 本文档
└── server.js                   # 可选的本地服务器
```

## 部署步骤

### 1. 配置n8n工作流

1. **导入工作流**
   - 在n8n中导入 `OSD_Reg_modified.json`
   - 工作流包含以下节点：
     - Webhook Trigger（接收POST请求）
     - Google Sheets（数据存储）
     - Send Email to Admin（管理员邮件）
     - Send Email to Student（学生邮件）
     - Respond to Webhook（返回响应）

2. **配置凭据**
   - **Google Sheets OAuth2**: 用于访问数据表格
   - **SMTP账户**: 用于发送邮件

3. **激活工作流**
   - 确保工作流状态为"Active"
   - 记录webhook URL，格式为：`https://your-n8n-domain/webhook/submit-registration`

### 2. 部署前端页面

1. **更新Webhook URL**
   
   在 `index-webhook.html` 中修改webhook地址：
   
   ```javascript
   const WEBHOOK_URL = 'https://your-n8n-domain/webhook/submit-registration';
   ```

2. **部署到Web服务器**
   
   将 `index-webhook.html` 和 `public/` 目录部署到你的Web服务器。

3. **测试访问**
   
   访问部署的页面，确保表单正常显示。

## 数据流程详解

### 1. 前端数据收集

表单收集以下字段：

| 字段名 | 前端字段名 | n8n接收名 | 类型 |
|--------|-----------|-----------|------|
| 名字 | firstName | body.firstName | 文本 |
| 姓氏 | lastName | body.lastName | 文本 |
| 性别 | gender | body.gender | 下拉 |
| 出生日期 | birthDate | body.birthDate | 日期 |
| 国籍 | nationality | body.nationality | 文本 |
| 出生地 | birthPlace | body.birthPlace | 文本 |
| 邮箱 | email | body.email | 邮箱 |
| 手机号 | phoneNumber | body.phoneNumber | 电话 |
| 护照号 | passportNumber | body.passportNumber | 文本 |
| 考试等级 | examLevel | body.examLevel | 下拉 |
| 考试模块 | examModules | body.examModules | 数组 |
| 首次参加 | firstTimeExam | body.firstTimeExam | 下拉 |
| 考试日期 | examDate | body.examDate | 下拉 |
| 签字文件 | signedDocument | body.signedDocument | 文件名 |
| 提交时间 | timestamp | body.timestamp | 时间戳 |

### 2. Webhook数据格式

前端发送的JSON数据格式：

```json
{
  "firstName": "张",
  "lastName": "三",
  "gender": "男",
  "birthDate": "1990-01-01",
  "nationality": "China",
  "birthPlace": "Beijing",
  "email": "zhangsan@example.com",
  "phoneNumber": "13800138000",
  "passportNumber": "G12345678",
  "examLevel": "B1",
  "examModules": ["B1全科"],
  "firstTimeExam": "是",
  "examDate": "2025年8月27日",
  "signedDocument": "签字文件.pdf",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

### 3. n8n处理流程

1. **Webhook接收** - 接收POST请求
2. **并行处理**：
   - **Google Sheets写入** - 保存到指定表格
   - **管理员邮件** - 发送包含学生信息的邮件到 info@sdi-osd.de
   - **学生邮件** - 发送后续流程说明到学生邮箱
3. **响应返回** - 返回成功JSON响应

### 4. 成功响应格式

```json
{
  "success": true,
  "message": "报名成功！请查收邮件！",
  "data": {
    "name": "张 三",
    "email": "zhangsan@example.com",
    "examLevel": "B1",
    "examDate": "2025年8月27日",
    "timestamp": "2025-01-01T12:00:00.000Z"
  }
}
```

## 本地开发测试

### 启动本地服务器

```bash
# 使用Python
python3 -m http.server 8090

# 或使用Node.js
npm install -g http-server
http-server -p 8090

# 或使用现有的server.js
node server.js
```

### 测试流程

1. **前端测试**
   - 访问 `http://localhost:8090/index-webhook.html`
   - 填写测试数据并提交

2. **n8n测试**
   - 检查工作流执行日志
   - 确认Google Sheets数据写入
   - 验证邮件发送状态

3. **webhook测试**
   
   可以使用curl命令测试webhook：
   
   ```bash
   curl -X POST https://your-n8n-domain/webhook/submit-registration \
     -H "Content-Type: application/json" \
     -d '{
       "firstName": "测试",
       "lastName": "用户",
       "gender": "男",
       "birthDate": "1990-01-01",
       "nationality": "China",
       "birthPlace": "Test City",
       "email": "test@example.com",
       "phoneNumber": "13800138000",
       "passportNumber": "TEST123",
       "examLevel": "A1",
       "examModules": ["A1全科"],
       "firstTimeExam": "是",
       "examDate": "2025年8月27日",
       "signedDocument": "test.pdf",
       "timestamp": "2025-01-01T12:00:00.000Z"
     }'
   ```

## 故障排除

### 常见问题

1. **表单提交失败**
   - 检查webhook URL是否正确
   - 确认n8n工作流已激活
   - 检查网络连接

2. **CORS错误**
   - 确保n8n配置允许跨域请求
   - 检查请求头设置

3. **数据未写入Google Sheets**
   - 验证Google Sheets凭据
   - 检查表格ID和工作表名称
   - 确认数据字段映射正确

4. **邮件发送失败**
   - 检查SMTP凭据配置
   - 验证邮件模板语法
   - 确认收件人邮箱有效

### 调试方法

1. **n8n执行日志**
   - 查看工作流执行历史
   - 检查每个节点的输入输出数据

2. **前端控制台**
   - 开启浏览器开发者工具
   - 查看网络请求和响应

3. **webhook测试**
   - 使用Postman或curl测试webhook
   - 验证数据格式和响应

## 生产环境配置

### 安全考虑

1. **HTTPS**
   - 确保webhook使用HTTPS
   - 前端页面使用SSL证书

2. **输入验证**
   - n8n中添加数据验证节点
   - 前端加强输入格式检查

3. **错误处理**
   - 添加重试机制
   - 完善错误日志记录

### 性能优化

1. **缓存**
   - 前端资源缓存
   - 减少重复请求

2. **压缩**
   - 启用gzip压缩
   - 优化图片和文件大小

## 维护说明

### 定期检查

- Google Sheets写入状态
- 邮件发送成功率
- n8n工作流执行状态
- 前端页面访问情况

### 数据备份

- 定期导出Google Sheets数据
- 备份n8n工作流配置
- 保存前端代码版本

---

**技术支持**: info@sdi-osd.de 