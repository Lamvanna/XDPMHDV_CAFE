/**
 * Register Page JavaScript
 * Handles user registration with validation and auto-login
 */

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Check if already logged in
    if (typeof isLoggedIn === 'function' && isLoggedIn()) {
        window.location.href = 'index.html';
    }

    // Add real-time validation
    setupFormValidation();
});

/**
 * Handle registration form submission
 */
async function handleRegister(e) {
    e.preventDefault();

    // Get form values
    const formData = {
        firstName: document.getElementById('firstName')?.value.trim(),
        lastName: document.getElementById('lastName')?.value.trim(),
        email: document.getElementById('email')?.value.trim(),
        phone: document.getElementById('phone')?.value.trim(),
        password: document.getElementById('password')?.value,
        confirmPassword: document.getElementById('confirmPassword')?.value
    };

    // Validate form
    const errors = validateRegistrationForm(formData);
    if (errors.length > 0) {
        showValidationErrors(errors);
        return;
    }

    try {
        // Show loading state
        setLoadingState(true);

        // Prepare registration data
        const registerData = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            password: formData.password
        };

        // Call registration API
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registerData)
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle registration errors
            setLoadingState(false);
            
            if (response.status === 400 && data.message) {
                const message = data.message.toLowerCase();
                
                // Check for specific error types
                if (message.includes('already exists') || 
                    message.includes('đã tồn tại') ||
                    message.includes('email') || 
                    message.includes('username')) {
                    throw new Error('Email hoặc username đã tồn tại. Vui lòng sử dụng thông tin khác hoặc đăng nhập.');
                }
                
                if (message.includes('invalid')) {
                    throw new Error('Thông tin không hợp lệ. Vui lòng kiểm tra lại.');
                }
                
                throw new Error(data.message);
            }
            
            if (response.status === 500) {
                throw new Error('Lỗi server. Vui lòng thử lại sau.');
            }
            
            throw new Error('Đăng ký thất bại. Vui lòng thử lại.');
        }

        // Registration successful
        if (typeof window.showSuccess === 'function') {
            window.showSuccess('Đăng ký thành công! Đang tự động đăng nhập...', 3000);
        }

        // Auto-login after successful registration
        await autoLoginAfterRegister(formData.email, formData.password);

    } catch (error) {
        console.error('Registration error:', error);
        setLoadingState(false);
        
        // Use notification manager if available, fallback to custom function
        if (typeof window.showError === 'function') {
            window.showError(error.message || 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.', 5000);
        } else {
            showNotification(error.message || 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.', 'error');
        }
    }
}

/**
 * Auto-login after successful registration
 */
async function autoLoginAfterRegister(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            throw new Error('Đăng ký thành công nhưng không thể tự động đăng nhập. Vui lòng đăng nhập thủ công.');
        }

        const data = await response.json();

        // Save token and user data
        if (data.token) {
            localStorage.setItem('token', data.token);
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Dispatch custom event for user login
                window.dispatchEvent(new CustomEvent('userLogin', { detail: data.user }));
            }

            // Wait a moment then redirect
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            throw new Error('Không nhận được token đăng nhập');
        }

    } catch (error) {
        console.error('Auto-login error:', error);
        setLoadingState(false);
        
        if (typeof window.showWarning === 'function') {
            window.showWarning('Đăng ký thành công! Vui lòng đăng nhập.', 3000);
        } else {
            showNotification(error.message || 'Đăng ký thành công! Vui lòng đăng nhập.', 'warning');
        }
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    }
}

/**
 * Validate registration form
 */
function validateRegistrationForm(formData) {
    const errors = [];

    // Validate first name
    if (!formData.firstName || formData.firstName.length < 2) {
        errors.push('Họ phải có ít nhất 2 ký tự');
    }

    // Validate last name
    if (!formData.lastName || formData.lastName.length < 2) {
        errors.push('Tên phải có ít nhất 2 ký tự');
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
        errors.push('Vui lòng nhập email');
    } else if (!emailRegex.test(formData.email)) {
        errors.push('Email không hợp lệ');
    }

    // Validate phone
    const phoneRegex = /^[0-9]{10,11}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
        errors.push('Số điện thoại phải có 10-11 chữ số');
    }

    // Validate password
    if (!formData.password) {
        errors.push('Vui lòng nhập mật khẩu');
    } else if (formData.password.length < 6) {
        errors.push('Mật khẩu phải có ít nhất 6 ký tự');
    }

    // Validate password confirmation
    if (!formData.confirmPassword) {
        errors.push('Vui lòng xác nhận mật khẩu');
    } else if (formData.password !== formData.confirmPassword) {
        errors.push('Mật khẩu xác nhận không khớp');
    }

    return errors;
}

/**
 * Setup real-time form validation
 */
function setupFormValidation() {
    // Email validation
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (this.value && !emailRegex.test(this.value)) {
                showFieldError('email', 'Email không hợp lệ');
            } else {
                clearFieldError('email');
            }
        });
    }

    // Phone validation
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('blur', function() {
            const phoneRegex = /^[0-9]{10,11}$/;
            if (this.value && !phoneRegex.test(this.value)) {
                showFieldError('phone', 'Số điện thoại phải có 10-11 chữ số');
            } else {
                clearFieldError('phone');
            }
        });

        // Only allow numbers
        phoneInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }

    // Password strength indicator
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            showPasswordStrength(this.value);
        });
    }

    // Confirm password validation
    const confirmPasswordInput = document.getElementById('confirmPassword');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            const password = document.getElementById('password')?.value;
            if (this.value && this.value !== password) {
                showFieldError('confirmPassword', 'Mật khẩu không khớp');
            } else {
                clearFieldError('confirmPassword');
            }
        });
    }
}

/**
 * Show password strength indicator
 */
function showPasswordStrength(password) {
    const strengthIndicator = document.getElementById('passwordStrength');
    if (!strengthIndicator) return;

    if (!password) {
        strengthIndicator.innerHTML = '';
        return;
    }

    let strength = 0;
    let strengthText = '';
    let strengthColor = '';

    // Check length
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    
    // Check for numbers
    if (/[0-9]/.test(password)) strength++;
    
    // Check for special characters
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    // Check for uppercase and lowercase
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;

    // Determine strength level
    if (strength <= 1) {
        strengthText = 'Yếu';
        strengthColor = 'text-red-500';
    } else if (strength <= 3) {
        strengthText = 'Trung bình';
        strengthColor = 'text-yellow-500';
    } else {
        strengthText = 'Mạnh';
        strengthColor = 'text-green-500';
    }

    strengthIndicator.innerHTML = `
        <div class="flex items-center space-x-2 mt-1">
            <span class="text-xs text-gray-600">Độ mạnh:</span>
            <span class="text-xs font-semibold ${strengthColor}">${strengthText}</span>
        </div>
    `;
}

/**
 * Show validation errors
 */
function showValidationErrors(errors) {
    const errorContainer = document.getElementById('errorContainer');
    
    if (errorContainer) {
        errorContainer.innerHTML = `
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
                <div class="flex items-start">
                    <i class="fas fa-exclamation-circle mt-1 mr-3"></i>
                    <div class="flex-1">
                        <p class="font-semibold mb-2">Vui lòng kiểm tra lại thông tin:</p>
                        <ul class="list-disc list-inside space-y-1">
                            ${errors.map(error => `<li>${error}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;
        errorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        showNotification(errors[0], 'error');
    }
}

/**
 * Show field-specific error
 */
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    // Add error class
    field.classList.add('border-red-500');
    
    // Create or update error message
    let errorMsg = field.parentElement.querySelector('.field-error');
    if (!errorMsg) {
        errorMsg = document.createElement('div');
        errorMsg.className = 'field-error text-red-500 text-xs mt-1';
        field.parentElement.appendChild(errorMsg);
    }
    errorMsg.textContent = message;
}

/**
 * Clear field-specific error
 */
function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    field.classList.remove('border-red-500');
    
    const errorMsg = field.parentElement.querySelector('.field-error');
    if (errorMsg) {
        errorMsg.remove();
    }
}

/**
 * Set loading state
 */
function setLoadingState(isLoading) {
    const submitButton = document.querySelector('button[type="submit"]');
    const buttonText = submitButton?.querySelector('.button-text');
    const spinner = submitButton?.querySelector('.spinner');

    if (!submitButton) return;

    if (isLoading) {
        submitButton.disabled = true;
        submitButton.classList.add('opacity-75', 'cursor-not-allowed');
        if (buttonText) buttonText.textContent = 'Đang xử lý...';
        if (spinner) spinner.classList.remove('hidden');
    } else {
        submitButton.disabled = false;
        submitButton.classList.remove('opacity-75', 'cursor-not-allowed');
        if (buttonText) buttonText.textContent = 'Đăng ký';
        if (spinner) spinner.classList.add('hidden');
    }
}

/**
 * Show notification - Fallback local function
 * Note: Prefer using window.showNotification from notification-manager.js
 */
function showNotification(message, type = 'info') {
    // Try to use global notification manager first
    if (typeof window.showNotification === 'function' && window.showNotification !== showNotification) {
        window.showNotification(message, type);
        return;
    }
    
    // Fallback: Find notification elements on the page
    const errorDiv = document.getElementById('registerError');
    const successDiv = document.getElementById('registerSuccess');
    
    // Hide both first
    if (errorDiv) errorDiv.classList.add('hidden');
    if (successDiv) successDiv.classList.add('hidden');
    
    // Show appropriate notification
    if (type === 'error') {
        if (errorDiv) {
            const messageSpan = document.getElementById('registerErrorMessage');
            if (messageSpan) {
                messageSpan.textContent = message;
            }
            errorDiv.classList.remove('hidden');
            
            setTimeout(() => {
                errorDiv.classList.add('hidden');
            }, 5000);
        } else {
            alert(message);
        }
    } else if (type === 'success') {
        if (successDiv) {
            const messageSpan = document.getElementById('registerSuccessMessage');
            if (messageSpan) {
                messageSpan.textContent = message;
            }
            successDiv.classList.remove('hidden');
            
            setTimeout(() => {
                successDiv.classList.add('hidden');
            }, 5000);
        } else {
            alert(message);
        }
    } else {
        // For other types, show as success or use alert
        if (successDiv) {
            const messageSpan = document.getElementById('registerSuccessMessage');
            if (messageSpan) {
                messageSpan.textContent = message;
            }
            successDiv.classList.remove('hidden');
            
            setTimeout(() => {
                successDiv.classList.add('hidden');
            }, 5000);
        } else {
            alert(message);
        }
    }
}
