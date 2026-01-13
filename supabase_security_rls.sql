-- ============================================
-- Supabase Row Level Security (RLS) 配置
-- ============================================
-- 目的：保护数据库，即使 API 密钥泄露也无法随意访问数据
-- 执行方式：登录 Supabase Dashboard → SQL Editor → 粘贴并执行
-- ============================================

-- 1️⃣ 启用 RLS（行级安全策略）
-- ============================================
-- 启用后，所有访问都需要通过策略验证

ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- 如果有其他表（如 applications, registrations 等），也应该启用：
-- ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2️⃣ 创建公开读取策略
-- ============================================
-- 允许所有人通过 anon key 读取这些表（但不能修改）

-- exam_sessions 表：考试场次信息
CREATE POLICY "Allow public read access to exam_sessions" 
ON exam_sessions
FOR SELECT 
USING (true);

-- exam_products 表：考试产品和价格
CREATE POLICY "Allow public read access to exam_products" 
ON exam_products
FOR SELECT 
USING (true);

-- coupons 表：优惠码信息
CREATE POLICY "Allow public read access to coupons" 
ON coupons
FOR SELECT 
USING (true);

-- ============================================
-- 3️⃣ 创建条件性写入策略（可选）
-- ============================================
-- 如果需要允许特定条件下的写入，可以创建更细粒度的策略

-- 示例 1：只允许激活状态的优惠码被查询
-- DROP POLICY IF EXISTS "Allow public read access to coupons" ON coupons;
-- CREATE POLICY "Allow public read active coupons only" 
-- ON coupons
-- FOR SELECT 
-- USING (is_active = true);

-- 示例 2：只允许查看未过期的考试场次
-- DROP POLICY IF EXISTS "Allow public read access to exam_sessions" ON exam_sessions;
-- CREATE POLICY "Allow public read active exam_sessions only" 
-- ON exam_sessions
-- FOR SELECT 
-- USING (is_active_until >= CURRENT_DATE);

-- ============================================
-- 4️⃣ 管理员写入策略
-- ============================================
-- 所有 INSERT/UPDATE/DELETE 操作只能通过 service_role key 进行
-- （不创建写入策略，默认拒绝所有写入）

-- 如果需要通过前端允许特定用户写入，可以使用：
-- CREATE POLICY "Allow authenticated insert" 
-- ON exam_sessions
-- FOR INSERT 
-- WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- 5️⃣ 查看当前所有策略
-- ============================================
-- 执行以下查询查看所有已配置的策略

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- 6️⃣ 测试 RLS 是否生效
-- ============================================
-- 以下测试应该在 SQL Editor 中使用 "RLS: Enabled" 模式执行

-- 测试 1：读取应该成功
SELECT * FROM exam_sessions LIMIT 5;
-- 预期：返回数据

-- 测试 2：写入应该失败（使用 anon role）
-- INSERT INTO exam_sessions (session_code, exam_date) VALUES ('TEST', '2025-12-31');
-- 预期：ERROR: new row violates row-level security policy

-- 测试 3：更新应该失败
-- UPDATE exam_sessions SET exam_date = '2025-12-31' WHERE id = 1;
-- 预期：ERROR: new row violates row-level security policy

-- 测试 4：删除应该失败
-- DELETE FROM exam_sessions WHERE id = 1;
-- 预期：ERROR: new row violates row-level security policy

-- ============================================
-- 7️⃣ 禁用 RLS（回滚用）
-- ============================================
-- 如果需要临时禁用 RLS，执行以下命令：
-- ⚠️ 警告：禁用后数据将不受保护！

-- ALTER TABLE exam_sessions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE exam_products DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE coupons DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 8️⃣ 删除所有策略（清理用）
-- ============================================
-- 如果需要重新配置，先删除现有策略：

-- DROP POLICY IF EXISTS "Allow public read access to exam_sessions" ON exam_sessions;
-- DROP POLICY IF EXISTS "Allow public read access to exam_products" ON exam_products;
-- DROP POLICY IF EXISTS "Allow public read access to coupons" ON coupons;

-- ============================================
-- ✅ 完成！
-- ============================================
-- 执行以上 SQL 后，您的数据库已受到 RLS 保护
-- 
-- 验证步骤：
-- 1. 在 Supabase Dashboard 检查 "Authentication" → "Policies"
-- 2. 应该看到为每个表创建的策略
-- 3. 尝试在前端测试，确保读取功能正常
-- 4. 尝试使用 API 直接写入，应该被拒绝
-- ============================================
