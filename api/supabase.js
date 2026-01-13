/**
 * Supabase 安全代理 API
 * 保护 Supabase 凭据不暴露在前端
 * Vercel Serverless Function
 */

// 从环境变量读取 Supabase 凭据
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// 允许的表名白名单（安全控制）
const ALLOWED_TABLES = [
    'exam_sessions',
    'exam_products',
    'coupons'
];

// 允许的操作白名单
const ALLOWED_OPERATIONS = ['SELECT'];

module.exports = async (req, res) => {
    // 只允许 POST 请求
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: 'Method not allowed',
            message: 'Only POST requests are allowed'
        });
    }

    // 检查环境变量是否配置
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('❌ Supabase credentials not configured in environment variables');
        return res.status(500).json({ 
            error: 'Server configuration error',
            message: 'Supabase credentials not configured'
        });
    }

    try {
        const { table, options = {} } = req.body;

        // 验证请求参数
        if (!table) {
            return res.status(400).json({ 
                error: 'Bad request',
                message: 'Table name is required'
            });
        }

        // 检查表名是否在白名单中
        if (!ALLOWED_TABLES.includes(table)) {
            console.warn(`⚠️ Attempted access to unauthorized table: ${table}`);
            return res.status(403).json({ 
                error: 'Forbidden',
                message: `Access to table '${table}' is not allowed`
            });
        }

        // 解析查询选项
        const { 
            select = '*', 
            filter = '', 
            order = '', 
            limit = null 
        } = options;

        // 构建 Supabase REST API URL
        let url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}`;

        if (filter) {
            url += `&${filter}`;
        }

        if (order) {
            url += `&order=${encodeURIComponent(order)}`;
        }

        if (limit) {
            url += `&limit=${limit}`;
        }

        console.log(`🔐 Proxying Supabase query: ${table}`);

        // 调用 Supabase API
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
        });

        // 检查响应状态
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Supabase query failed: ${response.status} - ${errorText}`);
            return res.status(response.status).json({ 
                error: 'Supabase query failed',
                message: `Failed to fetch data from ${table}`,
                details: response.statusText
            });
        }

        // 返回数据
        const data = await response.json();
        console.log(`✅ Successfully fetched ${data.length || 0} records from ${table}`);
        
        return res.status(200).json(data);

    } catch (error) {
        console.error('❌ Error in Supabase proxy:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: 'Failed to process Supabase query',
            details: error.message
        });
    }
};
