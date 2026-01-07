# 本地测试指南

## 启动本地服务器

### 方法一：使用 Node.js（推荐）
如果项目中有 `server.js`：
```bash
node server.js
```

然后访问：
- 主页面：http://localhost:3000
- Public页面：http://localhost:3000/public/index.html

### 方法二：使用 npm
如果 package.json 中配置了启动脚本：
```bash
npm start
```

### 方法三：使用 VS Code Live Server
1. 安装 VS Code 插件 "Live Server"
2. 右键点击 `index.html`
3. 选择 "Open with Live Server"

访问：http://127.0.0.1:5500/index.html

### 方法四：使用 Python（简单快速）
在项目根目录运行：
```bash
# Python 3
python -m http.server 8000
```

然后访问：
- 主页面：http://localhost:8000/index.html
- Public页面：http://localhost:8000/public/index.html

### 方法五：使用 PowerShell 简易服务器
```powershell
# 需要先安装 dotnet-serve
dotnet tool install --global dotnet-serve

# 启动服务器
dotnet serve -p 8080
```

访问：http://localhost:8080/index.html

---

## 测试检查清单

### 1. ✅ 地点映射功能测试

#### 已添加的城市代码
- **BJ** - 北京
- **CD** - 成都  
- **GZ** - 广州
- **HZ** - 杭州 ✨ 新增
- **NJ** - 南京 ✨ 新增
- **QD** - 青岛 ✨ 新增
- **SH** - 上海
- **SZ** - 深圳
- **WX** - 无锡 ✨ 新增
- **XA** - 西安 ✨ 新增
- **ZZ** - 郑州 ✨ 新增

#### 测试步骤
1. **打开浏览器控制台**（F12）
2. **测试转换函数**：
```javascript
// 在控制台中执行
console.log(getLocationName('WX'));  // 应该输出: 无锡
console.log(getLocationName('XA'));  // 应该输出: 西安
console.log(getLocationName('NJ'));  // 应该输出: 南京
console.log(getLocationName('HZ'));  // 应该输出: 杭州
console.log(getLocationName('QD'));  // 应该输出: 青岛
console.log(getLocationName('ZZ'));  // 应该输出: 郑州

// 反向测试
console.log(getLocationCode('无锡'));  // 应该输出: WX
console.log(getLocationCode('西安'));  // 应该输出: XA
console.log(getLocationCode('南京'));  // 应该输出: NJ
```

3. **查看已加载的映射**：
```javascript
console.log(LOCATION_MAPPINGS);
// 应该显示包含所有11个城市的对象
```

---

### 2. ✅ Supabase 数据加载测试

#### 测试场次加载
```javascript
// 在控制台中执行
console.log('场次数据:', examSessionsData);
console.log('场次数量:', examSessionsData.length);
```

**预期结果**：
- 显示从数据库加载的所有场次
- 只包含 `is_active = true` 的场次

#### 测试产品加载
```javascript
console.log('产品数据:', examProductsData);
console.log('产品数量:', examProductsData.length);
```

**预期结果**：
- 显示所有产品信息
- 包含价格（原价和折后价）

---

### 3. ✅ 场次选择功能测试

1. **查看场次列表**
   - 所有活跃场次应该正常显示
   - `is_active = false` 的场次应该显示"报名已截止"并禁用

2. **选择场次**
   - 点击场次复选框
   - 应该显示对应的考试科目选项
   - 控制台应该显示：
     ```
     🔄 正在从 Supabase 加载考试场次数据...
     ✅ 成功加载场次数据: X 个场次
     ```

3. **取消场次选择**
   - 取消勾选场次
   - 考试科目选项应该隐藏
   - 已选择的科目应该被清空

---

### 4. ✅ 专属代码功能测试

#### 准备工作
确保数据库中有测试用的专属代码：
```sql
-- 在 Supabase SQL Editor 中执行
SELECT * FROM coupons WHERE is_active = true;
```

#### 测试步骤
1. **选择一个考试场次**
2. **输入专属代码**（从数据库中获取）
3. **点击"验证专属代码"**

**预期结果（成功）**：
- 显示绿色提示："✅ 专属代码验证成功！"
- 控制台显示：
  ```
  🔄 正在验证专属代码: [代码] 场次ID: [UUID]
  ✅ 专属代码验证成功: {对象}
  ```

**预期结果（失败）**：
- 显示红色提示："❌ 专属代码无效或不适用于此场次"

#### 测试不同场景
- ❌ 未选择场次就验证 → 提示"请先选择考试场次"
- ❌ 空代码 → 提示"请输入专属代码"
- ❌ 错误代码 → 提示"专属代码无效"
- ❌ 代码属于其他场次 → 提示"不适用于此场次"
- ✅ 正确代码 → 验证成功

---

### 5. ✅ 费用计算测试

#### 测试场景A：无专属代码
1. 选择考试科目（如：A1全科）
2. 不输入专属代码
3. 查看控制台：
```javascript
// 应该看到
💰 费用计算: {totalFee: 1600, details: [...]}
```

**预期**：使用原价（price_original）

#### 测试场景B：有专属代码 + 全科考试
1. 选择全科考试（如：A1全科）
2. 输入并验证专属代码
3. 查看费用

**预期**：
- 全科考试使用折后价（price_discounted）
- 控制台显示 `isDiscounted: true`
- 原价：¥1600 → 折后价：¥1400

#### 测试场景C：有专属代码 + 单科考试
1. 选择单科考试（如：A1笔试）
2. 输入并验证专属代码
3. 查看费用

**预期**：
- 单科仍使用原价（不享受折扣）
- 控制台显示 `isDiscounted: false`

#### 测试场景D：多科目组合
1. 选择多个单科（如：A1笔试 + A1口试）
2. 查看总价

**预期**：
- 直接加总各科目费用
- **不再有**"超过全科价格时按全科价格收费"的限制
- 例如：¥950 + ¥600 = ¥1550（即使超过全科价格¥1400也按实际总和计算）

---

### 6. ✅ 动态地点测试（新城市）

#### 在数据库中添加测试场次
在 Supabase SQL Editor 中执行：

```sql
-- 添加杭州测试场次
INSERT INTO exam_sessions (date, location, levels, is_active)
VALUES ('2025-12-15', 'HZ', ARRAY['A1', 'A2'], true);

-- 获取刚才插入的场次ID
SELECT id, date, location FROM exam_sessions WHERE location = 'HZ';

-- 添加杭州的考试产品（使用实际场次ID）
INSERT INTO exam_products (code, name, level, location, module_type, price_original, price_discounted, is_active)
VALUES
    ('A1_HZ_Full', 'A1全科', 'A1', 'HZ', 'Full', 160000, 140000, true),
    ('A1_HZ_Written', 'A1笔试', 'A1', 'HZ', 'Written', 95000, NULL, true),
    ('A1_HZ_Oral', 'A1口试', 'A1', 'HZ', 'Oral', 60000, NULL, true);

-- 可选：添加专属代码
INSERT INTO coupons (code, session_id, is_active)
VALUES ('HZ2025TEST', '替换为实际场次UUID', true);
```

#### 测试步骤
1. **刷新页面**
2. **查看场次列表**
   - 应该看到"杭州考场"
   - 显示正确的日期

3. **选择杭州考场**
   - 应该显示 A1、A2 等级选项
   - 点击控制台测试：
     ```javascript
     console.log(getLocationName('HZ'));  // 应该输出: 杭州
     ```

4. **选择科目并查看费用**
   - 选择"A1全科"
   - 费用应该正确显示为 ¥1600

5. **测试其他新城市**
   - 重复上述步骤测试 WX（无锡）、XA（西安）、NJ（南京）、QD（青岛）、ZZ（郑州）

---

### 7. ✅ 表单提交测试

1. **填写完整表单**
   - 基本信息（姓名、性别、出生日期等）
   - 选择考试场次
   - 选择考试科目
   - （可选）输入专属代码

2. **点击"提交报名"**

3. **查看控制台输出**：
```javascript
📋 完整提交数据: {
    applicationID: "OSD123",
    examSessions: [...],
    selectedVenues: ["杭州"],
    couponCode: "HZ2025TEST",
    couponApplied: true,
    totalFee: 1400,
    ...
}
```

4. **验证数据正确性**：
   - `selectedVenues` 显示中文城市名（如"杭州"）
   - `examDate` 显示正确格式：`2025-12-15 (杭州)`
   - `couponCode` 如果验证成功应该有值
   - `totalFee` 应该是折后价（如果有专属代码）

---

### 8. ✅ 错误处理测试

#### 数据库连接失败
在控制台中模拟：
```javascript
// 暂时修改 URL 测试错误处理
// （实际测试时不建议这样做）
```

**预期**：
- 显示红色通知："加载考试场次数据失败，请刷新页面重试"
- 页面仍可使用（不会崩溃）

#### 网络问题
1. 打开浏览器开发者工具
2. 切换到 Network 标签
3. 选择 "Offline" 模式
4. 刷新页面

**预期**：
- 显示错误提示
- 场次列表显示"暂无可用考试场次"

---

## 常见问题排查

### 问题1：场次没有显示
**检查**：
1. 控制台是否有错误信息？
2. 数据库中是否有 `is_active = true` 的场次？
3. Supabase URL 和 Key 是否正确？

**解决**：
```javascript
// 在控制台中检查
console.log(SUPABASE_URL);
console.log(examSessionsData);
```

### 问题2：地点显示为代码而非中文
**检查**：
```javascript
console.log(LOCATION_MAPPINGS);
console.log(getLocationName('HZ'));
```

**解决**：
- 确认 `LOCATION_MAPPINGS` 中包含该城市
- 确认 script.js 已正确加载

### 问题3：专属代码验证失败
**检查**：
1. 数据库中是否存在该代码？
2. 代码的 `session_id` 是否匹配当前选中的场次？
3. 代码的 `is_active` 是否为 true？

**SQL 查询**：
```sql
SELECT * FROM coupons 
WHERE code = '您的代码' 
AND is_active = true;
```

### 问题4：费用计算不正确
**检查**：
1. 数据库中的价格单位是否为"分"？
   - 正确：160000（表示1600元）
   - 错误：1600（会显示为16元）

2. 控制台查看计算结果：
```javascript
const checkedSessions = Array.from(document.querySelectorAll('input[name="examSessions"]:checked'))
    .map(cb => cb.value);
console.log('选中的科目:', checkedSessions);
console.log('费用计算:', calculateTotalFee(checkedSessions));
```

---

## 数据库快速测试数据

### 完整测试数据集（可选）

```sql
-- 1. 添加多个城市的测试场次
INSERT INTO exam_sessions (date, location, levels, is_active) VALUES
    ('2025-12-15', 'HZ', ARRAY['A1', 'A2'], true),
    ('2025-12-20', 'NJ', ARRAY['A1', 'B1'], true),
    ('2025-12-25', 'WX', ARRAY['A2', 'B1'], true),
    ('2026-01-10', 'XA', ARRAY['A1', 'A2', 'B1'], true),
    ('2026-01-15', 'QD', ARRAY['A1'], true),
    ('2026-01-20', 'ZZ', ARRAY['A2', 'B1'], true);

-- 2. 查看刚添加的场次及其ID
SELECT id, date, location, levels, is_active FROM exam_sessions 
WHERE location IN ('HZ', 'NJ', 'WX', 'XA', 'QD', 'ZZ')
ORDER BY date;

-- 3. 为每个城市添加产品（需要替换对应的城市代码）
-- 以杭州为例：
INSERT INTO exam_products (code, name, level, location, module_type, price_original, price_discounted, is_active) VALUES
    ('A1_HZ_Full', 'A1全科', 'A1', 'HZ', 'Full', 160000, 140000, true),
    ('A1_HZ_Written', 'A1笔试', 'A1', 'HZ', 'Written', 95000, NULL, true),
    ('A1_HZ_Oral', 'A1口试', 'A1', 'HZ', 'Oral', 60000, NULL, true),
    ('A2_HZ_Full', 'A2全科', 'A2', 'HZ', 'Full', 170000, 150000, true),
    ('A2_HZ_Written', 'A2笔试', 'A2', 'HZ', 'Written', 100000, NULL, true),
    ('A2_HZ_Oral', 'A2口试', 'A2', 'HZ', 'Oral', 65000, NULL, true);

-- 重复上述 INSERT 语句，将 HZ 替换为 NJ, WX, XA, QD, ZZ

-- 4. 添加测试专属代码（需要替换实际的场次UUID）
INSERT INTO coupons (code, session_id, is_active) VALUES
    ('HANGZHOU2025', '杭州场次UUID', true),
    ('NANJING2025', '南京场次UUID', true),
    ('WUXI2025', '无锡场次UUID', true),
    ('XIAN2026', '西安场次UUID', true),
    ('QINGDAO2026', '青岛场次UUID', true),
    ('ZHENGZHOU2026', '郑州场次UUID', true);
```

---

## 测试报告模板

完成测试后，填写以下清单：

- [ ] 地点映射功能正常（11个城市都能正确显示）
- [ ] 场次加载成功（控制台无错误）
- [ ] 产品加载成功（控制台无错误）
- [ ] 场次选择功能正常
- [ ] 科目选择功能正常
- [ ] 专属代码验证成功
- [ ] 费用计算正确（有折扣和无折扣场景）
- [ ] 表单提交数据完整
- [ ] 新城市（HZ/NJ/WX/XA/QD/ZZ）显示正常
- [ ] 浏览器控制台无错误

---

## 性能检查

### 加载时间
打开浏览器的 Performance 面板：
1. 开始录制
2. 刷新页面
3. 停止录制
4. 查看 Supabase API 请求时间

**预期**：
- `exam_sessions` 查询 < 500ms
- `exam_products` 查询 < 500ms
- 总页面加载 < 2s

### 内存使用
```javascript
// 在控制台中执行
console.log('场次数据大小:', JSON.stringify(examSessionsData).length, 'bytes');
console.log('产品数据大小:', JSON.stringify(examProductsData).length, 'bytes');
```

---

## 推荐测试流程

1. **第一步**：启动本地服务器
2. **第二步**：打开浏览器控制台（F12）
3. **第三步**：刷新页面，观察数据加载日志
4. **第四步**：测试地点转换函数
5. **第五步**：选择场次，测试科目显示
6. **第六步**：测试专属代码验证
7. **第七步**：填写完整表单并提交
8. **第八步**：检查提交的数据格式

祝测试顺利！🎉
