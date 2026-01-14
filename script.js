// ============================================
// Supabase 安全配置
// ============================================
// 🔒 安全提示：Supabase 凭据已移至后端 API 代理层
// 前端不再直接访问 Supabase，而是通过 /api/supabase 代理
const SUPABASE_PROXY_URL = '/api/supabase';

// 全局数据存储
let examSessionsData = []; // 存储从数据库加载的场次数据
let examProductsData = []; // 存储从数据库加载的产品数据
let validatedCoupon = null; // 存储已验证的专属代码信息
let selectedSessionId = null; // 当前选中的场次ID

// ============================================
// 地点映射配置（支持动态扩展）
// ============================================
const LOCATION_MAPPINGS = {
    'BJ': '北京',
    'CD': '成都',
    'GZ': '广州',
    'HZ': '杭州',
    'NJ': '南京',
    'QD': '青岛',
    'SH': '上海',
    'SZ': '深圳',
    'WX': '无锡',
    'XA': '西安',
    'ZZ': '郑州'
    // 可根据需要添加更多城市
};

// 地点代码转中文名称
function getLocationName(locationCode) {
    if (!locationCode) return locationCode;
    // 如果已经是中文名称，直接返回
    if (Object.values(LOCATION_MAPPINGS).includes(locationCode)) {
        return locationCode;
    }
    // 转换为大写以支持不同大小写格式
    const code = locationCode.toString().toUpperCase();
    return LOCATION_MAPPINGS[code] || locationCode;
}

// 中文名称转地点代码
function getLocationCode(locationName) {
    if (!locationName) return locationName;
    // 如果已经是代码格式，直接返回
    if (LOCATION_MAPPINGS[locationName.toUpperCase()]) {
        return locationName.toUpperCase();
    }
    // 查找对应的代码
    for (const [code, name] of Object.entries(LOCATION_MAPPINGS)) {
        if (name === locationName) {
            return code;
        }
    }
    return locationName;
}

// 🔒 安全的 Supabase 查询函数（通过后端代理）
async function supabaseQuery(table, options = {}) {
    const { select = '*', filter = '', order = '', limit = null } = options;
    
    try {
        // 通过后端 API 代理查询 Supabase
        const response = await fetch(SUPABASE_PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                table: table,
                options: {
                    select: select,
                    filter: filter,
                    order: order,
                    limit: limit
                }
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `API query failed: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`❌ Error querying ${table}:`, error);
        throw error;
    }
}

// 加载考试场次数据
async function loadExamSessions() {
    try {
        console.log('🔄 正在从 Supabase 加载考试场次数据...');
        const sessions = await supabaseQuery('exam_sessions', {
            select: '*',
            filter: 'is_active=eq.true',
            order: 'date.asc'
        });
        
        examSessionsData = sessions;
        console.log('✅ 成功加载场次数据:', sessions.length, '个场次');
        return sessions;
    } catch (error) {
        console.error('❌ 加载场次数据失败:', error);
        // 如果加载失败，显示错误提示但不阻止页面使用
        showNotification('加载考试场次数据失败，请刷新页面重试', 'error');
        return [];
    }
}

// 加载考试产品数据
async function loadExamProducts() {
    try {
        console.log('🔄 正在从 Supabase 加载产品价格数据...');
        const products = await supabaseQuery('exam_products', {
            select: '*',
            filter: 'is_active=eq.true',
            order: 'level.asc,module_type.asc'
        });
        
        examProductsData = products;
        console.log('✅ 成功加载产品数据:', products.length, '个产品');
        return products;
    } catch (error) {
        console.error('❌ 加载产品数据失败:', error);
        showNotification('加载产品价格数据失败，请刷新页面重试', 'error');
        return [];
    }
}

// 验证专属代码
async function validateCouponCode(couponCode, sessionId) {
    if (!couponCode || !couponCode.trim()) {
        return { valid: false, message: '请输入专属代码' };
    }
    
    if (!sessionId) {
        return { valid: false, message: '请先选择考试场次' };
    }
    
    try {
        console.log('🔄 正在验证专属代码:', couponCode, '场次ID:', sessionId);
        
        // 查询专属代码：检查code、is_active和session_id
        const coupons = await supabaseQuery('coupons', {
            select: '*',
            filter: `code=eq.${encodeURIComponent(couponCode.trim())}&is_active=eq.true&session_id=eq.${sessionId}`
        });
        
        if (coupons.length === 0) {
            return { valid: false, message: '专属代码无效或不适用于此场次' };
        }
        
        const coupon = coupons[0];
        
        validatedCoupon = coupon;
        console.log('✅ 专属代码验证成功:', coupon);
        return { valid: true, message: '专属代码验证成功！', coupon: coupon };
    } catch (error) {
        console.error('❌ 验证专属代码失败:', error);
        return { valid: false, message: '验证专属代码时发生错误，请稍后重试' };
    }
}

// 显示通知消息
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3'};
        color: white;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 10000;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 移动端检测和调试工具函数
function getMobileInfo() {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(userAgent);
    const isWeChat = /MicroMessenger/i.test(userAgent);
    
    return {
        isMobile,
        isIOS,
        isAndroid,
        isWeChat,
        userAgent: userAgent.substring(0, 100), // 截取前100个字符
        screenSize: `${screen.width}x${screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        connection: navigator.onLine ? '在线' : '离线',
        memory: navigator.deviceMemory || '未知',
        language: navigator.language
    };
}

// 收集调试信息
function collectDebugInfo(error, fileInfo) {
    return {
        timestamp: getBeijingTime(),
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack ? error.stack.substring(0, 200) : null
        },
        file: fileInfo,
        device: getMobileInfo(),
        performance: {
            memory: window.performance && window.performance.memory ? {
                used: Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(window.performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(window.performance.memory.jsHeapSizeLimit / 1024 / 1024)
            } : null
        }
    };
}

// 北京时间工具函数
function getBeijingTime() {
    const now = new Date();
    // 北京时间是UTC+8
    const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    return beijingTime.toISOString();
}

function getBeijingTimeString() {
    const now = new Date();
    // 北京时间是UTC+8
    const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    return beijingTime.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Shanghai'
    });
}

// ============================================
// 动态生成场次和产品HTML的函数
// ============================================

// 格式化日期显示
function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}年${month}月${day}日`;
}

// 动态生成场次选择HTML
function renderExamSessions(sessions) {
    const sessionSelectionContainer = document.querySelector('.session-selection');
    if (!sessionSelectionContainer) {
        console.error('找不到场次选择容器');
        return;
    }
    
    // 清空现有内容
    sessionSelectionContainer.innerHTML = '';
    
    if (sessions.length === 0) {
        sessionSelectionContainer.innerHTML = '<p style="color: #999; padding: 20px; text-align: center;">暂无可用考试场次</p>';
        return;
    }
    
    sessions.forEach(session => {
        const locationName = getLocationName(session.location);
        const dateDisplay = formatDateForDisplay(session.date);
        const isActive = session.is_active !== false;
        
        // 格式化报名截止日期
        let deadlineDisplay = '';
        if (session.is_active_until) {
            const deadlineDate = new Date(session.is_active_until);
            const year = deadlineDate.getFullYear();
            const month = String(deadlineDate.getMonth() + 1).padStart(2, '0');
            const day = String(deadlineDate.getDate()).padStart(2, '0');
            deadlineDisplay = `报名截止：${year}年${month}月${day}日`;
        }
        
        const sessionOption = document.createElement('label');
        sessionOption.className = 'session-option';
        if (!isActive) {
            sessionOption.style.opacity = '0.5';
            sessionOption.style.cursor = 'not-allowed';
        }
        
        sessionOption.innerHTML = `
            <input 
                type="checkbox" 
                name="selectedVenues" 
                value="${locationName}" 
                data-venue="${locationName}" 
                data-date="${dateDisplay}"
                data-session-id="${session.id}"
                data-session-date="${session.date}"
                data-deadline="${session.is_active_until || ''}"
                ${!isActive ? 'disabled' : ''}
            >
            <span class="session-info">
                <strong>${locationName}考场</strong>
                <small>考试日期：${dateDisplay}</small>
                ${deadlineDisplay ? `<small style="color: #ff9800; display: block; margin-top: 2px;">${deadlineDisplay}</small>` : ''}
                ${!isActive ? '<small style="color: #f44336; display: block; margin-top: 4px;">报名已截止</small>' : ''}
            </span>
        `;
        
        sessionSelectionContainer.appendChild(sessionOption);
    });
}

// 动态生成产品选项HTML
function renderExamProducts(session, products) {
    // 根据场次ID找到对应的场次数据
    const sessionData = examSessionsData.find(s => s.id === session.id);
    if (!sessionData) {
        console.error('找不到场次数据:', session.id);
        return;
    }
    
    const locationCode = getLocationCode(session.location);
    const levels = sessionData.levels || [];
    
    // 创建场次选项容器
    const venueOptionsId = `${locationCode.toLowerCase()}Options`;
    let venueOptionsContainer = document.getElementById(venueOptionsId);
    
    if (!venueOptionsContainer) {
        // 如果容器不存在，创建一个新的
        venueOptionsContainer = document.createElement('div');
        venueOptionsContainer.className = 'form-group venue-options';
        venueOptionsContainer.id = venueOptionsId;
        venueOptionsContainer.style.display = 'none';
        
        const sessionSelection = document.querySelector('.session-selection').parentElement;
        sessionSelection.insertAdjacentElement('afterend', venueOptionsContainer);
    }
    
    const dateDisplay = formatDateForDisplay(session.date);
    const locationName = getLocationName(session.location);  // 🔧 修复：转换地点代码为中文
    venueOptionsContainer.innerHTML = `
        <label>${locationName}考场 - ${dateDisplay} 考试科目</label>
        <div class="exam-venue-container" id="${venueOptionsId}-container"></div>
        <div class="form-note">
            💡 选择全科后，同等级的单科选项将自动禁用。
        </div>
    `;
    
    const container = venueOptionsContainer.querySelector(`#${venueOptionsId}-container`);
    
    // 按等级分组产品
    const productsByLevel = {};
    levels.forEach(level => {
        productsByLevel[level] = products.filter(p => 
            p.level === level && 
            p.location === locationCode && 
            p.is_active !== false
        );
    });
    
    // 为每个等级生成HTML
    Object.keys(productsByLevel).sort().forEach(level => {
        const levelProducts = productsByLevel[level];
        if (levelProducts.length === 0) return;
        
        const levelSection = document.createElement('div');
        levelSection.className = 'level-section';
        
        const levelTitle = document.createElement('h4');
        levelTitle.textContent = `${level}等级`;
        levelSection.appendChild(levelTitle);
        
        const examTypeGroup = document.createElement('div');
        examTypeGroup.className = 'exam-type-group';
        
        // 先添加全科选项
        const fullProduct = levelProducts.find(p => p.module_type === 'Full');
        if (fullProduct) {
            const fullLabel = document.createElement('label');
            fullLabel.className = 'checkbox-label';
            fullLabel.innerHTML = `
                <input 
                    type="checkbox" 
                    name="examSessions" 
                    value="${fullProduct.code}" 
                    data-level="${level}" 
                    data-location="${session.location}"
                    data-product-id="${fullProduct.id}"
                >
                <span>${fullProduct.name}</span>
            `;
            examTypeGroup.appendChild(fullLabel);
        }
        
        // 添加单科选项
        const singleProducts = levelProducts.filter(p => p.module_type !== 'Full');
        if (singleProducts.length > 0) {
            const singleModulesDiv = document.createElement('div');
            singleModulesDiv.className = 'single-modules';
            singleModulesDiv.style.marginLeft = '20px';
            
            singleProducts.forEach(product => {
                const singleLabel = document.createElement('label');
                singleLabel.className = 'checkbox-label';
                singleLabel.innerHTML = `
                    <input 
                        type="checkbox" 
                        name="examSessions" 
                        value="${product.code}" 
                        data-level="${level}" 
                        data-location="${session.location}"
                        data-single="true"
                        data-product-id="${product.id}"
                    >
                    <span>${product.name}</span>
                `;
                singleModulesDiv.appendChild(singleLabel);
            });
            
            examTypeGroup.appendChild(singleModulesDiv);
        }
        
        levelSection.appendChild(examTypeGroup);
        container.appendChild(levelSection);
    });
}

document.addEventListener('DOMContentLoaded', async function() {
    const form = document.getElementById('registrationForm');
    const successMessage = document.getElementById('successMessage');
    const submitBtn = document.querySelector('.submit-btn');
    const nationalitySelect = document.getElementById('nationality');
    const otherNationalityGroup = document.getElementById('otherNationalityGroup');
    const otherNationalityInput = document.getElementById('otherNationality');

    // 加载开发配置并预填写表单
    loadDevConfig();
    
    // 从 Supabase 加载数据
    try {
        await Promise.all([
            loadExamSessions(),
            loadExamProducts()
        ]);
        
        // 渲染场次选择
        if (examSessionsData.length > 0) {
            renderExamSessions(examSessionsData);
        } else {
            console.warn('⚠️ 没有可用的考试场次');
            const sessionSelectionContainer = document.querySelector('.session-selection');
            if (sessionSelectionContainer) {
                sessionSelectionContainer.innerHTML = '<p style="color: #999; padding: 20px; text-align: center;">暂无可用考试场次，请稍后再试</p>';
            }
        }
    } catch (error) {
        console.error('❌ 初始化数据加载失败:', error);
        showNotification('加载数据失败，请刷新页面重试', 'error');
    }

    // 国籍选择逻辑
    nationalitySelect.addEventListener('change', function() {
        if (this.value === 'Other') {
            otherNationalityGroup.style.display = 'block';
            otherNationalityInput.required = true;
        } else {
            otherNationalityGroup.style.display = 'none';
            otherNationalityInput.required = false;
            otherNationalityInput.value = '';
            clearError('otherNationality');
        }
    });

    // 邮箱验证逻辑
    const emailInput = document.getElementById('email');
    if (emailInput) {
        // 实时验证（输入时）
        emailInput.addEventListener('input', function() {
            const value = this.value.trim();
            if (value) {
                validateField('email');
            } else {
                clearError('email');
            }
        });
        
        // 失去焦点时验证
        emailInput.addEventListener('blur', function() {
            validateField('email');
        });
    }

    // 场次选择逻辑（使用事件委托，支持动态生成的元素）
    // 🔒 限制：只能选择1天的考试
    document.addEventListener('change', function(e) {
        if (e.target.name === 'selectedVenues') {
            const checkbox = e.target;
            const venue = checkbox.value;
            const sessionId = checkbox.dataset.sessionId;
            const isChecked = checkbox.checked;
            
            // 更新选项样式
            if (isChecked) {
                checkbox.closest('.session-option').classList.add('selected');
                selectedSessionId = sessionId;
                
                // 🔒 禁用其他所有场次（只能选1天）
                const allVenueCheckboxes = document.querySelectorAll('input[name="selectedVenues"]');
                allVenueCheckboxes.forEach(cb => {
                    if (cb !== checkbox) {
                        // 取消其他场次的选中状态
                        if (cb.checked) {
                            cb.checked = false;
                            cb.closest('.session-option').classList.remove('selected');
                            
                            // 隐藏该场次的考试选项
                            const otherVenue = cb.value;
                            const otherLocationCode = getLocationCode(otherVenue);
                            const otherVenueOptionsId = `${otherLocationCode.toLowerCase()}Options`;
                            const otherVenueOptions = document.getElementById(otherVenueOptionsId);
                            if (otherVenueOptions) {
                                otherVenueOptions.style.display = 'none';
                            }
                        }
                        
                        // 禁用其他场次
                        cb.disabled = true;
                        const sessionOption = cb.closest('.session-option');
                        if (sessionOption) {
                            sessionOption.style.opacity = '0.5';
                            sessionOption.style.cursor = 'not-allowed';
                            sessionOption.style.pointerEvents = 'none';
                        }
                    }
                });
                
                console.log('✅ 已选择场次，其他场次已禁用');
            } else {
                checkbox.closest('.session-option').classList.remove('selected');
                if (selectedSessionId === sessionId) {
                    selectedSessionId = null;
                }
                
                // 🔓 解除对其他场次的禁用
                const anyChecked = document.querySelector('input[name="selectedVenues"]:checked');
                if (!anyChecked) {
                    const allVenueCheckboxes = document.querySelectorAll('input[name="selectedVenues"]');
                    allVenueCheckboxes.forEach(cb => {
                        // 恢复场次（除非是原本就禁用的）
                        const wasOriginallyDisabled = cb.getAttribute('disabled') === 'disabled' && cb !== checkbox;
                        if (!wasOriginallyDisabled) {
                            cb.disabled = false;
                            const sessionOption = cb.closest('.session-option');
                            if (sessionOption) {
                                sessionOption.style.opacity = '1';
                                sessionOption.style.cursor = 'pointer';
                                sessionOption.style.pointerEvents = 'auto';
                            }
                        }
                    });
                    console.log('✅ 已取消选择，所有场次已恢复');
                }
            }
            
            // 找到对应的场次数据
            const sessionData = examSessionsData.find(s => s.id === sessionId);
            if (!sessionData) {
                console.error('找不到场次数据:', sessionId);
                return;
            }
            
            // 显示/隐藏对应的考试选项
            const locationCode = getLocationCode(venue);
            const venueOptionsId = `${locationCode.toLowerCase()}Options`;
            const venueOptions = document.getElementById(venueOptionsId);
            
            if (isChecked) {
                // 如果选项容器不存在，先渲染产品
                if (!venueOptions || !venueOptions.querySelector('.exam-venue-container')) {
                    renderExamProducts({ id: sessionId, location: venue, date: sessionData.date }, examProductsData);
                }
                
                const optionsContainer = document.getElementById(venueOptionsId);
                if (optionsContainer) {
                    optionsContainer.style.display = 'block';
                    setTimeout(() => {
                        optionsContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                }
            } else {
                if (venueOptions) {
                    venueOptions.style.display = 'none';
                    // 清除该考场的所有选择
                    const venueExams = document.querySelectorAll(`input[name="examSessions"][data-location="${venue}"]`);
                    venueExams.forEach(exam => {
                        exam.checked = false;
                        exam.disabled = false;
                        exam.closest('.checkbox-label').classList.remove('disabled');
                    });
                    // 清除错误提示
                    const venueError = venueOptions.querySelector('.venue-error');
                    if (venueError) {
                        venueError.remove();
                    }
                }
            }
            
            // 清除场次选择的错误提示
            clearError('selectedVenues');
            
            // 如果取消场次选择，清除专属代码
            if (!isChecked && validatedCoupon && validatedCoupon.session_id === sessionId) {
                validatedCoupon = null;
                const couponInput = document.getElementById('couponCode');
                const couponStatus = document.getElementById('couponStatus');
                if (couponInput) couponInput.value = '';
                if (couponStatus) couponStatus.innerHTML = '';
                // 重新计算费用
                updateFeeDisplay();
            }
        }
    });

    // 专属代码验证按钮事件
    const validateCouponBtn = document.getElementById('validateCouponBtn');
    const couponCodeInput = document.getElementById('couponCode');
    const couponStatus = document.getElementById('couponStatus');
    
    if (validateCouponBtn && couponCodeInput) {
        validateCouponBtn.addEventListener('click', async function() {
            const couponCode = couponCodeInput.value.trim();
            const sessionCheckbox = document.querySelector('input[name="selectedVenues"]:checked');
            
            if (!sessionCheckbox) {
                showNotification('请先选择考试场次', 'error');
                return;
            }
            
            const sessionId = sessionCheckbox.dataset.sessionId;
            
            if (!couponCode) {
                showNotification('请输入专属代码', 'error');
                return;
            }
            
            // 显示验证中状态
            validateCouponBtn.disabled = true;
            validateCouponBtn.textContent = '验证中...';
            couponStatus.innerHTML = '<span style="color: #2196F3;">正在验证...</span>';
            
            try {
                const result = await validateCouponCode(couponCode, sessionId);
                
                if (result.valid) {
                    couponStatus.innerHTML = '<span style="color: #4CAF50;">✅ 专属代码验证成功！</span>';
                    showNotification('专属代码验证成功！', 'success');
                    // 重新计算费用
                    updateFeeDisplay();
                } else {
                    couponStatus.innerHTML = `<span style="color: #f44336;">❌ ${result.message}</span>`;
                    showNotification(result.message, 'error');
                    validatedCoupon = null;
                }
            } catch (error) {
                console.error('验证专属代码时发生错误:', error);
                couponStatus.innerHTML = '<span style="color: #f44336;">❌ 验证失败，请稍后重试</span>';
                showNotification('验证失败，请稍后重试', 'error');
                validatedCoupon = null;
            } finally {
                validateCouponBtn.disabled = false;
                validateCouponBtn.textContent = '验证专属代码';
            }
        });
        
        // 专属代码输入框变化时清除验证状态
        couponCodeInput.addEventListener('input', function() {
            if (validatedCoupon) {
                validatedCoupon = null;
                couponStatus.innerHTML = '';
                updateFeeDisplay();
            }
        });
    }
    
    // 考试场次选择逻辑（使用事件委托，支持动态生成的元素）
    // 新增限制：只能选择1个等级
    document.addEventListener('change', function(e) {
        if (e.target.name === 'examSessions') {
            const checkbox = e.target;
            const level = checkbox.dataset.level;
            const location = checkbox.dataset.location;
            const isSingle = checkbox.dataset.single === 'true';
            
            if (checkbox.checked) {
                // 🔒 新增：禁用其他等级的考试（只能选1个等级）
                const allExamCheckboxes = document.querySelectorAll('input[name="examSessions"]');
                allExamCheckboxes.forEach(cb => {
                    if (cb.dataset.level !== level) {
                        cb.disabled = true;
                        cb.checked = false;
                        cb.closest('.checkbox-label').classList.add('disabled');
                        cb.closest('.checkbox-label').style.opacity = '0.5';
                    }
                });
                
                if (!isSingle) {
                    // 如果选择了全科，禁用同级别同地点的单科
                    const singleModules = document.querySelectorAll(`input[name="examSessions"][data-level="${level}"][data-location="${location}"][data-single="true"]`);
                    singleModules.forEach(module => {
                        module.disabled = true;
                        module.checked = false;
                        module.closest('.checkbox-label').classList.add('disabled');
                    });
                } else {
                    // 如果选择了单科，检查是否需要禁用全科
                    const allSingleModules = document.querySelectorAll(`input[name="examSessions"][data-level="${level}"][data-location="${location}"][data-single="true"]`);
                    const checkedSingleModules = Array.from(allSingleModules).filter(module => module.checked);
                    
                    if (checkedSingleModules.length === allSingleModules.length) {
                        // 如果所有单科都被选中，禁用全科
                        const fullExam = document.querySelector(`input[name="examSessions"][data-level="${level}"][data-location="${location}"]:not([data-single])`);
                        if (fullExam) {
                            fullExam.disabled = true;
                            fullExam.closest('.checkbox-label').classList.add('disabled');
                        }
                    }
                }
            } else {
                // 检查是否还有该等级的其他科目被选中
                const sameLevelChecked = document.querySelector(`input[name="examSessions"][data-level="${level}"]:checked`);
                
                if (!sameLevelChecked) {
                    // 🔓 如果该等级没有任何科目被选中，解除对其他等级的禁用
                    const allExamCheckboxes = document.querySelectorAll('input[name="examSessions"]');
                    allExamCheckboxes.forEach(cb => {
                        cb.disabled = false;
                        cb.closest('.checkbox-label').classList.remove('disabled');
                        cb.closest('.checkbox-label').style.opacity = '1';
                    });
                }
                
                if (!isSingle) {
                    // 如果取消选择全科，启用同级别同地点的单科
                    const singleModules = document.querySelectorAll(`input[name="examSessions"][data-level="${level}"][data-location="${location}"][data-single="true"]`);
                    singleModules.forEach(module => {
                        if (!sameLevelChecked) {
                            module.disabled = false;
                        }
                        module.closest('.checkbox-label').classList.remove('disabled');
                    });
                } else {
                    // 如果取消选择单科，启用全科
                    const fullExam = document.querySelector(`input[name="examSessions"][data-level="${level}"][data-location="${location}"]:not([data-single])`);
                    if (fullExam && !sameLevelChecked) {
                        fullExam.disabled = false;
                        fullExam.closest('.checkbox-label').classList.remove('disabled');
                    }
                }
            }
            
            // 清除当前场次的错误提示
            const locationCode = getLocationCode(location);
            const currentVenueOptionsId = `${locationCode.toLowerCase()}Options`;
            const currentVenueOptions = document.getElementById(currentVenueOptionsId);
            if (currentVenueOptions) {
                const venueError = currentVenueOptions.querySelector('.venue-error');
                if (venueError) {
                    venueError.remove();
                }
            }
            
            // 更新费用显示
            updateFeeDisplay();
        }
    });

    // 文件上传处理
    function setupFileUpload(fileInputId, fileInfoId, maxSize = 10 * 1024 * 1024, allowedTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'application/pdf']) {
        const fileInput = document.getElementById(fileInputId);
        const fileInfo = document.getElementById(fileInfoId);
        
        if (!fileInput || !fileInfo) return;

        fileInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const fileSize = file.size;
                const fileType = file.type;
                
                fileInfo.classList.remove('error', 'success');
                
                if (fileSize > maxSize) {
                    fileInfo.textContent = `文件大小超过 ${Math.round(maxSize / (1024 * 1024))}MB 限制`;
                    fileInfo.classList.add('error');
                    this.value = '';
                } else if (!allowedTypes.includes(fileType)) {
                    fileInfo.textContent = '请上传支持的文件格式';
                    fileInfo.classList.add('error');
                    this.value = '';
                } else {
                    fileInfo.textContent = `已选择文件: ${file.name} (${Math.round(fileSize / 1024)}KB)`;
                    fileInfo.classList.add('success');
                }
                
                fileInfo.classList.add('show');
            } else {
                fileInfo.classList.remove('show');
            }
        });
    }

    // 设置文件上传
    setupFileUpload('passportUpload', 'passportFileInfo', 10 * 1024 * 1024, ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']); // 提高护照上传限制

    // 清除错误提示
    function clearError(fieldId) {
        const errorHint = document.getElementById(fieldId + '-error');
        if (errorHint) {
            errorHint.textContent = '';
        }
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.remove('invalid', 'valid');
        }
    }

    // 显示错误提示
    function showError(fieldId, message) {
        const errorHint = document.getElementById(fieldId + '-error');
        if (errorHint) {
            errorHint.textContent = message;
        }
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.add('invalid');
            field.classList.remove('valid');
        }
    }

    // 显示成功状态
    function showSuccess(fieldId) {
        const errorHint = document.getElementById(fieldId + '-error');
        if (errorHint) {
            errorHint.textContent = '';
        }
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.add('valid');
            field.classList.remove('invalid');
        }
    }

    // 费用计算函数（从数据库读取价格，支持专属代码）
    function calculateTotalFee(examSessions) {
        // 输入验证
        if (!examSessions || !Array.isArray(examSessions)) {
            return {
                totalFee: 0,
                details: []
            };
        }
        
        if (examProductsData.length === 0) {
            console.warn('⚠️ 产品数据未加载，使用默认价格');
            return {
                totalFee: 0,
                details: []
            };
        }
        
        // 🆕 检查是否选择了某个等级的所有单科，如果是则按全科计算
        const processedSessions = checkAndConvertToFullCourse(examSessions);
        
        let totalFee = 0;
        const feeDetails = [];
        const useCoupon = validatedCoupon !== null;
        
        processedSessions.forEach(sessionCode => {
            // 从数据库查找对应的产品
            const product = examProductsData.find(p => p.code === sessionCode);
            
            if (!product) {
                console.warn(`⚠️ 找不到产品: ${sessionCode}`);
                return;
            }
            
            // 确定使用原价还是折后价
            // 只有全科考试且已输入有效专属代码时才使用折后价
            let fee = product.price_original; // 默认使用原价（单位：分）
            let isDiscounted = false;
            
            if (useCoupon && product.module_type === 'Full' && product.price_discounted !== null) {
                fee = product.price_discounted;
                isDiscounted = true;
            }
            
            // 转换为元（除以100）
            const feeInYuan = fee / 100;
            totalFee += feeInYuan;
            
            feeDetails.push({
                session: sessionCode,
                fee: feeInYuan,
                description: product.name,
                originalFee: product.price_original / 100,
                discountedFee: product.price_discounted ? product.price_discounted / 100 : null,
                isDiscounted: isDiscounted
            });
        });
        
        return {
            totalFee: totalFee,
            details: feeDetails
        };
    }
    
    // 🆕 检查并转换单科组合为全科
    // 如果选择了某个等级的所有单科，自动转换为该等级的全科
    function checkAndConvertToFullCourse(examSessions) {
        // 解析选中的科目，按等级和地点分组
        const levelMap = {};
        
        examSessions.forEach(code => {
            const product = examProductsData.find(p => p.code === code);
            if (!product) return;
            
            const key = `${product.level}_${product.location}`;
            if (!levelMap[key]) {
                levelMap[key] = {
                    level: product.level,
                    location: product.location,
                    modules: [],
                    codes: []
                };
            }
            
            levelMap[key].modules.push(product.module_type);
            levelMap[key].codes.push(code);
        });
        
        // 检查每个等级是否选择了所有单科
        const result = [];
        
        Object.keys(levelMap).forEach(key => {
            const group = levelMap[key];
            const { level, location, modules, codes } = group;
            
            // 如果已经包含全科，直接使用
            if (modules.includes('Full')) {
                const fullCode = codes.find(c => c.includes('_Full'));
                if (fullCode) {
                    result.push(fullCode);
                }
                return;
            }
            
            // 检查是否选择了所有单科
            let allModulesSelected = false;
            
            if (level === 'A1' || level === 'A2') {
                // A1 和 A2 需要选择 Written 和 Oral
                allModulesSelected = modules.includes('Written') && modules.includes('Oral');
            } else if (level === 'B1') {
                // B1 需要选择 Listening、Reading、Oral 和 Written
                allModulesSelected = 
                    modules.includes('Listening') && 
                    modules.includes('Reading') && 
                    modules.includes('Oral') && 
                    modules.includes('Written');
            }
            
            if (allModulesSelected) {
                // 查找对应的全科产品代码
                const fullCourseCode = `${level}_${location}_Full`;
                const fullProduct = examProductsData.find(p => p.code === fullCourseCode);
                
                if (fullProduct) {
                    console.log(`✅ 检测到${level}等级所有单科已选中，自动转换为全科计算`);
                    result.push(fullCourseCode);
                } else {
                    // 如果找不到全科产品，保留单科
                    result.push(...codes);
                }
            } else {
                // 如果不是所有单科，保留原样
                result.push(...codes);
            }
        });
        
        return result;
    }
    
    // 更新费用显示
    function updateFeeDisplay() {
        const checkedSessions = Array.from(document.querySelectorAll('input[name="examSessions"]:checked'))
            .map(cb => cb.value);
        
        if (checkedSessions.length === 0) {
            return;
        }
        
        const calculation = calculateTotalFee(checkedSessions);
        console.log('💰 费用计算:', calculation);
        
        // 这里可以添加费用显示逻辑，如果有费用显示区域的话
        // 例如：document.getElementById('totalFeeDisplay').textContent = `¥${calculation.totalFee}`;
    }

    // 生成唯一的申请ID
    function generateApplicationID() {
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        
        // 生成3位随机数
        const randomNum = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
        
        return `OSD${randomNum}`;
    }

    // 将考试选项代码转换为中文名称（从数据库读取）
    function convertExamSessionsToChinese(examSessions) {
        if (!examSessions || !Array.isArray(examSessions)) {
            return '未选择考试科目';
        }
        
        return examSessions.map(sessionCode => {
            const product = examProductsData.find(p => p.code === sessionCode);
            return product ? product.name : sessionCode;
        }).join('、');
    }

    // 生成费用明细HTML用于邮件内容（支持显示折扣信息）
    function generateFeeDetailsHtml(feeCalculation) {
        // 输入验证
        if (!feeCalculation || !feeCalculation.details || !Array.isArray(feeCalculation.details)) {
            return '<div>暂无费用信息</div>';
        }
        
        if (feeCalculation.details.length === 0) {
            return '<div>未选择考试科目</div>';
        }
        
        // 生成费用明细HTML（显示折扣信息）
        const feeItemsHtml = feeCalculation.details.map(detail => {
            // 转义特殊字符，确保JSON安全
            const safeDescription = detail.description.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            
            // 如果有折扣，显示原价和折后价
            if (detail.isDiscounted && detail.originalFee !== detail.fee) {
                return `<div style="display: flex; justify-content: space-between; margin: 5px 0;">
                    <span>${safeDescription}</span>
                    <span>
                        <span style="text-decoration: line-through; color: #999; margin-right: 8px;">¥${detail.originalFee}</span>
                        <strong style="color: #4CAF50;">¥${detail.fee}</strong>
                    </span>
                </div>`;
            } else {
                return `<div style="display: flex; justify-content: space-between; margin: 5px 0;">
                    <span>${safeDescription}</span>
                    <span><strong>¥${detail.fee}</strong></span>
                </div>`;
            }
        }).join('');
        
        // 简化的费用明细HTML（避免复杂嵌套和特殊字符）
        const simpleHtml = `<div>
            <h3>报名费用明细</h3>
            ${feeItemsHtml}
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 15px 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 18px; font-weight: bold;">
                <span>应付总额:</span>
                <span style="color: #D9534F;">¥${feeCalculation.totalFee}</span>
            </div>
            <p>请按照邮件指南完成缴费并上传付费凭证</p>
        </div>`;
        
        return simpleHtml.trim();
    }

    // 生成银行转账信息HTML用于邮件内容
    function generateBankTransferHtml(applicationID, totalFee) {
        // 银行转账信息
        const bankInfo = {
            accountName: '成都学德教育科技有限公司',
            accountNumber: '161430801',
            bankName: '中国民生银行股份有限公司成都永丰支行',
            reference: applicationID
        };
        
        // 生成简化版银行转账信息HTML
        const bankTransferHtml = `<div>
            <h3>银行转账信息</h3>
            <div><strong>账户名称：</strong>${bankInfo.accountName}</div>
            <div><strong>账户号码：</strong>${bankInfo.accountNumber}</div>
            <div><strong>收款银行：</strong>${bankInfo.bankName}</div>
        </div>`;
        
        return bankTransferHtml.trim();
    }

    // 图片压缩函数
    // 统一文件转换和压缩函数：所有文件转为JPG格式并压缩到目标大小以下
    function convertToJpgAndCompress(file, targetSize = 1024 * 1024) {
        return new Promise((resolve, reject) => {
            console.log(`🔄 开始转换文件为JPG: ${file.name}, 目标大小: ${Math.round(targetSize/1024)}KB`);
            
            // 检测设备类型
            const isMobile = navigator.userAgent.includes('Mobile');
            
            // 设置超时机制
            const timeoutId = setTimeout(() => {
                reject(new Error('文件处理超时'));
            }, 60000); // 60秒超时
            
            // PDF文件处理
            if (file.type === 'application/pdf') {
                console.log('📄 检测到PDF文件，转换为JPG图片...');
                convertPdfToJpg(file, targetSize, isMobile)
                    .then(jpgFile => {
                        clearTimeout(timeoutId);
                        resolve(jpgFile);
                    })
                    .catch(error => {
                        clearTimeout(timeoutId);
                        console.error('❌ PDF转换失败:', error);
                        reject(new Error(`PDF文件处理失败: ${error.message}`));
                    });
                return;
            }
            
            // 图片文件处理
            if (file.type.startsWith('image/')) {
                console.log('🖼️ 检测到图片文件，转换为JPG格式...');
                convertImageToJpg(file, targetSize, isMobile)
                    .then(jpgFile => {
                        clearTimeout(timeoutId);
                        resolve(jpgFile);
                    })
                    .catch(error => {
                        clearTimeout(timeoutId);
                        console.error('❌ 图片转换失败:', error);
                        reject(new Error(`图片处理失败: ${error.message}`));
                    });
                return;
            }
            
            // 不支持的格式
            clearTimeout(timeoutId);
            reject(new Error('不支持的文件格式'));
        });
    }
    
    // PDF转JPG函数
    function convertPdfToJpg(file, targetSize, isMobile) {
        return new Promise((resolve, reject) => {
            console.log('📖 开始读取PDF文件...');
            
            const fileReader = new FileReader();
            fileReader.onload = function(e) {
                const pdfData = new Uint8Array(e.target.result);
                
                // 检查是否支持PDF处理
                if (typeof pdfjsLib === 'undefined') {
                    console.warn('⚠️ PDF.js未加载，尝试替代方案...');
                    // 替代方案：提示用户转换为图片格式
                    reject(new Error('PDF处理库未加载，请将PDF转换为图片格式后再上传'));
                    return;
                }
                
                // 使用PDF.js处理PDF
                pdfjsLib.getDocument({data: pdfData}).promise.then(pdf => {
                    console.log(`📑 PDF加载成功，共${pdf.numPages}页，将转换第一页为JPG`);
                    
                    pdf.getPage(1).then(page => {
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        
                        // 计算合适的尺寸
                        const viewport = page.getViewport({scale: isMobile ? 1.0 : 1.5});
                        canvas.width = viewport.width;
                        canvas.height = viewport.height;
                        
                        page.render({canvasContext: context, viewport: viewport}).promise.then(() => {
                            console.log('🖼️ PDF页面渲染完成，开始转换为JPG...');
                            
                            // 转换为JPG并压缩
                            compressCanvasToJpg(canvas, targetSize, file.name.replace('.pdf', '.jpg'))
                                .then(jpgFile => {
                                    console.log(`✅ PDF转JPG成功: ${Math.round(jpgFile.size/1024)}KB`);
                                    resolve(jpgFile);
                                })
                                .catch(error => {
                                    console.error('❌ PDF转JPG压缩失败:', error);
                                    reject(error);
                                });
                        }).catch(error => {
                            console.error('❌ PDF页面渲染失败:', error);
                            reject(new Error('PDF页面渲染失败'));
                        });
                    }).catch(error => {
                        console.error('❌ PDF页面获取失败:', error);
                        reject(new Error('PDF页面获取失败'));
                    });
                }).catch(error => {
                    console.error('❌ PDF文档解析失败:', error);
                    reject(new Error('PDF文档解析失败，可能文件已损坏'));
                });
            };
            
            fileReader.onerror = () => {
                console.error('❌ PDF文件读取失败');
                reject(new Error('PDF文件读取失败'));
            };
            
            fileReader.readAsArrayBuffer(file);
        });
    }
    
    // 图片转JPG函数
    function convertImageToJpg(file, targetSize, isMobile) {
        return new Promise((resolve, reject) => {
            console.log(`🖼️ 开始转换图片为JPG: ${file.type}`);
            
            const img = new Image();
            const objectURL = URL.createObjectURL(file);
            
            img.onload = function() {
                try {
                    // 释放URL对象
                    URL.revokeObjectURL(objectURL);
                    
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // 计算合适的尺寸（保持宽高比）
                    let { width, height } = img;
                    const maxDimension = isMobile ? 1200 : 1920;
                    
                    if (width > maxDimension || height > maxDimension) {
                        const ratio = Math.min(maxDimension / width, maxDimension / height);
                        width = Math.floor(width * ratio);
                        height = Math.floor(height * ratio);
                    }
                    
                    console.log(`📐 图片尺寸: ${img.width}x${img.height} → ${width}x${height}`);
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    // 设置高质量渲染
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    
                    // 如果是PNG转JPG，先填充白色背景
                    if (file.type === 'image/png') {
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, width, height);
                    }
                    
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // 压缩为JPG
                    const newFileName = file.name.replace(/\.(png|jpeg|jpg)$/i, '.jpg');
                    compressCanvasToJpg(canvas, targetSize, newFileName)
                        .then(jpgFile => {
                            console.log(`✅ 图片转JPG成功: ${Math.round(jpgFile.size/1024)}KB`);
                            resolve(jpgFile);
                        })
                        .catch(error => {
                            console.error('❌ 图片转JPG压缩失败:', error);
                            reject(error);
                        });
                } catch (error) {
                    URL.revokeObjectURL(objectURL);
                    console.error('❌ 图片处理过程中发生错误:', error);
                    reject(new Error(`图片处理失败: ${error.message}`));
                }
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(objectURL);
                console.error('❌ 图片加载失败');
                reject(new Error('图片加载失败，请检查文件格式是否正确'));
            };
            
            img.src = objectURL;
        });
    }
    
    // Canvas压缩为JPG的通用函数
    function compressCanvasToJpg(canvas, targetSize, fileName) {
        return new Promise((resolve, reject) => {
            console.log(`🗜️ 开始压缩Canvas为JPG，目标大小: ${Math.round(targetSize/1024)}KB`);
            
            let quality = 0.8;
            let attempt = 0;
            const maxAttempts = 10;
            
            function tryCompress() {
                attempt++;
                console.log(`🔄 第${attempt}次压缩尝试，质量: ${(quality * 100).toFixed(0)}%`);
                
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('压缩失败：无法生成JPG文件'));
                            return;
                        }
                        
                        console.log(`📊 压缩结果: ${Math.round(blob.size/1024)}KB`);
                        
                        if (blob.size <= targetSize || attempt >= maxAttempts) {
                            // 创建File对象
                            const jpgFile = new File([blob], fileName, {
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            });
                            
                            if (blob.size <= targetSize) {
                                console.log(`✅ 压缩成功: ${Math.round(blob.size/1024)}KB (质量: ${(quality * 100).toFixed(0)}%)`);
                            } else {
                                console.log(`⚠️ 达到最大尝试次数，当前大小: ${Math.round(blob.size/1024)}KB`);
                            }
                            
                            resolve(jpgFile);
                        } else {
                            // 调整质量继续压缩
                            quality = Math.max(0.1, quality - 0.1);
                            setTimeout(tryCompress, 100); // 稍微延迟避免阻塞
                        }
                    },
                    'image/jpeg',
                    quality
                );
            }
            
            tryCompress();
        });
    }

    function compressImage(file, quality = 0.8, maxWidth = 1920, maxHeight = 1080) {
        return new Promise((resolve, reject) => {
            console.log(`🎨 开始压缩图片: ${file.name}, 目标尺寸: ${maxWidth}x${maxHeight}, 质量: ${quality}`);
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            // 设置超时机制，防止移动端卡住
            const timeoutId = setTimeout(() => {
                reject(new Error('图片压缩超时'));
            }, 30000); // 30秒超时
            
            img.onload = function() {
                try {
                    clearTimeout(timeoutId);
                    
                    // 计算新的尺寸
                    let { width, height } = img;
                    console.log(`📐 原始尺寸: ${width}x${height}`);
                    
                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(maxWidth / width, maxHeight / height);
                        width = Math.floor(width * ratio);
                        height = Math.floor(height * ratio);
                        console.log(`📏 缩放后尺寸: ${width}x${height}, 缩放比例: ${ratio.toFixed(2)}`);
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    // 移动端优化：使用更好的图片质量设置
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    
                    // 绘制和压缩图片
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // 移动端容错处理
                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                console.log(`✅ 图片压缩成功: ${Math.round(file.size/1024)}KB → ${Math.round(blob.size/1024)}KB`);
                                
                                // 创建新的File对象
                                const compressedFile = new File([blob], file.name, {
                                    type: file.type,
                                    lastModified: Date.now()
                                });
                                resolve(compressedFile);
                            } else {
                                console.error('❌ Canvas.toBlob 返回空结果');
                                reject(new Error('图片压缩失败：无法生成压缩后的图片'));
                            }
                        },
                        file.type,
                        quality
                    );
                } catch (error) {
                    clearTimeout(timeoutId);
                    console.error('❌ 图片压缩过程中发生错误:', error);
                    reject(new Error(`图片压缩失败：${error.message}`));
                }
            };
            
            img.onerror = (error) => {
                clearTimeout(timeoutId);
                console.error('❌ 图片加载失败:', error);
                reject(new Error('图片加载失败，请检查文件格式是否正确'));
            };
            
            // 释放之前的URL对象
            const objectURL = URL.createObjectURL(file);
            
            // 保存原始的onload处理函数
            const originalOnload = img.onload;
            
            img.onload = function() {
                // 先执行原始的onload处理
                originalOnload.call(this);
                // 然后释放URL对象
                URL.revokeObjectURL(objectURL);
            };
            
            img.src = objectURL;
        });
    }

    // 根据考试场次生成考试日期字符串（从数据库读取）
    function generateExamDateString(examSessions) {
        if (!examSessions || examSessions.length === 0) {
            return '待定';
        }
        
        // 从选中的场次checkbox获取日期信息
        const selectedVenueCheckboxes = document.querySelectorAll('input[name="selectedVenues"]:checked');
        const dates = [];
        
        selectedVenueCheckboxes.forEach(checkbox => {
            const sessionId = checkbox.dataset.sessionId;
            const sessionData = examSessionsData.find(s => s.id === sessionId);
            
            if (sessionData) {
                const dateStr = sessionData.date;
                const location = getLocationName(sessionData.location);
                dates.push(`${dateStr} (${location})`);
            }
        });
        
        return dates.length > 0 ? dates.join('； ') : '待定';
    }

    // 显示费用明细
    function displayFeeCalculation(examSessions) {
        const calculation = calculateTotalFee(examSessions);
        
        // 更新总费用显示
        const totalAmountElement = document.getElementById('totalAmountValue');
        if (totalAmountElement) {
            totalAmountElement.textContent = calculation.totalFee.toLocaleString();
        }
        
        // 创建费用明细显示
        const feeDetailsContainer = document.createElement('div');
        feeDetailsContainer.className = 'fee-details';
        feeDetailsContainer.innerHTML = `
            <h4>报名考试费用明细</h4>
            <div class="fee-breakdown">
                ${calculation.details.map(detail => `
                    <div class="fee-item">
                        <span class="fee-description">${detail.description}</span>
                        <span class="fee-amount">¥${detail.fee}</span>
                    </div>
                `).join('')}
                <div class="fee-total">
                    <span class="fee-description"><strong>总计</strong></span>
                    <span class="fee-amount"><strong>¥${calculation.totalFee.toLocaleString()}</strong></span>
                </div>
            </div>
        `;
        
        // 将费用明细插入到费用信息区域
        const feeInfoDiv = document.querySelector('.fee-info');
        if (feeInfoDiv) {
            // 移除之前的费用明细（如果有）
            const existingDetails = feeInfoDiv.querySelector('.fee-details');
            if (existingDetails) {
                existingDetails.remove();
            }
            feeInfoDiv.appendChild(feeDetailsContainer);
        }
    }
    
    // 🆕 更新报名截止日期提醒
    function updateDeadlineReminder() {
        const deadlineReminderElement = document.getElementById('deadlineReminder');
        if (!deadlineReminderElement) return;
        
        // 获取选中的场次
        const selectedVenueCheckbox = document.querySelector('input[name="selectedVenues"]:checked');
        if (!selectedVenueCheckbox) return;
        
        const deadline = selectedVenueCheckbox.dataset.deadline;
        if (deadline) {
            const deadlineDate = new Date(deadline);
            const year = deadlineDate.getFullYear();
            const month = String(deadlineDate.getMonth() + 1).padStart(2, '0');
            const day = String(deadlineDate.getDate()).padStart(2, '0');
            const deadlineDisplay = `${year}年${month}月${day}日`;
            
            deadlineReminderElement.innerHTML = `<strong>确定时限：</strong>请务必在${deadlineDisplay}前完成所有确认步骤`;
        }
    }

                // 验证邮箱格式
    function validateEmail(email) {
        // 基本邮箱格式验证
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            return { isValid: false, message: '请输入有效的邮箱地址格式' };
        }
        
        return { isValid: true, message: '' };
    }

    // 验证电话号码格式
    function validatePhoneNumber(phone) {
        const phonePattern = /^(\d{8}|\d{11})$/;
        return phonePattern.test(phone.replace(/\D/g, ''));
    }

    // 验证单个字段
    function validateField(fieldId, customValidator = null) {
        const field = document.getElementById(fieldId);
        if (!field) return true;

        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // 检查必填字段
        if (field.required && !value) {
            isValid = false;
            errorMessage = '此字段为必填项';
        } else if (value) {
            // 特殊验证逻辑
            switch (fieldId) {
                case 'email':
                    const emailValidation = validateEmail(value);
                    if (!emailValidation.isValid) {
                        isValid = false;
                        errorMessage = emailValidation.message;
                    }
                    break;
                case 'phoneNumber':
                    if (!validatePhoneNumber(value)) {
                        isValid = false;
                        errorMessage = '请输入有效的电话号码（8位座机号或11位手机号）';
                    }
                    break;
                case 'firstName':
                case 'lastName':
                    if (!/^[a-zA-Z\s]+$/.test(value)) {
                        isValid = false;
                        errorMessage = '请输入有效的拼音格式（仅英文字母和空格）';
                    }
                    break;
                case 'birthPlace':
                    if (!/^[a-zA-Z\s]+$/.test(value)) {
                        isValid = false;
                        errorMessage = '请输入有效的拼音格式（仅英文字母和空格）';
                    }
                    break;
                case 'otherNationality':
                    if (nationalitySelect.value === 'Other' && (!value || !/^[a-zA-Z\s]+$/.test(value))) {
                        isValid = false;
                        errorMessage = '请输入有效的国籍名称（英文）';
                    }
                    break;
            }
        }

        // 应用自定义验证器
        if (customValidator && isValid) {
            const customResult = customValidator(value);
            if (!customResult.isValid) {
                isValid = false;
                errorMessage = customResult.message;
            }
        }

        // 显示验证结果
        if (isValid) {
            showSuccess(fieldId);
        } else {
            showError(fieldId, errorMessage);
        }

        return isValid;
    }

    // 滚动到错误字段的函数
    function scrollToErrorField(element) {
        if (!element) return;
        
        console.log('🎯 开始滚动到错误字段:', element.tagName, element.id || element.className);
        
        // 检测设备类型
        const isMobile = window.innerWidth <= 768;
        const offset = isMobile ? 100 : 120;
        
        // 计算滚动位置
        const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
        const targetPosition = elementTop - offset;
        
        console.log(`📱 设备类型: ${isMobile ? '移动端' : 'PC端'}, 偏移量: ${offset}px`);
        console.log(`📍 元素位置: ${elementTop}px, 目标位置: ${targetPosition}px`);
        
        // 平滑滚动到目标位置
        window.scrollTo({
            top: Math.max(0, targetPosition),
            behavior: 'smooth'
        });
        
        // 延迟聚焦，让滚动完成
        setTimeout(() => {
            if (element.focus && typeof element.focus === 'function') {
                try {
                    element.focus();
                    console.log('✅ 成功聚焦到错误字段');
                } catch (error) {
                    console.log('⚠️ 聚焦失败:', error.message);
                }
            }
        }, isMobile ? 800 : 600);
    }

    // 验证整个表单
    function validateForm() {
        let isValid = true;
        let firstErrorElement = null;

        console.log('🔍 开始表单验证...');

        // 验证所有必填字段
        const requiredFields = ['firstName', 'lastName', 'gender', 'birthDate', 'nationality', 'birthPlace', 'email', 'phoneNumber', 'firstTimeExam'];

        requiredFields.forEach(fieldId => {
            if (!validateField(fieldId)) {
                isValid = false;
                const errorField = document.getElementById(fieldId);
                if (errorField && !firstErrorElement) {
                    firstErrorElement = errorField.closest('.form-group') || errorField;
                    console.log(`❌ 第一个错误字段: ${fieldId}, 滚动目标:`, firstErrorElement);
                }
            }
        });

        // 验证其他国籍字段
        if (nationalitySelect.value === 'Other') {
            if (!validateField('otherNationality')) {
                isValid = false;
                if (!firstErrorElement) {
                    const errorField = document.getElementById('otherNationality');
                    firstErrorElement = errorField.closest('.form-group') || errorField;
                    console.log('❌ 第一个错误字段: otherNationality');
                }
            }
        }

        // 验证场次选择
        const checkedVenues = document.querySelectorAll('input[name="selectedVenues"]:checked');
        if (checkedVenues.length === 0) {
            isValid = false;
            showError('selectedVenues', '请至少选择一个考试场次');
            if (!firstErrorElement) {
                firstErrorElement = document.getElementById('venueSelection');
                console.log('❌ 第一个错误字段: selectedVenues');
            }
        } else {
            clearError('selectedVenues');
            
            // 先清除所有场次选项的错误提示
            const venueErrors = document.querySelectorAll('.venue-error');
            venueErrors.forEach(error => error.remove());
            
            // 验证每个选中的场次都必须有对应的考试选项，并检查is_active状态
            checkedVenues.forEach(venueCheckbox => {
                const venueValue = venueCheckbox.value;
                const sessionId = venueCheckbox.dataset.sessionId;
                
                // 检查场次是否激活
                const sessionData = examSessionsData.find(s => s.id === sessionId);
                if (sessionData && sessionData.is_active === false) {
                    isValid = false;
                    showError('selectedVenues', '所选场次报名已截止');
                    if (!firstErrorElement) {
                        firstErrorElement = venueCheckbox.closest('.session-option');
                    }
                    return;
                }
                
                // 找到对应的选项容器（动态生成的ID）
                const locationCode = getLocationCode(venueValue);
                const venueOptionsId = `${locationCode.toLowerCase()}Options`;
                const venueOptions = document.getElementById(venueOptionsId);
                
                if (venueOptions && venueOptions.style.display !== 'none') {
                    // 检查该场次是否有选中的考试选项
                    const venueExamSessions = document.querySelectorAll(`input[name="examSessions"][data-location="${venueValue}"]:checked`);
                    
                    if (venueExamSessions.length === 0) {
                        isValid = false;
                        console.log(`❌ 场次选择错误: ${venueValue}考场未选择考试科目`);
                        
                        // 在场次选项区域添加错误提示
                        const errorDiv = venueOptions.querySelector('.venue-error');
                        if (!errorDiv) {
                            const newErrorDiv = document.createElement('div');
                            newErrorDiv.className = 'venue-error error-hint';
                            newErrorDiv.textContent = `请选择${venueValue}考场的考试等级和模块`;
                            newErrorDiv.style.color = '#e74c3c';
                            newErrorDiv.style.marginTop = '10px';
                            newErrorDiv.style.padding = '8px';
                            newErrorDiv.style.backgroundColor = '#fdf2f2';
                            newErrorDiv.style.borderRadius = '4px';
                            newErrorDiv.style.fontSize = '14px';
                            venueOptions.appendChild(newErrorDiv);
                        }
                        
                        // 设置第一个错误元素为场次选项区域的标题
                        if (!firstErrorElement) {
                            // 查找场次选项区域的标题（label元素）
                            const venueTitle = venueOptions.querySelector('label');
                            if (venueTitle) {
                                firstErrorElement = venueTitle;
                                console.log(`❌ 第一个错误字段: ${venueValue}考场标题`);
                            } else {
                                // 如果找不到标题，使用整个场次选项区域
                                firstErrorElement = venueOptions;
                                console.log(`❌ 第一个错误字段: ${venueValue}考场选项区域`);
                            }
                        }
                    }
                }
            });
        }

        // 验证护照文件上传（可选）
        const passportFile = document.getElementById('passportUpload');
        if (passportFile.files.length > 0) {
            const file = passportFile.files[0];
            const maxSize = 5 * 1024 * 1024; // 5MB
            const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
            
            if (file.size > maxSize) {
                isValid = false;
                showError('passportUpload', '护照文件大小不能超过5MB');
                if (!firstErrorElement) {
                    const errorField = document.getElementById('passportUpload');
                    firstErrorElement = errorField.closest('.form-group') || errorField;
                    console.log('❌ 第一个错误字段: passportUpload (文件过大)');
                }
            } else if (!allowedTypes.includes(file.type)) {
                isValid = false;
                showError('passportUpload', '护照文件请上传jpg、png或pdf格式');
                if (!firstErrorElement) {
                    const errorField = document.getElementById('passportUpload');
                    firstErrorElement = errorField.closest('.form-group') || errorField;
                    console.log('❌ 第一个错误字段: passportUpload (格式错误)');
                }
            }
        }

        // 如果有错误，滚动到第一个错误字段
        if (!isValid && firstErrorElement) {
            console.log('🎯 验证失败，滚动到第一个错误字段');
            scrollToErrorField(firstErrorElement);
        } else if (isValid) {
            console.log('✅ 表单验证通过');
        }

        return isValid;
    }

    // 实时验证
    const formInputs = form.querySelectorAll('input, select');
    formInputs.forEach(input => {
        // 失去焦点时验证
        input.addEventListener('blur', function() {
            if (this.id) {
                validateField(this.id);
            }
        });

        // 输入时清除错误状态
        input.addEventListener('input', function() {
            if (this.id) {
                clearError(this.id);
            }
        });
    });

    // 表单提交
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 移除之前的错误消息
        const existingErrors = document.querySelectorAll('.error-message');
        existingErrors.forEach(error => error.remove());
        
        if (!validateForm()) {
            // 验证失败，validateForm函数已经处理了滚动到错误字段
            return;
        }

        // 显示加载状态
        submitBtn.classList.add('loading');
        submitBtn.textContent = '正在提交...';

        // 收集表单数据
        const formData = new FormData(form);
        
        // 处理考试场次数据
        const checkedSessions = Array.from(document.querySelectorAll('input[name="examSessions"]:checked'))
            .map(cb => cb.value);
        
        // 处理国籍数据
        const finalNationality = nationalitySelect.value === 'Other' ? otherNationalityInput.value : nationalitySelect.value;

        // 生成唯一的申请ID
        const applicationID = generateApplicationID();

        // 计算费用信息
        const feeCalculation = calculateTotalFee(checkedSessions);
        
        // 生成考试科目中文显示名称
        const examSessionsDisplay = convertExamSessionsToChinese(checkedSessions);
        
        // 生成格式化时间戳
        const originalSubmissionTimeFormatted = getBeijingTimeString();
        
        // 生成费用明细HTML用于邮件
        const feeDetailsHtml = generateFeeDetailsHtml(feeCalculation);
        
        // 生成银行转账信息HTML用于邮件
        const bankTransferHtml = generateBankTransferHtml(applicationID, feeCalculation.totalFee);

        // 计算截止日期（当天日期+7天）
        const deadlineDate = new Date();
        deadlineDate.setDate(deadlineDate.getDate() + 7);
        const deadlineDateString = deadlineDate.toISOString().split('T')[0]; // 格式: YYYY-MM-DD

        // 获取专属代码信息
        const couponCode = document.getElementById('couponCode')?.value.trim() || '';
        const couponUsed = validatedCoupon ? validatedCoupon.code : null;

        // 从选中的场次中提取报名截止日期 (is_active_until)
        const selectedVenueCheckboxes = document.querySelectorAll('input[name="selectedVenues"]:checked');
        let registrationDeadline = null;
        let registrationDeadlineFormatted = null;
        
        console.log('🔍 调试：选中的场次数量:', selectedVenueCheckboxes.length);
        
        if (selectedVenueCheckboxes.length > 0) {
            // 获取第一个选中场次的截止日期（通常所有场次应该有相同的截止日期）
            const firstCheckbox = selectedVenueCheckboxes[0];
            const deadlineStr = firstCheckbox.dataset.deadline;
            
            console.log('🔍 调试：第一个场次的 data-deadline:', deadlineStr);
            console.log('🔍 调试：第一个场次的所有 dataset:', firstCheckbox.dataset);
            
            if (deadlineStr && deadlineStr.trim() !== '') {
                registrationDeadline = deadlineStr; // ISO格式: YYYY-MM-DD
                // 格式化为邮件显示格式: YYYY年MM月DD日
                const deadlineDateObj = new Date(deadlineStr);
                const year = deadlineDateObj.getFullYear();
                const month = String(deadlineDateObj.getMonth() + 1).padStart(2, '0');
                const day = String(deadlineDateObj.getDate()).padStart(2, '0');
                registrationDeadlineFormatted = `${year}年${month}月${day}日`;
                
                console.log('✅ 成功提取报名截止日期:', {
                    registrationDeadline,
                    registrationDeadlineFormatted
                });
            } else {
                console.warn('⚠️ 警告：场次的 data-deadline 为空！');
            }
        } else {
            console.warn('⚠️ 警告：没有选中任何场次！');
        }

        // 准备JSON数据对象
        const submitData = {
            applicationID: applicationID,
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            gender: formData.get('gender'),
            birthDate: formData.get('birthDate'),
            nationality: finalNationality,
            otherNationality: formData.get('otherNationality'),
            birthPlace: formData.get('birthPlace'),
            email: formData.get('email'),
            phoneNumber: formData.get('phoneNumber'),
            firstTimeExam: formData.get('firstTimeExam'),
            passportNumber: formData.get('passportNumber') || '后补',
            examSessions: checkedSessions,
            selectedVenues: Array.from(document.querySelectorAll('input[name="selectedVenues"]:checked')).map(cb => cb.value),
            examDate: generateExamDateString(checkedSessions),
            timestamp: getBeijingTime(),
            deadlineDate: deadlineDateString, // 截止日期：当天日期+7天
            // 🆕 添加报名截止日期（从数据库 exam_sessions 表的 is_active_until）
            registrationDeadline: registrationDeadline, // ISO格式: YYYY-MM-DD
            registrationDeadlineFormatted: registrationDeadlineFormatted, // 格式化显示: YYYY年MM月DD日
            // 添加费用信息用于邮件显示
            feeCalculation: feeCalculation,
            totalFee: feeCalculation ? feeCalculation.totalFee : 0,
            feeDetails: feeCalculation ? feeCalculation.details : [],
            // 直接提供可用于邮件的HTML内容
            feeDetailsHtml: feeDetailsHtml,
            // 银行转账信息HTML
            bankTransferHtml: bankTransferHtml,
            // 添加考试科目的中文显示名称
            examSessionsDisplay: examSessionsDisplay,
            // 添加格式化的时间戳用于邮件显示
            originalSubmissionTimeFormatted: originalSubmissionTimeFormatted,
            // 添加专属代码信息
            couponCode: couponUsed,
            couponApplied: !!couponUsed
        };
        
        console.log('📋 完整提交数据:', submitData);

        // 处理文件上传 - 转换为base64
        const processFile = (file) => {
            return new Promise((resolve) => {
                if (!file) {
                    resolve(null);
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    const base64Content = e.target.result.split(',')[1]; // 移除 data:type;base64, 前缀
                    resolve({
                        filename: file.name,
                        content: base64Content,
                        mimeType: file.type,
                        size: file.size
                    });
                };
                reader.readAsDataURL(file);
            });
        };

        // 处理护照文件
        const passportFile = document.getElementById('passportUpload').files[0];

        Promise.all([
            processFile(passportFile)
        ]).then(([passportUpload]) => {
            if (passportUpload) {
                submitData.passportUpload = passportUpload;
            }

            console.log('提交表单数据中...');

            // 提交表单数据到服务器
            let jsonData;
            try {
                jsonData = JSON.stringify(submitData);
            } catch (error) {
                console.error('JSON序列化失败:', error);
                throw new Error('数据序列化失败: ' + error.message);
            }

            // 提交表单数据到服务器
            return fetch('https://n8n.talentdual.com/webhook/submit-registration', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: jsonData
            });
        })
        .then(response => {
            console.log('HTTP响应状态:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态: ${response.status}`);
            }
            
            // 检查响应是否为JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                return response.text().then(text => {
                    console.log('服务器返回的非JSON响应:', text);
                    // 如果是"Workflow was started"类型的响应，认为是成功的
                    if (text.includes('Workflow was started') || text.includes('success')) {
                        return { success: true, message: text };
                    }
                    throw new Error('服务器返回的不是JSON格式的响应');
                });
            }
            
            return response.json();
        })
        .then(result => {
            console.log('表单提交结果:', result);
            
            // 检查是否是成功响应（包括n8n的"Workflow was started"响应）
            if (result.success || result.message === 'Workflow was started' || result.message === '报名成功！请查收邮件！') {
                // 隐藏表单并显示成功消息
                form.style.display = 'none';
                successMessage.classList.remove('hidden');
                
                // 显示申请ID
                const applicationIdDisplay = document.getElementById('applicationIdDisplay');
                if (applicationIdDisplay) {
                    applicationIdDisplay.textContent = submitData.applicationID;
                }
                
                // 更新付费备注示例
                const paymentNoteExample = document.getElementById('paymentNoteExample');
                if (paymentNoteExample) {
                    paymentNoteExample.textContent = submitData.applicationID;
                }
                
                // 计算并显示费用
                displayFeeCalculation(submitData.examSessions);
                
                // 🆕 更新报名截止日期提醒
                updateDeadlineReminder();
                
                // 存储提交数据到localStorage
                localStorage.setItem('formSubmission', JSON.stringify({
                    ...submitData,
                    timestamp: getBeijingTime()
                }));
                
                // 滚动到成功消息
                successMessage.scrollIntoView({ behavior: 'smooth' });
            } else {
                throw new Error(result.message || '提交失败');
            }
        })
        .catch(error => {
            console.error('表单提交错误:', error);
            
            // 显示错误消息
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = '提交失败，请检查网络连接或稍后重试。如问题持续，请联系 info@sdi-osd.de';
            form.insertBefore(errorDiv, submitBtn);
            
            // 滚动到错误消息
            errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // 5秒后自动隐藏错误消息
            setTimeout(() => {
                errorDiv.remove();
            }, 5000);
        })
        .finally(() => {
            // 重置加载状态
            submitBtn.classList.remove('loading');
            submitBtn.textContent = '提交报名申请';
        });
    });

    // 拖拽上传功能
    function setupDragAndDrop(containerId, fileInputId) {
        const container = document.getElementById(containerId);
        const fileInput = document.getElementById(fileInputId);
        
        if (!container || !fileInput) return;

        container.addEventListener('dragover', function(e) {
        e.preventDefault();
            container.classList.add('drag-over');
    });

        container.addEventListener('dragleave', function(e) {
        e.preventDefault();
            container.classList.remove('drag-over');
    });

        container.addEventListener('drop', function(e) {
        e.preventDefault();
            container.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            fileInput.dispatchEvent(new Event('change'));
        }
    });
    }

    // 初始化拖拽上传
    setupDragAndDrop('passportUpload', 'passportUpload');

    // 页面加载完成后的初始化
    
    // 移动端上传选项功能

    // 处理付费凭证上传
    const paymentProofInput = document.getElementById('paymentProof');
    const paymentProofInfo = document.getElementById('paymentProofInfo');
    const uploadPaymentProofBtn = document.getElementById('uploadPaymentProof');
    
    if (paymentProofInput && paymentProofInfo && uploadPaymentProofBtn) {
        // 设置付费凭证文件上传
        setupFileUpload('paymentProof', 'paymentProofInfo', 10 * 1024 * 1024, ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']); // 提高付费凭证上传限制
        
        // 为付费凭证文件添加预检查
        paymentProofInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                console.log('付费凭证文件选择:', {
                    name: file.name,
                    size: Math.round(file.size / 1024) + 'KB',
                    type: file.type,
                    lastModified: new Date(file.lastModified).toLocaleString()
                });
                
                const maxSafeSize = 250 * 1024; // 250KB
                if (file.size > maxSafeSize) {
                    console.warn(`文件可能过大: ${Math.round(file.size/1024)}KB > ${Math.round(maxSafeSize/1024)}KB`);
                    if (!file.type.startsWith('image/')) {
                        console.warn('非图片文件无法压缩，可能上传失败');
                    }
                } else {
                    console.log('文件大小安全，可以直接上传');
                }
            }
        });
        
        // 处理上传按钮点击
        uploadPaymentProofBtn.addEventListener('click', function() {
            const file = paymentProofInput.files[0];
            if (!file) {
                showError('paymentProof', '请先选择付费凭证文件');
                return;
            }
            
            // 显示上传状态
            uploadPaymentProofBtn.disabled = true;
            uploadPaymentProofBtn.textContent = '正在上传...';
            
            // 从localStorage获取原始表单数据
            const originalSubmission = localStorage.getItem('formSubmission');
            if (!originalSubmission) {
                alert('未找到原始报名信息，请重新填写表单');
                return;
            }
            
            const originalData = JSON.parse(originalSubmission);
            
            // 确保有applicationID（向后兼容）
            if (!originalData.applicationID) {
                originalData.applicationID = generateApplicationID();
                // 更新localStorage
                localStorage.setItem('formSubmission', JSON.stringify(originalData));
            }
            
            // 处理付费凭证文件
            const processUpload = (fileToUpload) => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const base64Content = e.target.result.split(',')[1];
                    const paymentData = {
                        ...originalData,
                        paymentProof: {
                            filename: fileToUpload.name,
                            content: base64Content,
                            mimeType: fileToUpload.type,
                            size: fileToUpload.size
                        },
                        paymentSubmissionTime: getBeijingTime(),
                        examDate: generateExamDateString(originalData.examSessions || [])
                    };
                    
                    // 提交付费凭证的函数（仅使用n8n webhook）
                    function submitPaymentProof(paymentData) {
                        console.log('开始提交付费凭证到n8n webhook...');
                        console.log('数据大小信息:', {
                            originalDataSize: JSON.stringify(paymentData).length,
                            paymentProofSize: paymentData.paymentProof.size,
                            base64Size: paymentData.paymentProof.content.length
                        });
                        
                        const startTime = Date.now();
                        
                        // 创建兼容的超时控制器
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => {
                            controller.abort();
                        }, 45000); // 45秒超时，给移动端更多时间
                        
                        fetch('https://n8n.talentdual.com/webhook/submit-payment', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(paymentData),
                            signal: controller.signal
                        })
                        .then(response => {
                            clearTimeout(timeoutId); // 清理超时定时器
                            const elapsedTime = Date.now() - startTime;
                            console.log(`✅ 请求完成，耗时: ${elapsedTime}ms, 状态: ${response.status}`);
                            
                            if (!response.ok) {
                                throw new Error(`服务器错误: HTTP ${response.status} - ${response.statusText}`);
                            }
                            
                            const contentType = response.headers.get('content-type');
                            console.log('📄 响应Content-Type:', contentType);
                            
                            if (!contentType || !contentType.includes('application/json')) {
                                return response.text().then(text => {
                                    console.log('📝 收到非JSON响应:', text);
                                    if (text.includes('Workflow was started') || text.includes('success')) {
                                        return { success: true, message: text, source: 'n8n' };
                                    }
                                    throw new Error(`服务器返回了非JSON响应: ${text.substring(0, 200)}`);
                                });
                            }
                            
                            return response.json().then(data => {
                                console.log('📊 收到JSON响应:', data);
                                return { ...data, source: 'n8n' };
                            });
                        })
                        .then(result => {
                            console.log('🎉 n8n webhook上传成功:', result);
                            handleUploadSuccess(result, paymentData);
                        })
                        .catch(error => {
                            clearTimeout(timeoutId); // 清理超时定时器
                            const elapsedTime = Date.now() - startTime;
                            console.error(`❌ n8n webhook上传失败，耗时: ${elapsedTime}ms, 错误:`, error);
                            
                            // 根据错误类型提供更具体的错误信息
                            let userMessage = '上传失败，请稍后重试。';
                            
                            if (error.name === 'AbortError') {
                                userMessage = '网络请求超时，请检查网络连接后重试。';
                                console.log('⏰ 网络超时，建议用户检查网络状态');
                            } else if (error.message.includes('HTTP 413')) {
                                userMessage = '文件过大，请选择较小的文件后重试。';
                                console.log('📦 文件过大，HTTP 413错误');
                            } else if (error.message.includes('HTTP 400')) {
                                userMessage = '请求格式错误，请刷新页面后重试。';
                                console.log('🔧 请求格式错误，HTTP 400');
                            } else if (error.message.includes('HTTP 500')) {
                                userMessage = '服务器内部错误，请联系管理员。';
                                console.log('🔥 服务器内部错误，HTTP 500');
                            } else if (error.message.includes('网络') || error.message.includes('network')) {
                                userMessage = '网络连接失败，请检查网络状态后重试。';
                                console.log('🌐 网络连接问题');
                            } else if (error.message.includes('Failed to fetch')) {
                                userMessage = '网络连接失败，请检查网络状态后重试。';
                                console.log('🔌 Fetch失败，可能是网络问题');
                            }
                            
                            console.log(`📱 移动端调试信息:`, {
                                isMobile: navigator.userAgent.includes('Mobile'),
                                userAgent: navigator.userAgent,
                                errorName: error.name,
                                errorMessage: error.message,
                                networkConnection: navigator.onLine ? '在线' : '离线'
                            });
                            
                            handleUploadError(new Error(userMessage));
                        });
                    }
                    
                    // 处理上传成功
                    function handleUploadSuccess(result, paymentData) {
                        if (result.success || result.message === 'Workflow was started' || result.message.includes('付费凭证上传成功')) {
                            // 上传成功
                            uploadPaymentProofBtn.textContent = '✅ 报名完成！';
                            uploadPaymentProofBtn.style.background = '#4CAF50';
                            uploadPaymentProofBtn.disabled = true;
                            
                            // 隐藏上传区域
                            const uploadSection = document.querySelector('.payment-upload-section');
                            if (uploadSection) {
                                uploadSection.style.display = 'none';
                            }
                            
                            // 显示成功消息
                            showSuccessMessage(result, paymentData);
                            
                            // 更新localStorage
                            const completedData = {
                                ...paymentData,
                                registrationCompleted: true,
                                completionTime: getBeijingTime(),
                                uploadSource: 'n8n'
                            };
                            localStorage.setItem('formSubmission', JSON.stringify(completedData));
                            
                            // 滚动到顶部 - 已禁用，保持在当前位置
                            // setTimeout(() => {
                            //     window.scrollTo({ top: 0, behavior: 'smooth' });
                            // }, 3000);
                        } else {
                            throw new Error(result.message || '上传失败');
                        }
                    }
                    
                    // 处理上传错误
                    function handleUploadError(error) {
                        console.error('处理上传错误:', error);
                        
                        // 重置按钮状态
                        resetUploadButton();
                        
                        // 使用传入的错误消息或默认消息
                        const errorMessage = error.message || '上传失败，请稍后重试。';
                        
                        // 显示错误消息
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'error-message';
                        errorDiv.style.cssText = `
                            background: #ffebee;
                            border: 1px solid #f44336;
                            color: #c62828;
                            padding: 15px;
                            margin: 10px 0;
                            border-radius: 5px;
                            text-align: center;
                        `;
                        errorDiv.innerHTML = `
                            <strong>❌ ${errorMessage}</strong><br>
                            <small>如问题持续，请联系 <a href="mailto:info@sdi-osd.de">info@sdi-osd.de</a></small>
                        `;
                        
                        const uploadSection = document.querySelector('.payment-upload-section');
                        if (uploadSection) {
                            uploadSection.insertAdjacentElement('afterend', errorDiv);
                            errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                        
                        // 15秒后自动隐藏错误消息
                        setTimeout(() => {
                            errorDiv.remove();
                        }, 15000);
                    }
                    
                    // 重置按钮状态
                    function resetUploadButton() {
                        uploadPaymentProofBtn.disabled = false;
                        if (uploadPaymentProofBtn.textContent === '正在上传...') {
                            uploadPaymentProofBtn.textContent = '完成缴费确认';
                        }
                                        }
                    
                    // 显示成功消息
                    function showSuccessMessage(result, paymentData) {
                        const finalSuccessDiv = document.createElement('div');
                        finalSuccessDiv.className = 'final-success-message';
                        finalSuccessDiv.style.cssText = `
                            background: linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%);
                            border: 2px solid #4CAF50;
                            border-radius: 10px;
                            padding: 30px;
                            margin: 20px 0;
                            text-align: center;
                            box-shadow: 0 4px 15px rgba(76, 175, 80, 0.2);
                        `;
                        
                        // 构建成功消息内容
                        const studentName = result.data ? result.data.studentName : `${paymentData.lastName} ${paymentData.firstName}`;
                        const examSessionsArray = result.data ? result.data.examSessions : (paymentData.examSessions || []);
                        const examDate = result.data ? result.data.examDate : (paymentData.examDate || generateExamDateString(examSessionsArray));
                        const examSessions = convertExamSessionsToChinese(examSessionsArray);
                        
                        finalSuccessDiv.innerHTML = `
                            <div style="text-align: center; margin-bottom: 25px;">
                                <h2 style="color: #2E7D32; font-size: 2em; margin: 0 0 10px 0;">🎉 报名成功！</h2>
                                <div style="background: #4CAF50; height: 3px; width: 100px; margin: 0 auto; border-radius: 2px;"></div>
                            </div>
                            
                            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: left;">
                                <h3 style="color: #2E7D32; margin-top: 0; text-align: center;">📋 报名信息确认</h3>
                                <p><strong>学生姓名：</strong>${studentName}</p>
                                <p><strong>考试日期：</strong>${examDate}</p>
                                <p><strong>报名科目：</strong>${examSessions}</p>
                                <p><strong>付费状态：</strong><span style="color: #4CAF50; font-weight: bold;">✅ 已确认</span></p>
                            </div>
                            
                            <div style="background: #FFF3E0; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #FF9800;">
                                <h3 style="color: #E65100; margin-top: 0;">📧 重要提醒</h3>
                                <ul style="text-align: left; margin: 0; padding-left: 20px;">
                                    <li><strong>确认邮件：</strong>请检查您的邮箱，我们已发送报名成功的信函，其附件《考试须知》须仔细阅读并签字。</li>
                                    <li><strong>正式考试确认函：</strong>回传签字的《考试须知》后，您将在考前5-7天收到正式的《考试确认函》，其中将包含具体的考场地址和详细注意事项。</li>
                                    <li><strong>打印文件：</strong>收到正式《考试确认函》后，请务必将其打印为纸质版。</li>
                                    <li><strong>携带证件：</strong>考试当天必须携带护照原件及纸质版《考试确认函》。</li>
                                    <li><strong>到达时间：</strong>请提前30分钟到达考场。</li>
                                </ul>
                            </div>
                            
                            <div style="margin-top: 25px;">
                                <p style="color: #666; font-size: 0.9em; margin: 0;">
                                    如有疑问，请随时联系我们：<a href="mailto:info@sdi-osd.de" style="color: #4CAF50; text-decoration: none;">info@sdi-osd.de</a>
                                </p>
                            </div>
                        `;
                        
                        // 插入到成功消息区域
                        const successMessage = document.getElementById('successMessage');
                        if (successMessage) {
                            successMessage.insertAdjacentElement('afterend', finalSuccessDiv);
                            finalSuccessDiv.scrollIntoView({ behavior: 'smooth' });
                        }
                    }
                    
                    // 开始上传
                    submitPaymentProof(paymentData);
                };
                
                reader.readAsDataURL(fileToUpload);
            };
            
            // 统一文件处理策略：所有文件都压缩转换为JPG格式，确保<1MB
            const maxSafeSize = 5 * 1024 * 1024; // 5MB安全限制（提高限制）
            const targetSize = 1024 * 1024; // 目标大小1MB
            const maxAbsoluteSize = 10 * 1024 * 1024; // 10MB绝对限制
            console.log(`📎 文件信息: ${file.name}, 大小: ${Math.round(file.size/1024)}KB, 类型: ${file.type}`);
            console.log(`📱 用户设备: ${navigator.userAgent.includes('Mobile') ? '移动端' : '桌面端'}`);
            
            // 检查文件是否超过绝对限制
            if (file.size > maxAbsoluteSize) {
                console.error(`❌ 文件过大: ${Math.round(file.size/1024)}KB，超过${Math.round(maxAbsoluteSize/1024/1024)}MB绝对限制`);
                resetUploadButton();
                const errorMessage = `文件大小超过${Math.round(maxAbsoluteSize/1024/1024)}MB限制，请选择较小的文件。`;
                showUploadError(errorMessage);
                return;
            }
            
            // 检查文件类型是否支持
            const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
            if (!supportedTypes.includes(file.type)) {
                console.error(`❌ 不支持的文件类型: ${file.type}`);
                resetUploadButton();
                const errorMessage = `不支持的文件格式，请上传 JPG、PNG 或 PDF 文件。`;
                showUploadError(errorMessage);
                return;
            }
            
            // 统一处理：所有文件都转换为JPG并压缩到1MB以下
            console.log(`🔄 开始处理文件，目标: JPG格式，${Math.round(targetSize/1024)}KB以下`);
            
            convertToJpgAndCompress(file, targetSize)
                .then(processedFile => {
                    console.log(`✅ 文件处理完成: ${Math.round(file.size/1024)}KB → ${Math.round(processedFile.size/1024)}KB (JPG)`);
                    processUpload(processedFile);
                })
                .catch(error => {
                    console.error('❌ 文件处理失败:', error);
                    resetUploadButton();
                    
                    let errorMessage = '文件处理失败，请重试。';
                    if (error.message.includes('PDF')) {
                        errorMessage = 'PDF文件处理失败，建议转换为图片格式后再上传。';
                    } else if (error.message.includes('格式')) {
                        errorMessage = '文件格式不支持，请上传JPG、PNG或PDF文件。';
                    } else if (error.message.includes('过大')) {
                        errorMessage = '文件过大无法处理，请选择较小的文件。';
                    }
                    
                    showUploadError(errorMessage);
                });
            
            // 错误显示辅助函数
            function showUploadError(message) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message mobile-upload-error';
                errorDiv.style.cssText = `
                    background: #ffebee;
                    border: 1px solid #f44336;
                    color: #c62828;
                    padding: 15px;
                    margin: 10px 0;
                    border-radius: 5px;
                    text-align: center;
                    font-size: 14px;
                `;
                errorDiv.innerHTML = `
                    <strong>❌ ${message}</strong><br>
                    <small>如问题持续，请联系 <a href="mailto:info@sdi-osd.de">info@sdi-osd.de</a></small>
                `;
                
                const uploadSection = document.querySelector('.payment-upload-section');
                if (uploadSection) {
                    // 移除之前的错误消息
                    const existingError = uploadSection.querySelector('.mobile-upload-error');
                    if (existingError) {
                        existingError.remove();
                    }
                    uploadSection.insertAdjacentElement('afterend', errorDiv);
                    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                
                // 20秒后自动隐藏错误消息
                setTimeout(() => {
                    if (errorDiv.parentNode) {
                        errorDiv.remove();
                    }
                }, 20000);
            }
        });
    }

    // 全局提示状态管理
    window.registrationClosedShown = false;

    // 显示通道关闭提示（防止重复显示）
    function showRegistrationClosedAlert(message) {
        if (!window.registrationClosedShown) {
            alert(message);
            window.registrationClosedShown = true;
        }
    }

    // 加载统一配置（本地与生产一致），缺省为开放状态
    async function loadDevConfig() {
        try {
            // 统一从静态配置获取，任何环境相同路径
            const response = await fetch('/dev-config.json', { cache: 'no-store' });
            if (!response.ok) throw new Error('dev-config.json not found');
            const config = await response.json();

            const submitBtn = document.querySelector('.submit-btn');

            // 处理通道关闭设置（统一）
            if (config.registrationClosed) {
                if (config.closeMessage) {
                    showRegistrationClosedAlert(config.closeMessage);
                }
                if (submitBtn) {
                    submitBtn.disabled = !!config.submitButtonDisabled;
                    if (config.submitButtonText) {
                        submitBtn.textContent = config.submitButtonText;
                    }
                }
            } else {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = config.submitButtonText || '提交报名';
                }
            }

            // 更新“确认时限”显示
            const deadlineLi = document.getElementById('deadlineReminder');
            const deadlineText = (config && config.confirmationDeadlineDisplay) ? config.confirmationDeadlineDisplay : '2025年10月31日';
            if (deadlineLi) {
                deadlineLi.innerHTML = `<strong>确定时限：</strong>请务必在${deadlineText}前完成所有确认步骤`;
            }

            // 预填写表单数据（如配置）
            if (config.prefillData) {
                prefillForm(config.prefillData);
            }
        } catch (error) {
            // 默认开放：无提示、按钮可点击
            const submitBtn = document.querySelector('.submit-btn');
            if (submitBtn) {
                submitBtn.disabled = false;
                if (submitBtn.textContent === '报名截止') {
                    submitBtn.textContent = '提交报名';
                }
            }

            // 兜底更新确认时限
            const deadlineLi = document.getElementById('deadlineReminder');
            if (deadlineLi) {
                deadlineLi.innerHTML = `<strong>确定时限：</strong>请务必在2025年10月31日前完成所有确认步骤`;
            }
        }
    }

    // 生产环境通道关闭设置
    function applyProductionRegistrationClosed() {
        // 显示通道关闭提示
        const closeMessage = "📢 重要通知：\n\n2025年ÖSD德语水平考试报名已截止！\n\n本次考试报名通道已于指定时间关闭，感谢您的关注。\n如有疑问，请联系：info@sdi-osd.de";
        showRegistrationClosedAlert(closeMessage);
        
        // 设置提交按钮状态
        const submitBtn = document.querySelector('.submit-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "报名截止";
        }
    }

    // 预填写表单数据
    function prefillForm(data) {
        // 填写基本信息
        if (data.firstName) document.getElementById('firstName').value = data.firstName;
        if (data.lastName) document.getElementById('lastName').value = data.lastName;
        if (data.gender) document.getElementById('gender').value = data.gender;
        if (data.birthDate) document.getElementById('birthDate').value = data.birthDate;
        if (data.nationality) document.getElementById('nationality').value = data.nationality;
        if (data.birthPlace) document.getElementById('birthPlace').value = data.birthPlace;
        if (data.email) document.getElementById('email').value = data.email;
        if (data.phoneNumber) document.getElementById('phoneNumber').value = data.phoneNumber;
        if (data.firstTimeExam) document.getElementById('firstTimeExam').value = data.firstTimeExam;

        // 处理考场选择
        if (data.selectedVenues && Array.isArray(data.selectedVenues)) {
            data.selectedVenues.forEach(venue => {
                const checkbox = document.querySelector(`input[name="selectedVenues"][value="${venue}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                    checkbox.dispatchEvent(new Event('change'));
                }
            });
        }

        // 等待考场选项显示后再选择考试科目
        setTimeout(() => {
            if (data.examSessions && Array.isArray(data.examSessions)) {
                data.examSessions.forEach(session => {
                    const checkbox = document.querySelector(`input[name="examSessions"][value="${session}"]`);
                    if (checkbox) {
                        checkbox.checked = true;
                        checkbox.dispatchEvent(new Event('change'));
                    }
                });
            }
        }, 100);
    }
}); 