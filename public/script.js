document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registrationForm');
    const successMessage = document.getElementById('successMessage');
    const submitBtn = document.querySelector('.submit-btn');
    const nationalitySelect = document.getElementById('nationality');
    const otherNationalityGroup = document.getElementById('otherNationalityGroup');
    const otherNationalityInput = document.getElementById('otherNationality');

    // 加载开发配置并预填写表单
    loadDevConfig();

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

    // 场次选择逻辑
    const venueCheckboxes = document.querySelectorAll('input[name="selectedVenues"]');
    const beijingOptions = document.getElementById('beijingOptions');
    const chengduOptions = document.getElementById('chengduOptions');

    venueCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const venue = this.value;
            const isChecked = this.checked;
            
            // 更新选项样式
            if (isChecked) {
                this.closest('.session-option').classList.add('selected');
            } else {
                this.closest('.session-option').classList.remove('selected');
            }
            
            // 显示/隐藏对应的考试选项
            if (venue === '北京') {
                if (isChecked) {
                    beijingOptions.style.display = 'block';
                    setTimeout(() => {
                        beijingOptions.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                } else {
                    beijingOptions.style.display = 'none';
                    // 清除北京考场的所有选择
                    const beijingExams = document.querySelectorAll('input[name="examSessions"][data-location="北京"]');
                    beijingExams.forEach(exam => {
                        exam.checked = false;
                        exam.disabled = false;
                        exam.closest('.checkbox-label').classList.remove('disabled');
                    });
                    // 清除北京考场的错误提示
                    const beijingError = beijingOptions.querySelector('.venue-error');
                    if (beijingError) {
                        beijingError.remove();
                    }
                }
            } else if (venue === '成都') {
                if (isChecked) {
                    chengduOptions.style.display = 'block';
                    setTimeout(() => {
                        chengduOptions.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                } else {
                    chengduOptions.style.display = 'none';
                    // 清除成都考场的所有选择
                    const chengduExams = document.querySelectorAll('input[name="examSessions"][data-location="成都"]');
                    chengduExams.forEach(exam => {
                        exam.checked = false;
                        exam.disabled = false;
                        exam.closest('.checkbox-label').classList.remove('disabled');
                    });
                    // 清除成都考场的错误提示
                    const chengduError = chengduOptions.querySelector('.venue-error');
                    if (chengduError) {
                        chengduError.remove();
                    }
                }
            }
            
            // 清除场次选择的错误提示
            clearError('selectedVenues');
        });
    });

    // 考试场次选择逻辑
    const examSessionCheckboxes = document.querySelectorAll('input[name="examSessions"]');
    examSessionCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const level = this.dataset.level;
            const location = this.dataset.location;
            const isSingle = this.dataset.single === 'true';
            
            if (this.checked && !isSingle) {
                // 如果选择了全科，禁用同级别同地点的单科
                const singleModules = document.querySelectorAll(`input[name="examSessions"][data-level="${level}"][data-location="${location}"][data-single="true"]`);
                singleModules.forEach(module => {
                    module.disabled = true;
                    module.checked = false;
                    module.closest('.checkbox-label').classList.add('disabled');
                });
            } else if (!this.checked && !isSingle) {
                // 如果取消选择全科，启用同级别同地点的单科
                const singleModules = document.querySelectorAll(`input[name="examSessions"][data-level="${level}"][data-location="${location}"][data-single="true"]`);
                singleModules.forEach(module => {
                    module.disabled = false;
                    module.closest('.checkbox-label').classList.remove('disabled');
                });
            } else if (this.checked && isSingle) {
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
            } else if (!this.checked && isSingle) {
                // 如果取消选择单科，启用全科
                const fullExam = document.querySelector(`input[name="examSessions"][data-level="${level}"][data-location="${location}"]:not([data-single])`);
                if (fullExam) {
                    fullExam.disabled = false;
                    fullExam.closest('.checkbox-label').classList.remove('disabled');
                }
            }
            
            // 清除当前场次的错误提示
            const currentVenueOptionsId = location === '北京' ? 'beijingOptions' : 'chengduOptions';
            const currentVenueOptions = document.getElementById(currentVenueOptionsId);
            if (currentVenueOptions) {
                const venueError = currentVenueOptions.querySelector('.venue-error');
                if (venueError) {
                    venueError.remove();
                }
            }
        });
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
    setupFileUpload('signedDocument', 'fileInfo', 10 * 1024 * 1024, ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'application/pdf']);
    setupFileUpload('passportUpload', 'passportFileInfo', 5 * 1024 * 1024, ['image/jpeg', 'image/png', 'application/pdf']);

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

    // 费用计算函数
    function calculateTotalFee(examSessions) {
        // 费用表
        const feeTable = {
            'A1': {
                '全科': 1550,
                '笔试': 950,
                '口试': 600
            },
            'A2': {
                '全科': 1650,
                '笔试': 1000,
                '口试': 650
            }
        };
        
        let totalFee = 0;
        const feeDetails = [];
        
        examSessions.forEach(session => {
            // 解析考试选项：格式为 "北京-A1-全科" 或 "成都-A2-笔试"
            const parts = session.split('-');
            if (parts.length === 3) {
                const location = parts[0];
                const level = parts[1];
                const type = parts[2];
                
                if (feeTable[level] && feeTable[level][type]) {
                    const fee = feeTable[level][type];
                    totalFee += fee;
                    feeDetails.push({
                        location: location,
                        level: level,
                        type: type,
                        fee: fee,
                        description: `${location} ${level}${type}`
                    });
                }
            }
        });
        
        return {
            totalFee: totalFee,
            details: feeDetails
        };
    }

    // 生成唯一的申请ID
    function generateApplicationID() {
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        
        // 生成3位随机数
        const randomNum = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
        
        return `OSD-${month}${day}-${randomNum}`;
    }

    // 图片压缩函数
    function compressImage(file, quality = 0.8, maxWidth = 1920, maxHeight = 1080) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = function() {
                // 计算新的尺寸
                let { width, height } = img;
                
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.floor(width * ratio);
                    height = Math.floor(height * ratio);
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // 绘制和压缩图片
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            // 创建新的File对象
                            const compressedFile = new File([blob], file.name, {
                                type: file.type,
                                lastModified: Date.now()
                            });
                            resolve(compressedFile);
                        } else {
                            reject(new Error('图片压缩失败'));
                        }
                    },
                    file.type,
                    quality
                );
            };
            
            img.onerror = () => reject(new Error('图片加载失败'));
            img.src = URL.createObjectURL(file);
        });
    }

    // 根据考试场次生成考试日期字符串
    function generateExamDateString(examSessions) {
        console.log('generateExamDateString 被调用，examSessions:', examSessions);
        
        const cityDateMap = {
            '北京': '2025/9/6',
            '成都': '2025/8/27'
        };
        
        // 提取所有涉及的城市
        const cities = new Set();
        examSessions.forEach(session => {
            console.log('处理session:', session);
            const parts = session.split('-');
            if (parts.length === 3) {
                const location = parts[0];
                console.log('提取到的location:', location);
                if (cityDateMap[location]) {
                    cities.add(location);
                    console.log('添加城市到Set:', location);
                }
            }
        });
        
        console.log('提取到的城市:', Array.from(cities));
        
        // 根据城市生成日期字符串
        const cityDates = Array.from(cities).map(city => {
            return `${cityDateMap[city]} (${city})`;
        }).sort(); // 按日期排序
        
        const result = cityDates.length > 0 ? cityDates.join(', ') : '待定';
        console.log('生成的日期字符串:', result);
        
        return result;
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

    // 验证邮箱格式
    function validateEmail(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
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
                    if (!validateEmail(value)) {
                        isValid = false;
                        errorMessage = '请输入有效的邮箱地址（格式：xxxx@xxx.xxx）';
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

    // 验证整个表单
    function validateForm() {
        let isValid = true;
        const errors = [];

        // 验证所有必填字段
        const requiredFields = ['firstName', 'lastName', 'gender', 'birthDate', 'nationality', 'birthPlace', 'email', 'phoneNumber', 'firstTimeExam'];

        requiredFields.forEach(fieldId => {
            if (!validateField(fieldId)) {
                isValid = false;
            }
        });

        // 验证其他国籍字段
        if (nationalitySelect.value === 'Other') {
            if (!validateField('otherNationality')) {
                isValid = false;
            }
        }

        // 验证场次选择
        const checkedVenues = document.querySelectorAll('input[name="selectedVenues"]:checked');
        if (checkedVenues.length === 0) {
            isValid = false;
            showError('selectedVenues', '请至少选择一个考试场次');
        } else {
            clearError('selectedVenues');
            
            // 先清除所有场次选项的错误提示
            const venueErrors = document.querySelectorAll('.venue-error');
            venueErrors.forEach(error => error.remove());
            
            // 验证每个选中的场次都必须有对应的考试选项
            checkedVenues.forEach(venue => {
                const venueValue = venue.value;
                const venueOptionsId = venueValue === '北京' ? 'beijingOptions' : 'chengduOptions';
                const venueOptions = document.getElementById(venueOptionsId);
                
                if (venueOptions && venueOptions.style.display !== 'none') {
                    // 检查该场次是否有选中的考试选项
                    const venueExamSessions = document.querySelectorAll(`input[name="examSessions"][data-location="${venueValue}"]:checked`);
                    
                    if (venueExamSessions.length === 0) {
                        isValid = false;
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
                    }
                }
            });
        }

        // 验证签字文件上传
        const signedDocumentFile = document.getElementById('signedDocument');
        if (!signedDocumentFile.files.length) {
            isValid = false;
            showError('signedDocument', '请上传签字文件');
        } else {
            const file = signedDocumentFile.files[0];
            const maxSize = 10 * 1024 * 1024; // 10MB
            const allowedTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'application/pdf'];
            
            if (file.size > maxSize) {
                isValid = false;
                showError('signedDocument', '文件大小不能超过10MB');
            } else if (!allowedTypes.includes(file.type)) {
                isValid = false;
                showError('signedDocument', '请上传Word文档(.doc/.docx)或PDF文件');
            } else {
                clearError('signedDocument');
            }
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
            } else if (!allowedTypes.includes(file.type)) {
            isValid = false;
                showError('passportUpload', '护照文件请上传jpg、png或pdf格式');
        }
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
            // 滚动到第一个错误字段
            const firstError = document.querySelector('.invalid');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
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
            timestamp: new Date().toISOString()
        };

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

        // 处理签字文件
        const signedDocumentFile = document.getElementById('signedDocument').files[0];
        const passportFile = document.getElementById('passportUpload').files[0];

        Promise.all([
            processFile(signedDocumentFile),
            processFile(passportFile)
        ]).then(([signedDocument, passportUpload]) => {
            if (signedDocument) {
                submitData.signedDocument = signedDocument;
            }
            if (passportUpload) {
                submitData.passportUpload = passportUpload;
            }

            console.log('提交的表单数据：', submitData);

            // 提交表单数据到服务器
                         return fetch('https://n8n.talentdual.com/webhook/submit-registration', {
                 method: 'POST',
                 headers: {
                     'Content-Type': 'application/json',
                 },
                 body: JSON.stringify(submitData)
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
                
                // 存储提交数据到localStorage
                localStorage.setItem('formSubmission', JSON.stringify({
                    ...submitData,
                    timestamp: new Date().toISOString()
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
    setupDragAndDrop('signedDocument', 'signedDocument');
    setupDragAndDrop('passportUpload', 'passportUpload');

    // 页面加载完成后的初始化
    console.log('SDI奥德考试报名表单已加载');

    // 处理付费凭证上传
    const paymentProofInput = document.getElementById('paymentProof');
    const paymentProofInfo = document.getElementById('paymentProofInfo');
    const uploadPaymentProofBtn = document.getElementById('uploadPaymentProof');
    
    if (paymentProofInput && paymentProofInfo && uploadPaymentProofBtn) {
        // 设置付费凭证文件上传
        setupFileUpload('paymentProof', 'paymentProofInfo', 5 * 1024 * 1024, ['image/jpeg', 'image/png', 'application/pdf']);
        
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
                        paymentSubmissionTime: new Date().toISOString(),
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
                        
                        fetch('https://n8n.talentdual.com/webhook/submit-payment', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(paymentData),
                            signal: AbortSignal.timeout(30000) // 30秒超时
                        })
                        .then(response => {
                            const elapsedTime = Date.now() - startTime;
                            console.log(`请求完成，耗时: ${elapsedTime}ms, 状态: ${response.status}`);
                            
                            if (!response.ok) {
                                throw new Error(`服务器错误: HTTP ${response.status} - ${response.statusText}`);
                            }
                            
                            const contentType = response.headers.get('content-type');
                            console.log('响应Content-Type:', contentType);
                            
                            if (!contentType || !contentType.includes('application/json')) {
                                return response.text().then(text => {
                                    console.log('收到非JSON响应:', text);
                                    if (text.includes('Workflow was started') || text.includes('success')) {
                                        return { success: true, message: text, source: 'n8n' };
                                    }
                                    throw new Error(`服务器返回了非JSON响应: ${text.substring(0, 200)}`);
                                });
                            }
                            
                            return response.json().then(data => {
                                console.log('收到JSON响应:', data);
                                return { ...data, source: 'n8n' };
                            });
                        })
                        .then(result => {
                            console.log('n8n webhook上传成功:', result);
                            handleUploadSuccess(result, paymentData);
                        })
                        .catch(error => {
                            const elapsedTime = Date.now() - startTime;
                            console.error(`n8n webhook上传失败，耗时: ${elapsedTime}ms, 错误:`, error);
                            
                            // 根据错误类型提供更具体的错误信息
                            let userMessage = '上传失败，请稍后重试。';
                            
                            if (error.name === 'AbortError') {
                                userMessage = '网络请求超时，请检查网络连接后重试。';
                            } else if (error.message.includes('HTTP 413')) {
                                userMessage = '文件过大，请选择较小的文件后重试。';
                            } else if (error.message.includes('HTTP 400')) {
                                userMessage = '请求格式错误，请刷新页面后重试。';
                            } else if (error.message.includes('HTTP 500')) {
                                userMessage = '服务器内部错误，请联系管理员。';
                            } else if (error.message.includes('网络')) {
                                userMessage = '网络连接失败，请检查网络状态后重试。';
                            }
                            
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
                                completionTime: new Date().toISOString(),
                                uploadSource: 'n8n'
                            };
                            localStorage.setItem('formSubmission', JSON.stringify(completedData));
                            
                            // 滚动到顶部
                            setTimeout(() => {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }, 3000);
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
                        const examSessions = Array.isArray(examSessionsArray) ? examSessionsArray.join(', ') : examSessionsArray;
                        
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
                                    <li><strong>确认邮件：</strong>请检查您的邮箱，我们已发送报名成功确认函</li>
                                    <li><strong>打印邮件：</strong>请将确认函打印出来，考试当天必须携带</li>
                                    <li><strong>携带证件：</strong>考试当天请携带护照原件和纸质确认函</li>
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
            
            // 检查文件大小并进行必要的压缩
            const maxSafeSize = 250 * 1024; // 250KB安全限制
            console.log(`文件信息: ${file.name}, 大小: ${Math.round(file.size/1024)}KB, 类型: ${file.type}`);
            
            if (file.type.startsWith('image/') && file.size > maxSafeSize) {
                console.log(`检测到大图片文件: ${Math.round(file.size/1024)}KB，超过${Math.round(maxSafeSize/1024)}KB限制，正在压缩...`);
                
                // 计算压缩参数以确保文件大小在安全范围内
                let quality = 0.7;
                let maxWidth = 1200;
                let maxHeight = 1200;
                
                if (file.size > 1024 * 1024) { // 1MB以上
                    quality = 0.5;
                    maxWidth = 800;
                    maxHeight = 800;
                } else if (file.size > 500 * 1024) { // 500KB以上
                    quality = 0.6;
                    maxWidth = 1000;
                    maxHeight = 1000;
                }
                
                compressImage(file, quality, maxWidth, maxHeight)
                    .then(compressedFile => {
                        console.log(`图片压缩完成: ${Math.round(file.size/1024)}KB → ${Math.round(compressedFile.size/1024)}KB`);
                        if (compressedFile.size > maxSafeSize) {
                            console.warn(`压缩后仍然过大，进行二次压缩...`);
                            return compressImage(compressedFile, 0.4, 600, 600);
                        }
                        return compressedFile;
                    })
                    .then(finalFile => {
                        console.log(`最终文件大小: ${Math.round(finalFile.size/1024)}KB`);
                        if (finalFile.size > maxSafeSize) {
                            throw new Error(`文件压缩后仍然过大: ${Math.round(finalFile.size/1024)}KB`);
                        }
                        processUpload(finalFile);
                    })
                    .catch(error => {
                        console.error('图片压缩失败:', error);
                        
                        // 重置按钮状态
                        uploadPaymentProofBtn.disabled = false;
                        if (uploadPaymentProofBtn.textContent === '正在上传...') {
                            uploadPaymentProofBtn.textContent = '完成缴费确认';
                        }
                        
                        // 显示错误消息
                        const errorMessage = `图片文件过大，无法压缩到安全大小。请选择较小的图片文件（建议<200KB）。`;
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
                    });
            } else if (file.size > maxSafeSize) {
                console.error(`非图片文件过大: ${Math.round(file.size/1024)}KB`);
                
                // 重置按钮状态
                uploadPaymentProofBtn.disabled = false;
                if (uploadPaymentProofBtn.textContent === '正在上传...') {
                    uploadPaymentProofBtn.textContent = '完成缴费确认';
                }
                
                // 显示错误消息
                const errorMessage = `文件大小超过限制（${Math.round(maxSafeSize/1024)}KB），请选择较小的文件。`;
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
                
                return;
            } else {
                console.log(`文件大小合适，直接上传: ${Math.round(file.size/1024)}KB`);
                processUpload(file);
            }
        });
    }

    // 加载开发配置并预填写表单
    async function loadDevConfig() {
        try {
            const response = await fetch('/api/dev-config');
            const config = await response.json();
            
            if (config.isDevelopment && config.prefillData) {
                console.log('🔧 开发模式：正在预填写表单数据...');
                prefillForm(config.prefillData);
            }
        } catch (error) {
            console.log('Dev config not available, running in production mode');
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

        console.log('✅ 表单预填写完成');
    }
}); 