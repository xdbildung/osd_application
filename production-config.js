// 生产环境配置
// 这个文件用于确保生产环境正确显示通道关闭状态

(function() {
    'use strict';
    
    // 生产环境通道关闭配置
    const productionConfig = {
        registrationClosed: true,
        closeMessage: "📢 重要通知：\n\n2025年ÖSD德语水平考试报名已截止！\n\n本次考试报名通道已于指定时间关闭，感谢您的关注。\n如有疑问，请联系：info@sdi-osd.de",
        submitButtonText: "报名截止",
        submitButtonDisabled: true
    };
    
    // 应用生产环境配置
    function applyProductionConfig() {
        // 显示通道关闭提示
        if (productionConfig.closeMessage) {
            alert(productionConfig.closeMessage);
        }
        
        // 设置提交按钮状态
        const submitBtn = document.querySelector('.submit-btn');
        if (submitBtn) {
            if (productionConfig.submitButtonDisabled) {
                submitBtn.disabled = true;
            }
            if (productionConfig.submitButtonText) {
                submitBtn.textContent = productionConfig.submitButtonText;
            }
        }
        
        // 禁用所有表单输入
        const formInputs = document.querySelectorAll('input, select, textarea');
        formInputs.forEach(input => {
            input.disabled = true;
        });
        
        // 添加视觉提示
        const form = document.getElementById('registrationForm');
        if (form) {
            form.style.opacity = '0.6';
            form.style.pointerEvents = 'none';
        }
        
        // 添加关闭提示横幅
        addClosedBanner();
    }
    
    // 添加关闭提示横幅
    function addClosedBanner() {
        const banner = document.createElement('div');
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #ff6b6b, #ee5a52);
            color: white;
            text-align: center;
            padding: 15px;
            font-size: 16px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        banner.innerHTML = `
            🚫 报名通道已关闭 - 2025年ÖSD德语水平考试报名已截止
        `;
        document.body.insertBefore(banner, document.body.firstChild);
        
        // 调整页面内容位置
        const container = document.querySelector('.container');
        if (container) {
            container.style.marginTop = '60px';
        }
    }
    
    // 页面加载完成后应用配置
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyProductionConfig);
    } else {
        applyProductionConfig();
    }
    
    // 导出配置供其他脚本使用
    window.productionConfig = productionConfig;
    window.applyProductionConfig = applyProductionConfig;
    
})(); 