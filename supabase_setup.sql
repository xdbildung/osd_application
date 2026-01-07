-- ============================================
-- Supabase 数据库初始化脚本
-- ÖSD考试报名系统 - 数据库结构
-- ============================================

-- 1. 创建考试场次表 (exam_sessions)
CREATE TABLE IF NOT EXISTS exam_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    location TEXT NOT NULL,
    levels TEXT[] NOT NULL, -- 数组类型，存储该场次提供的考试等级，如 ['A1', 'A2', 'B1']
    is_active BOOLEAN DEFAULT true, -- 控制前端显示和报名开关：true=显示并允许报名，false=隐藏且不允许报名
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建考试产品价格表 (exam_products)
CREATE TABLE IF NOT EXISTS exam_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- 产品代码，如 'A1_CD_Full', 'A1_CD_Written' 等
    name TEXT NOT NULL, -- 产品名称，如 'A1全科', 'A1笔试' 等
    level TEXT NOT NULL, -- 考试等级: A1, A2, B1
    location TEXT NOT NULL, -- 地点: 成都(CD), 北京(BJ)
    module_type TEXT, -- 模块类型: Full(全科), Written(笔试), Oral(口试), Listening(听力), Reading(阅读)
    price_original INTEGER NOT NULL, -- 原价（单位：分，存储时使用分，显示时除以100）
    price_discounted INTEGER, -- 折后价（单位：分，可为空，只有全科考试有折扣）
    is_active BOOLEAN DEFAULT true, -- 控制产品是否在前端显示：true=显示，false=隐藏
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建折扣代码表 (coupons)
-- 注意：折扣信息已存储在 exam_products 表的 price_discounted 字段中
-- 此表仅用于验证折扣代码的有效性，不存储折扣金额或百分比
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- 折扣代码
    session_id UUID REFERENCES exam_sessions(id) ON DELETE CASCADE, -- 关联到特定场次
    valid_from DATE, -- 有效期开始
    valid_until DATE, -- 有效期结束
    usage_limit INTEGER, -- 使用次数限制（null表示无限制）
    usage_count INTEGER DEFAULT 0, -- 已使用次数
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_exam_sessions_date ON exam_sessions(date);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_location ON exam_sessions(location);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_active ON exam_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_exam_products_code ON exam_products(code);
CREATE INDEX IF NOT EXISTS idx_exam_products_level ON exam_products(level);
CREATE INDEX IF NOT EXISTS idx_exam_products_location ON exam_products(location);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_session_id ON coupons(session_id);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);

-- 5. 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为三个表添加自动更新 updated_at 的触发器
CREATE TRIGGER update_exam_sessions_updated_at
    BEFORE UPDATE ON exam_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_products_updated_at
    BEFORE UPDATE ON exam_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at
    BEFORE UPDATE ON coupons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. 插入考试场次数据
-- ============================================
-- 注意：请根据实际Excel数据修改以下日期、地点和报名截止日期
-- is_active_until: 报名截止日期，建议设置为考试日期前7天
INSERT INTO exam_sessions (date, location, levels, is_active, is_active_until) VALUES
    ('2026-03-15', 'CD', ARRAY['A1', 'A2', 'B1'], true, '2026-03-08'),
    ('2026-06-20', 'CD', ARRAY['A1', 'A2', 'B1'], true, '2026-06-13'),
    ('2026-09-10', 'CD', ARRAY['A1', 'A2', 'B1'], true, '2026-09-03'),
    ('2026-12-05', 'CD', ARRAY['A1', 'A2', 'B1'], true, '2026-11-28')
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. 插入考试产品价格数据
-- ============================================
-- 基于2026考试信息Excel中的价格表
-- 注意：只有全科考试有折扣（200元），单科考试无折扣
INSERT INTO exam_products (code, name, level, location, module_type, price_original, price_discounted, is_active) VALUES
    -- 成都 A1 等级
    ('A1_CD_Full', 'A1全科', 'A1', 'CD', 'Full', 160000, 140000, true), -- 1600元 -> 1400元 (折扣200元)
    ('A1_CD_Written', 'A1笔试(单科)', 'A1', 'CD', 'Written', 75000, NULL, true), -- 750元 (无折扣)
    ('A1_CD_Oral', 'A1口试(单科)', 'A1', 'CD', 'Oral', 85000, NULL, true), -- 850元 (无折扣)
    
    -- 成都 A2 等级
    ('A2_CD_Full', 'A2全科', 'A2', 'CD', 'Full', 170000, 150000, true), -- 1700元 -> 1500元 (折扣200元)
    ('A2_CD_Written', 'A2笔试(单科)', 'A2', 'CD', 'Written', 85000, NULL, true), -- 850元 (无折扣)
    ('A2_CD_Oral', 'A2口试(单科)', 'A2', 'CD', 'Oral', 95000, NULL, true), -- 950元 (无折扣)
    
    -- 成都 B1 等级
    ('B1_CD_Full', 'B1全科', 'B1', 'CD', 'Full', 210000, 190000, true), -- 2100元 -> 1900元 (折扣200元)
    ('B1_CD_Listening', 'B1听力(单科)', 'B1', 'CD', 'Listening', 60000, NULL, true), -- 600元 (无折扣)
    ('B1_CD_Oral', 'B1口语(单科)', 'B1', 'CD', 'Oral', 80000, NULL, true), -- 800元 (无折扣)
    ('B1_CD_Reading', 'B1阅读(单科)', 'B1', 'CD', 'Reading', 60000, NULL, true), -- 600元 (无折扣)
    ('B1_CD_Written', 'B1写作(单科)', 'B1', 'CD', 'Written', 80000, NULL, true) -- 800元 (无折扣)
ON CONFLICT (code) DO UPDATE SET
    price_original = EXCLUDED.price_original,
    price_discounted = EXCLUDED.price_discounted,
    updated_at = NOW();

-- ============================================
-- 8. 插入折扣代码数据
-- ============================================
-- 注意：请根据实际Excel中的折扣代码修改以下数据
-- 折扣代码仅用于验证，实际折扣价格已存储在 exam_products 表的 price_discounted 字段中
-- 只有全科考试可以使用折扣代码，单科考试不提供折扣
WITH session_ids AS (
    SELECT id, date, location 
    FROM exam_sessions 
    ORDER BY date
    LIMIT 4
)
INSERT INTO coupons (code, session_id, valid_from, valid_until, is_active)
SELECT 
    'COUPON' || TO_CHAR(s.date, 'YYYYMMDD') || '_' || LOWER(s.location) AS code, -- 示例代码，请替换为实际代码
    s.id AS session_id,
    s.date - INTERVAL '30 days' AS valid_from, -- 考试前30天开始有效
    s.date AS valid_until, -- 考试当天截止
    true AS is_active
FROM session_ids s
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 9. 启用 Row Level Security (RLS)
-- ============================================

-- 启用 RLS
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许所有用户（包括匿名用户）读取数据
-- 注意：前端应该只查询 is_active = true 的场次，但这里允许读取所有数据以便管理员查看
CREATE POLICY "Allow public read access on exam_sessions"
    ON exam_sessions
    FOR SELECT
    USING (true);

CREATE POLICY "Allow public read access on exam_products"
    ON exam_products
    FOR SELECT
    USING (is_active = true); -- 只允许读取激活的产品

CREATE POLICY "Allow public read access on coupons"
    ON coupons
    FOR SELECT
    USING (
        is_active = true 
        AND (valid_from IS NULL OR valid_from <= CURRENT_DATE)
        AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
        AND (usage_limit IS NULL OR usage_count < usage_limit)
    ); -- 只允许读取有效且未过期的折扣代码

-- ============================================
-- 10. 创建辅助视图（可选，方便查询）
-- ============================================

-- 创建视图：显示场次及其关联的折扣代码（仅显示活跃场次）
CREATE OR REPLACE VIEW exam_sessions_with_coupons AS
SELECT 
    es.id,
    es.date,
    es.location,
    es.levels,
    es.is_active,
    c.code AS coupon_code,
    c.valid_from,
    c.valid_until,
    c.usage_limit,
    c.usage_count
FROM exam_sessions es
LEFT JOIN coupons c ON c.session_id = es.id AND c.is_active = true
WHERE es.is_active = true; -- 只显示活跃的场次

-- 创建视图：前端专用 - 仅显示可报名的活跃场次
CREATE OR REPLACE VIEW active_exam_sessions AS
SELECT 
    es.id,
    es.date,
    es.location,
    es.levels,
    es.is_active,
    c.code AS coupon_code,
    c.valid_from AS coupon_valid_from,
    c.valid_until AS coupon_valid_until
FROM exam_sessions es
LEFT JOIN coupons c ON c.session_id = es.id AND c.is_active = true
WHERE es.is_active = true
ORDER BY es.date ASC;

-- 创建视图：显示产品及其当前价格（考虑折扣）
CREATE OR REPLACE VIEW exam_products_pricing AS
SELECT 
    ep.id,
    ep.code,
    ep.name,
    ep.level,
    ep.location,
    ep.module_type,
    ep.price_original,
    COALESCE(ep.price_discounted, ep.price_original) AS current_price,
    ep.is_active
FROM exam_products ep
WHERE ep.is_active = true;

-- ============================================
-- 11. 创建函数：验证折扣代码并获取产品价格
-- ============================================
-- 注意：折扣价格已存储在 exam_products 表的 price_discounted 字段中
-- 此函数仅验证折扣代码的有效性，并返回产品的原价和折后价

CREATE OR REPLACE FUNCTION validate_coupon_and_get_price(
    p_coupon_code TEXT,
    p_product_code TEXT,
    p_session_id UUID DEFAULT NULL
)
RETURNS TABLE (
    is_valid BOOLEAN,
    original_price INTEGER,
    discounted_price INTEGER,
    error_message TEXT
) AS $$
DECLARE
    v_coupon coupons%ROWTYPE;
    v_product exam_products%ROWTYPE;
BEGIN
    -- 查找折扣代码
    SELECT * INTO v_coupon
    FROM coupons
    WHERE code = p_coupon_code
      AND is_active = true
      AND (valid_from IS NULL OR valid_from <= CURRENT_DATE)
      AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
      AND (usage_limit IS NULL OR usage_count < usage_limit)
      AND (session_id IS NULL OR session_id = p_session_id);
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::INTEGER, NULL::INTEGER, '折扣代码无效或已过期'::TEXT;
        RETURN;
    END IF;
    
    -- 查找产品
    SELECT * INTO v_product
    FROM exam_products
    WHERE code = p_product_code
      AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::INTEGER, NULL::INTEGER, '产品代码无效'::TEXT;
        RETURN;
    END IF;
    
    -- 检查是否为全科考试（只有全科可以使用折扣）
    IF v_product.module_type != 'Full' THEN
        RETURN QUERY SELECT false, v_product.price_original, v_product.price_original, '单科考试不提供折扣'::TEXT;
        RETURN;
    END IF;
    
    -- 检查是否有折后价
    IF v_product.price_discounted IS NULL THEN
        RETURN QUERY SELECT false, v_product.price_original, v_product.price_original, '该产品不提供折扣'::TEXT;
        RETURN;
    END IF;
    
    -- 返回有效结果
    RETURN QUERY SELECT 
        true,
        v_product.price_original,
        v_product.price_discounted,
        NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 完成！
-- ============================================
-- 使用说明：
-- 1. 请在 Supabase SQL Editor 中运行此脚本
-- 2. 根据实际Excel数据修改第6、8节中的日期和折扣代码
-- 3. 所有价格以"分"为单位存储（显示时需要除以100）
-- 4. 折扣代码会自动关联到对应的场次
-- 5. 只有全科考试（module_type = 'Full'）有折扣，单科考试无折扣
-- 6. 折扣价格已存储在 exam_products 表的 price_discounted 字段中
-- 7. coupons 表仅用于验证折扣代码的有效性，不存储折扣金额
-- 8. RLS已配置为允许所有用户读取数据
--
-- 前端集成说明：
-- 9. exam_sessions.is_active 字段控制场次显示和报名开关：
--    - true: 前端显示该场次，允许用户报名
--    - false: 前端隐藏该场次，不允许报名
--    建议前端查询时使用: SELECT * FROM exam_sessions WHERE is_active = true
--    或使用视图: SELECT * FROM active_exam_sessions
--
-- 10. exam_products.is_active 字段控制产品显示：
--     - true: 前端显示该产品
--     - false: 前端隐藏该产品
--     建议前端查询时使用: SELECT * FROM exam_products WHERE is_active = true
--
-- 11. 前端查询示例：
--     -- 获取所有可报名的场次
--     SELECT * FROM active_exam_sessions;
--     
--     -- 获取某个场次的所有可用产品
--     SELECT * FROM exam_products 
--     WHERE location = 'CD' 
--       AND level = ANY((SELECT levels FROM exam_sessions WHERE id = $1 AND is_active = true))
--       AND is_active = true;
--
-- 12. 关闭/开启场次报名（管理员操作）：
--     -- 关闭某个场次
--     UPDATE exam_sessions SET is_active = false WHERE id = '场次UUID';
--     
--     -- 开启某个场次
--     UPDATE exam_sessions SET is_active = true WHERE id = '场次UUID';