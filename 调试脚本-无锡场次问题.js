// 🔍 无锡考场A1不显示问题 - 调试脚本
// 请在浏览器控制台中运行此脚本

console.log('========== 无锡考场调试开始 ==========\n');

// 1. 检查场次数据
console.log('1️⃣ 检查无锡场次数据:');
const wxSessions = examSessionsData.filter(s => s.location === 'WX');
console.log('无锡场次数量:', wxSessions.length);

if (wxSessions.length === 0) {
    console.error('❌ 数据库中没有无锡场次！');
    console.log('请在 Supabase 中添加无锡场次：');
    console.log(`INSERT INTO exam_sessions (date, location, levels, is_active, is_active_until) VALUES
    ('2026-XX-XX', 'WX', ARRAY['A1', 'A2', 'B1'], true, '2026-XX-XX');`);
} else {
    console.log('✅ 找到无锡场次:');
    wxSessions.forEach(s => {
        console.log('  - 日期:', s.date);
        console.log('  - 地点代码:', s.location);
        console.log('  - 等级:', s.levels);
        console.log('  - 是否激活:', s.is_active);
        console.log('  - 场次ID:', s.id);
    });
}

// 2. 检查产品数据
console.log('\n2️⃣ 检查无锡产品数据:');
const wxProducts = examProductsData.filter(p => p.location === 'WX');
console.log('无锡产品数量:', wxProducts.length);

if (wxProducts.length === 0) {
    console.error('❌ 数据库中没有无锡的产品数据！');
    console.log('\n请在 Supabase 中添加无锡产品数据：');
    console.log(`INSERT INTO exam_products (code, name, level, location, module_type, price_original, price_discounted, is_active) VALUES
    -- 无锡 A1 等级
    ('A1_WX_Full', 'A1全科', 'A1', 'WX', 'Full', 160000, 140000, true),
    ('A1_WX_Written', 'A1笔试(单科)', 'A1', 'WX', 'Written', 75000, NULL, true),
    ('A1_WX_Oral', 'A1口试(单科)', 'A1', 'WX', 'Oral', 85000, NULL, true),
    
    -- 无锡 A2 等级
    ('A2_WX_Full', 'A2全科', 'A2', 'WX', 'Full', 170000, 150000, true),
    ('A2_WX_Written', 'A2笔试(单科)', 'A2', 'WX', 'Written', 85000, NULL, true),
    ('A2_WX_Oral', 'A2口试(单科)', 'A2', 'WX', 'Oral', 95000, NULL, true),
    
    -- 无锡 B1 等级
    ('B1_WX_Full', 'B1全科', 'B1', 'WX', 'Full', 210000, 190000, true),
    ('B1_WX_Listening', 'B1听力(单科)', 'B1', 'WX', 'Listening', 60000, NULL, true),
    ('B1_WX_Oral', 'B1口语(单科)', 'B1', 'WX', 'Oral', 80000, NULL, true),
    ('B1_WX_Reading', 'B1阅读(单科)', 'B1', 'WX', 'Reading', 60000, NULL, true),
    ('B1_WX_Written', 'B1写作(单科)', 'B1', 'WX', 'Written', 80000, NULL, true);`);
} else {
    console.log('✅ 找到无锡产品:');
    
    // 按等级分组
    const productsByLevel = {
        'A1': wxProducts.filter(p => p.level === 'A1'),
        'A2': wxProducts.filter(p => p.level === 'A2'),
        'B1': wxProducts.filter(p => p.level === 'B1')
    };
    
    Object.keys(productsByLevel).forEach(level => {
        const products = productsByLevel[level];
        console.log(`\n  ${level} 等级产品 (${products.length}个):`);
        products.forEach(p => {
            console.log(`    - ${p.code}: ${p.name} (${p.module_type})`);
        });
    });
}

// 3. 检查A1产品是否匹配
console.log('\n3️⃣ 检查A1产品匹配:');
const a1Products = examProductsData.filter(p => 
    p.location === 'WX' && 
    p.level === 'A1' && 
    p.is_active !== false
);
console.log('无锡A1产品数量:', a1Products.length);

if (a1Products.length === 0) {
    console.error('❌ 没有找到匹配的A1产品！');
    console.log('可能原因：');
    console.log('1. 数据库中没有 location=WX, level=A1 的产品');
    console.log('2. 产品的 is_active = false');
    console.log('3. 产品的 location 字段格式不对（应该是 WX 而不是其他）');
} else {
    console.log('✅ A1产品列表:');
    a1Products.forEach(p => {
        console.log(`  - ${p.code}: ${p.name}`);
        console.log(`    location: "${p.location}"`);
        console.log(`    is_active: ${p.is_active}`);
    });
}

// 4. 检查地点代码转换
console.log('\n4️⃣ 检查地点转换:');
console.log('WX → 中文:', getLocationName('WX'));
console.log('无锡 → 代码:', getLocationCode('无锡'));

if (getLocationName('WX') !== '无锡') {
    console.error('❌ 地点转换异常！WX 应该转换为 "无锡"');
    console.log('LOCATION_MAPPINGS:', LOCATION_MAPPINGS);
}

// 5. 模拟选择无锡场次
console.log('\n5️⃣ 模拟渲染测试:');
if (wxSessions.length > 0 && a1Products.length > 0) {
    const testSession = wxSessions[0];
    const locationCode = getLocationCode(testSession.location);
    
    console.log('场次信息:');
    console.log('  - 原始 location:', testSession.location);
    console.log('  - 转换后代码:', locationCode);
    console.log('  - 等级:', testSession.levels);
    
    console.log('\n产品匹配测试:');
    testSession.levels.forEach(level => {
        const matchingProducts = examProductsData.filter(p => 
            p.level === level && 
            p.location === locationCode && 
            p.is_active !== false
        );
        console.log(`  ${level}: ${matchingProducts.length}个产品`);
    });
} else {
    console.log('⚠️ 无法进行渲染测试（缺少场次或产品数据）');
}

// 6. 检查DOM元素
console.log('\n6️⃣ 检查DOM元素:');
const venueOptionsId = 'wxOptions';
const venueOptionsContainer = document.getElementById(venueOptionsId);
console.log(`wxOptions 容器:`, venueOptionsContainer ? '✅ 存在' : '❌ 不存在');

if (venueOptionsContainer) {
    console.log('容器内容:', venueOptionsContainer.innerHTML.substring(0, 200) + '...');
}

// 7. 检查无锡场次是否被选中
const wxCheckbox = Array.from(document.querySelectorAll('input[name="selectedVenues"]'))
    .find(cb => cb.value === '无锡' || cb.dataset.location === 'WX');

if (wxCheckbox) {
    console.log('\n7️⃣ 无锡场次状态:');
    console.log('  - 是否选中:', wxCheckbox.checked);
    console.log('  - 是否禁用:', wxCheckbox.disabled);
    console.log('  - value:', wxCheckbox.value);
} else {
    console.log('\n7️⃣ ❌ 未找到无锡场次的 checkbox');
}

console.log('\n========== 调试完成 ==========');
console.log('\n📝 下一步操作建议:');
console.log('1. 如果没有无锡场次数据 → 在数据库中添加');
console.log('2. 如果没有无锡产品数据 → 在数据库中添加');
console.log('3. 如果有数据但不显示 → 强制刷新页面 (Ctrl+Shift+R)');
console.log('4. 如果仍然不显示 → 检查控制台错误信息');
