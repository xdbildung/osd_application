# Webhook表单修复说明

## 修复的问题

### 1. 邮件标题模板问题
**问题描述**：管理员邮件标题显示模板代码而非实际姓名
```
新的奥德考试报名申请 - {{ $json.body.lastName }} {{ $json.body.firstName }}
```

**解决方案**：在邮件标题中添加`=`前缀以启用n8n表达式解析
```json
"subject": "=新的奥德考试报名申请 - {{ $json.body.lastName }} {{ $json.body.firstName }}"
```

### 2. 邮件附件问题
**问题描述**：管理员邮件没有包含签字文件附件，只在正文中显示文件名

**解决方案**：
1. **前端修改**：将文件转换为base64格式发送
```javascript
// 添加文件转base64函数
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

// 处理文件上传
data.signedDocument = {
    filename: fileField.name,
    content: base64Content,
    mimeType: fileField.type
};
```

2. **n8n工作流修改**：配置邮件节点的attachments字段
```json
"attachments": "={{ $json.body.signedDocument && $json.body.signedDocument.content ? [{ \"name\": $json.body.signedDocument.filename, \"content\": $json.body.signedDocument.content, \"type\": $json.body.signedDocument.mimeType }] : [] }}"
```

## 数据格式变更

### 前端发送的数据格式
```json
{
  "firstName": "test",
  "lastName": "test",
  "signedDocument": {
    "filename": "SDI奥德考试中心报名须知.docx",
    "content": "base64编码的文件内容",
    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  }
}
```

### n8n工作流处理
- 邮件正文显示：`{{ $json.body.signedDocument.filename }}`
- 邮件附件：自动添加包含实际文件内容的附件

## 测试结果
- ✅ 邮件标题正确显示学生姓名
- ✅ 管理员邮件包含签字文件附件
- ✅ 学生邮件正常发送
- ✅ Google Sheets数据正常存储

## 使用说明
1. 确保n8n工作流导入了修改后的`OSD_Reg_modified.json`
2. 前端使用修改后的`index-webhook.html`
3. Webhook URL：`https://n8n.talentdual.com/webhook/submit-registration` 