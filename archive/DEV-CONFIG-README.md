# 本地开发配置功能说明

## 功能概述

为了方便本地测试，系统提供了表单预填写功能。该功能只在本地环境中生效，不会影响生产环境。

## 使用方法

### 1. 启用预填写功能

在项目根目录创建 `dev-config.json` 文件：

```json
{
  "isDevelopment": true,
  "prefillData": {
    "firstName": "Test",
    "lastName": "User",
    "gender": "male",
    "birthDate": "1990-01-01",
    "nationality": "China",
    "birthPlace": "Beijing",
    "email": "skee.chen@xuezaideguo.com",
    "phoneNumber": "13800138000",
    "firstTimeExam": "Yes",
    "passportNumber": "后补",
    "selectedVenues": ["北京"],
    "examSessions": ["北京-A1-全科"]
  }
}
```

### 2. 自定义预填写数据

您可以根据需要修改 `prefillData` 对象中的任何字段：

- **基本信息**: `firstName`, `lastName`, `gender`, `birthDate`, `nationality`, `birthPlace`
- **联系方式**: `email`, `phoneNumber`
- **考试信息**: `firstTimeExam`, `passportNumber`
- **考场选择**: `selectedVenues` (数组，可选: `["北京"]`, `["成都"]`, `["北京", "成都"]`)
- **考试科目**: `examSessions` (数组，格式: `["场地-等级-科目"]`)

### 3. 考试科目选项

可用的考试科目选项：

**北京考场**:
- `"北京-A1-全科"`
- `"北京-A1-笔试"`
- `"北京-A1-口试"`
- `"北京-A2-全科"`
- `"北京-A2-笔试"`
- `"北京-A2-口试"`

**成都考场**:
- `"成都-A1-全科"`
- `"成都-A1-笔试"`
- `"成都-A1-口试"`
- `"成都-A2-全科"`
- `"成都-A2-笔试"`
- `"成都-A2-口试"`

### 4. 启动本地服务器

```bash
npm start
```

打开浏览器访问 `http://localhost:8090`，表单将自动预填写。

### ⚠️ 重要：固定端口8090

**本系统固定使用端口8090，不要使用其他端口！**

如果8090端口被占用，请先停止占用的进程：

```bash
# 停止相关进程
pkill -f "node.*server.js"

# 重新启动
npm start
```

## 安全说明

- `dev-config.json` 文件已添加到 `.gitignore` 中
- 该文件不会被提交到 Git 仓库
- 生产环境中不存在此文件，因此不会启用预填写功能
- 即使意外上传，生产环境也不会读取此配置文件

## 工作原理

1. 页面加载时，前端会调用 `/api/dev-config` API
2. 服务器检查是否存在 `dev-config.json` 文件
3. 如果文件存在且 `isDevelopment` 为 `true`，返回配置数据
4. 前端接收到配置后，自动填写表单字段
5. 如果文件不存在或读取失败，系统正常运行（生产模式）

## 注意事项

- 只有在本地开发环境中才需要创建 `dev-config.json` 文件
- 请不要将包含真实个人信息的配置文件提交到代码仓库
- 如需关闭预填写功能，可以将 `isDevelopment` 设置为 `false` 或删除配置文件