## 报名考场/日期与报名通道维护指引（readme_update_exam）

适用分支：`closed_portal`

本项目已将“报名通道开关”和“成功页确认时限”统一由根目录 `dev-config.json` 控制；考场与日期仍为页面内配置。本文档给出常用修改方法与变更清单。

### 一、统一配置（强烈建议优先修改）

文件：`/dev-config.json`

- 开启报名（默认）

```json
{
  "registrationClosed": false,
  "submitButtonDisabled": false,
  "submitButtonText": "提交报名",
  "confirmationDeadlineDisplay": "2025年10月31日"
}
```

- 关闭报名（显示弹窗并禁用按钮）

```json
{
  "registrationClosed": true,
  "closeMessage": "📢 重要通知：报名已截止……",
  "submitButtonDisabled": true,
  "submitButtonText": "报名截止",
  "confirmationDeadlineDisplay": "2025年10月31日"
}
```

说明：
- 浏览器与服务器均通过 `/dev-config.json` 加载该配置（生产/本地一致）。
- 成功提交后的“重要提醒”中“确定时限”来自 `confirmationDeadlineDisplay`，无须再改 HTML。
- 如用于联调，可在 `prefillData` 中放置自动勾选/预填（可选）。

### 二、修改现有考场的日期（目前：成都）

需要同步修改两处 HTML 与两处脚本：

1) 页面展示文字与 `data-date`（两处页面）
- `index.html` → “选择考试场次”的成都项：`data-date="YYYY年MM月DD日"` 与小字日期
- `public/index.html` → 同上
- `chengduOptions` 标题中的日期文本（两处页面）

2) 表单提交时写入的考试日期（两处脚本）
- `script.js` 与 `public/script.js` 中的 `generateExamDateString` 使用 `cityDateMap`。
- 将其中 `CD` 的值改为新日期（格式：`YYYY/MM/DD`）。

修改完成后强刷浏览器（或带上查询参数，如 `?v=200`）以避免缓存造成的旧日期显示。

### 三、增加/删除考场（静态页面方式）

当前项目的考场与科目为页面内静态结构。新增考场时请按以下步骤：

1) 在两处页面新增选择项与对应的考场块
- 页面：`index.html` 与 `public/index.html`
- 在“选择考试场次”里复制一份成都考场项，改为新城市名、`value`/`data-venue`/`data-date`。
- 在下方复制一份 `div.form-group.venue-options`，`id` 命名为 `<cityId>Options`（如 `shanghaiOptions`），内部各考试 `input[name="examSessions"]` 的 `data-location` 改为新城市名，`value` 按约定编码（如 `A1_SH_Full`）。

2) 在两处脚本补充联动逻辑与日期映射
- 文件：`script.js` 与 `public/script.js`
- 为新城市增加对应的 DOM 引用与显示/隐藏逻辑（参考现有 `chengduOptions` 处理）。
- 在 `cityDateMap` 中加入新城市代码（如 `SH` → `2025/12/20`），并确保你的 `examSessions` 编码里包含 `_<CITYCODE>_` 片段（如 `A1_SH_Full`），这样 `generateExamDateString` 才能识别。
- 如新城市的费用或展示名称不同，需要同时扩展：
  - `calculateTotalFee` 的 `feeTable`
  - `examSessionNameMap` 的显示映射

3) 删除考场
- 反向执行以上步骤：删除两处页面的考场项/对应块，并清理两处脚本中与该城市相关的逻辑、映射与费用表项。

提示：若后续考场变动频繁，建议把考场/科目抽到 JSON 驱动，脚本根据配置渲染，这样无需改 HTML（本版本尚未改造成数据驱动）。

### 四、修改页脚版本号

- 两处页面：`index.html`、`public/index.html` → 搜索 `version-text`，直接把 `vX.Y.Z` 改为新版本。

### 五、常见问题与缓存

- 提交成功后的“重要提醒”仍显示旧日期：
  - 现在文本来自 `dev-config.json`，确认 `confirmationDeadlineDisplay` 已更新；强制刷新或加 `?v=xxx` 绕过缓存。
- 生产环境仍出现“报名截止”弹窗或按钮禁用：
  - 检查 `registrationClosed` 与 `submitButtonDisabled` 是否为 `false`，确认部署后强制刷新。

### 六、提交与发布

```bash
git add -A
git commit -m "chore: update exam venues/dates and config"
git push origin closed_portal
```

部署完成后，强制刷新页面或附加查询参数验证变更。

### 变更影响面清单（今天的实现）
- 统一配置：前端改为读取 `/dev-config.json`，`server.js` 提供同路径静态输出，生产/本地同源。
- 成功页“确定时限”改为从配置读取，默认“2025年10月31日”。
- 移除北京考场，保留成都考场；脚本仅处理成都分支（新增城市需按上文步骤扩展）。
- 页脚版本号已为 `v2.0.0`。


