# Supabase 数据库集成总结

## 概述
本次更新将 ÖSD 考试报名系统从硬编码的静态数据改为使用 Supabase 数据库动态加载，实现了考试场次、产品价格和专属代码的数据库管理。

## 主要功能

### 1. 数据库集成
- **Supabase REST API**: 使用原生 Fetch API 与 Supabase 交互，无需额外库
- **数据表**:
  - `exam_sessions`: 考试场次（日期、地点、等级、是否激活）
  - `exam_products`: 考试产品（科目、原价、折后价）
  - `coupons`: 专属代码（代码、关联场次）

### 2. 动态场次加载
- 页面加载时自动从数据库读取活跃场次（`is_active = true`）
- 根据 `is_active` 字段控制场次是否可报名
- 场次关闭时显示"报名已截止"并禁用选择

### 3. 动态产品加载
- 根据选中场次的 `levels` 字段动态生成考试科目选项
- 按等级（A1/A2/B1）和模块类型（全科/单科）分组显示
- 价格从数据库读取，支持原价和折后价

### 4. 专属代码功能
- 用户可输入专属代码并验证
- 验证成功后，全科考试自动使用折后价
- 单科考试不享受折扣
- 专属代码与特定场次绑定

### 5. 费用计算优化
- 从数据库读取价格（单位：分，显示时转换为元）
- **移除了"单科总价超过全科价格时按全科价格收费"的限制**
- 现在直接加总所有选择的考试费用
- 邮件中显示折扣信息（原价删除线 + 折后价高亮）

### 6. 地点映射优化 ✨ 新增
- **移除硬编码**: 不再硬编码"成都"和"北京"
- **动态映射**: 使用 `LOCATION_MAPPINGS` 配置对象
- **支持扩展**: 可轻松添加新城市（上海、广州、深圳等）
- **双向转换**:
  - `getLocationName(code)`: 代码 → 中文名称（CD → 成都）
  - `getLocationCode(name)`: 中文名称 → 代码（成都 → CD）

## 地点映射配置

### 当前支持的城市
```javascript
const LOCATION_MAPPINGS = {
    'CD': '成都',
    'BJ': '北京',
    'SH': '上海',
    'GZ': '广州',
    'SZ': '深圳'
};
```

### 如何添加新城市
1. 在 `LOCATION_MAPPINGS` 中添加新的映射关系
2. 在数据库 `exam_sessions` 表中使用对应的代码（如 'SH'）
3. 无需修改其他代码，系统会自动识别

### 使用示例
```javascript
// 代码转中文
getLocationName('CD')  // 返回: '成都'
getLocationName('SH')  // 返回: '上海'
getLocationName('未知') // 返回: '未知' (保持原样)

// 中文转代码
getLocationCode('成都')  // 返回: 'CD'
getLocationCode('上海')  // 返回: 'SH'
getLocationCode('CD')    // 返回: 'CD' (已是代码格式)
```

## 技术实现

### Supabase 配置
```javascript
const SUPABASE_URL = 'https://totxnqrbgvppdrziynpz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_j9PE3FzvHbAzDOoBgr1NZw_zEw7MksE';
```

### 核心函数
1. **`supabaseQuery(table, options)`**: 通用查询函数
2. **`loadExamSessions()`**: 加载考试场次
3. **`loadExamProducts()`**: 加载产品价格
4. **`validateCouponCode(code, sessionId)`**: 验证专属代码
5. **`renderExamSessions(sessions)`**: 动态渲染场次选择
6. **`renderExamProducts(session, products)`**: 动态渲染产品选项
7. **`calculateTotalFee(examSessions)`**: 计算总费用（支持折扣）
8. **`getLocationName(code)`**: 地点代码转中文名称 ✨
9. **`getLocationCode(name)`**: 中文名称转地点代码 ✨

### 数据流程
```
页面加载
  ↓
加载 exam_sessions + exam_products
  ↓
渲染场次选择（仅 is_active=true）
  ↓
用户选择场次
  ↓
动态生成该场次的产品选项
  ↓
用户输入专属代码（可选）
  ↓
验证专属代码（检查 session_id 匹配）
  ↓
计算费用（全科使用折后价，单科使用原价）
  ↓
提交表单（包含专属代码信息）
```

## 修改的文件

### 1. `script.js` (主文件)
- ✅ 添加 Supabase 集成代码
- ✅ 添加地点映射配置和转换函数
- ✅ 实现动态数据加载
- ✅ 实现专属代码验证
- ✅ 更新费用计算逻辑
- ✅ 移除所有硬编码的地点判断

### 2. `public/script.js`
- ✅ 已同步更新

### 3. `index.html`
- ✅ 添加专属代码输入框
- ✅ 用户已将"优惠码"改为"专属代码"

### 4. `public/index.html`
- ✅ 已同步更新

### 5. `styles.css`
- ✅ 添加通知动画样式

### 6. `public/styles.css`
- ✅ 已同步更新

## 数据库要求

### Row Level Security (RLS) 策略
确保以下 RLS 策略已启用：
```sql
-- 允许所有用户读取活跃的考试场次
CREATE POLICY "Allow public read active sessions"
ON exam_sessions FOR SELECT
TO public
USING (is_active = true);

-- 允许所有用户读取活跃的产品
CREATE POLICY "Allow public read active products"
ON exam_products FOR SELECT
TO public
USING (is_active = true);

-- 允许所有用户读取活跃的专属代码
CREATE POLICY "Allow public read active coupons"
ON coupons FOR SELECT
TO public
USING (is_active = true);
```

### 数据格式要求
1. **exam_sessions.location**: 使用代码格式（如 'CD', 'BJ', 'SH'）
2. **exam_sessions.levels**: 数组类型（如 `['A1', 'A2', 'B1']`）
3. **exam_products.price_original**: 整数，单位为分（如 160000 = 1600元）
4. **exam_products.price_discounted**: 整数或 NULL
5. **coupons.session_id**: UUID，关联到 exam_sessions.id

## 地点扩展指南

### 添加新城市的步骤

#### 1. 更新代码配置
在 `script.js` 中的 `LOCATION_MAPPINGS` 添加新城市：
```javascript
const LOCATION_MAPPINGS = {
    'CD': '成都',
    'BJ': '北京',
    'SH': '上海',  // 新增
    'GZ': '广州',  // 新增
    'HZ': '杭州'   // 新增
};
```

#### 2. 在数据库中添加场次
```sql
INSERT INTO exam_sessions (date, location, levels, is_active)
VALUES 
    ('2025-12-15', 'SH', ARRAY['A1', 'A2'], true),
    ('2025-12-20', 'GZ', ARRAY['A1', 'B1'], true);
```

#### 3. 添加对应产品
```sql
INSERT INTO exam_products (code, name, level, location, module_type, price_original, price_discounted, is_active)
VALUES
    ('A1_SH_Full', 'A1全科', 'A1', 'SH', 'Full', 160000, 140000, true),
    ('A1_SH_Written', 'A1笔试', 'A1', 'SH', 'Written', 95000, NULL, true);
```

#### 4. 添加专属代码（可选）
```sql
INSERT INTO coupons (code, session_id, is_active)
VALUES ('SHANGHAI2025', '场次UUID', true);
```

### 完全动态化（无需代码修改）
如果希望完全不修改代码，可以：
1. 在数据库中直接使用中文名称（如 location = '上海'）
2. 系统会自动处理，无需在 `LOCATION_MAPPINGS` 中配置
3. 但建议使用代码格式（如 'SH'）以保持数据一致性

## 用户界面变化

### 专属代码输入框
- 位置：考试科目选择之后
- 功能：输入专属代码 → 点击"验证专属代码"按钮
- 反馈：
  - ✅ 成功：绿色提示"专属代码验证成功！"
  - ❌ 失败：红色提示错误原因

### 场次显示
- 活跃场次：正常显示，可选择
- 已关闭场次：灰色显示，标注"报名已截止"，不可选择

### 费用显示
- 有折扣：显示原价（删除线）+ 折后价（绿色高亮）
- 无折扣：仅显示原价

## 测试建议

### 1. 场次加载测试
- 打开浏览器控制台，查看是否成功加载场次数据
- 检查 `is_active = false` 的场次是否正确隐藏或禁用

### 2. 产品加载测试
- 选择不同场次，检查是否显示正确的等级和科目
- 验证价格是否正确显示（元，非分）

### 3. 专属代码测试
- 输入正确的专属代码，验证是否成功
- 输入错误的专属代码，验证是否显示错误提示
- 验证全科考试是否使用折后价，单科是否使用原价

### 4. 地点测试 ✨
- 在数据库中添加新城市（如 'SH'）
- 在 `LOCATION_MAPPINGS` 中添加映射
- 验证前端是否正确显示"上海"
- 验证表单提交时地点信息是否正确

### 5. 费用计算测试
- 选择多个单科，验证总价是否为直接加总（即使超过全科价格）
- 使用专属代码后，验证全科价格是否变为折后价

## 注意事项

1. **Supabase Anon Key**: 当前使用的是可公开的 Anon Key，仅允许读取操作
2. **RLS 策略**: 确保 RLS 策略正确配置，防止数据泄露
3. **价格单位**: 数据库中价格以"分"为单位，前端显示时自动转换为"元"
4. **地点代码**: 建议使用 2-3 位大写字母作为地点代码（如 CD, BJ, SH）
5. **向后兼容**: 如果数据库中已使用中文名称，系统会自动处理，无需修改数据
6. **缓存问题**: 如果修改了 JS 文件，建议清除浏览器缓存或使用 `?v=timestamp` 参数

## 后续优化建议

1. **管理后台**: 开发一个管理界面，方便管理员在线管理场次、产品和专属代码
2. **实时更新**: 使用 Supabase Realtime 功能，实现数据实时同步
3. **数据缓存**: 在前端添加缓存机制，减少数据库查询次数
4. **错误处理**: 增强错误处理和用户提示
5. **地点图标**: 为不同城市添加图标或标识
6. **多语言支持**: 支持英文、德文等多语言界面

## 版本信息
- **版本**: v2.0.0
- **更新日期**: 2026-01-06
- **主要变更**: 
  - Supabase 数据库集成
  - 动态场次和产品加载
  - 专属代码功能
  - 费用计算优化
  - 地点映射动态化 ✨

## 联系方式
如有问题或建议，请联系开发团队。
