-- ============================================
-- 修复Supabase视图权限问题
-- 问题：设置 security_invoker = true 导致 is_active_until 数据无法读取
-- 解决：恢复为 security_definer (默认) 或正确配置权限
-- ============================================

-- ============================================
-- 方案 A：恢复为 security_definer（推荐）
-- ============================================
-- 这是最简单且最安全的方式
-- 视图将使用创建者的权限执行，不受RLS影响

ALTER VIEW public.exam_sessions_with_coupons 
SET (security_invoker = false);

ALTER VIEW public.exam_products_pricing 
SET (security_invoker = false);

ALTER VIEW public.active_exam_sessions 
SET (security_invoker = false);

-- 验证修改
SELECT 
    viewname,
    viewowner,
    (viewoptions)::text as options
FROM pg_views
WHERE viewname IN ('exam_sessions_with_coupons', 'exam_products_pricing', 'active_exam_sessions');

-- ============================================
-- 测试是否修复成功
-- ============================================
-- 以anon角色测试（模拟前端访问）
SET ROLE anon;

-- 应该能看到 is_active_until 字段
SELECT id, date, location, is_active, is_active_until 
FROM exam_sessions 
WHERE is_active = true
LIMIT 3;

-- 如果使用视图，也测试一下
SELECT * FROM active_exam_sessions LIMIT 3;

RESET ROLE;

-- ============================================
-- 如果方案A不工作，使用方案B
-- ============================================
-- 只有在必须使用 security_invoker 时才执行以下代码

-- 1. 授予视图权限
-- GRANT SELECT ON exam_sessions_with_coupons TO anon, authenticated;
-- GRANT SELECT ON exam_products_pricing TO anon, authenticated;
-- GRANT SELECT ON active_exam_sessions TO anon, authenticated;

-- 2. 确保基础表的RLS策略正确
-- DROP POLICY IF EXISTS "Allow public read access to exam_sessions" ON exam_sessions;
-- CREATE POLICY "Allow public read access to exam_sessions" 
-- ON exam_sessions
-- FOR SELECT 
-- TO anon, authenticated
-- USING (true);

-- DROP POLICY IF EXISTS "Allow public read access to exam_products" ON exam_products;
-- CREATE POLICY "Allow public read access to exam_products" 
-- ON exam_products
-- FOR SELECT 
-- TO anon, authenticated
-- USING (true);

-- DROP POLICY IF EXISTS "Allow public read access to coupons" ON coupons;
-- CREATE POLICY "Allow public read access to coupons" 
-- ON coupons
-- FOR SELECT 
-- TO anon, authenticated
-- USING (true);

-- ============================================
-- 诊断查询（如果问题仍然存在）
-- ============================================

-- 查看所有视图的配置
-- SELECT 
--     viewname,
--     viewowner,
--     definition,
--     (viewoptions)::text as options
-- FROM pg_views
-- WHERE schemaname = 'public';

-- 查看所有RLS策略
-- SELECT 
--     schemaname,
--     tablename,
--     policyname,
--     permissive,
--     roles,
--     cmd,
--     qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- 检查表的RLS状态
-- SELECT 
--     schemaname,
--     tablename,
--     rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN ('exam_sessions', 'exam_products', 'coupons');

-- ============================================
-- ✅ 完成！
-- ============================================
-- 执行方案A后：
-- 1. 刷新前端网站
-- 2. 打开浏览器控制台
-- 3. 选择场次后运行：
--    const cb = document.querySelector('input[name="selectedVenues"]:checked');
--    console.log('deadline:', cb?.dataset?.deadline);
-- 4. 应该能看到日期值（如 "2026-03-08"）
-- 5. 提交测试表单，检查邮件中的日期是否正确
-- ============================================
