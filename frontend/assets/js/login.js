// Login and Registration Handler with Backend API

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const rememberMe = document.getElementById('rememberMe')?.checked || false;
    
    // Validation
    if (!email || !password) {
        showError('loginError', 'Vui lòng điền đầy đủ thông tin');
        return;
    }
    
    try {
        // Call login API
        const result = await login(email, password);
        
        if (result && result.success) {
            // If remember me is not checked, move to session storage
            if (!rememberMe) {
                const token = localStorage.getItem('authToken');
                const user = localStorage.getItem('user');
                sessionStorage.setItem('authToken', token);
                sessionStorage.setItem('user', user);
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
            }
            
            if (typeof window.showSuccess === 'function') {
                window.showSuccess('Đăng nhập thành công!', 2000);
            } else {
                showSuccess('loginError', 'Đăng nhập thành công!');
            }
            
            // Update UI immediately if updateUIForAuthState is available
            if (typeof updateUIForAuthState === 'function') {
                updateUIForAuthState();
            }
            
            // Dispatch user login event to update menu immediately
            window.dispatchEvent(new CustomEvent('userLogin', { detail: result.user }));
            
            // Redirect after 1.5 seconds
            setTimeout(() => {
                const userData = getCurrentUser();
                // Redirect based on role
                if (userData.role === 'admin') {
                    // Admin goes to dashboard
                    window.location.href = 'admin/admin-stats.html';
                } else if (userData.role === 'staff') {
                    // Staff also goes to dashboard
                    window.location.href = 'admin/admin-stats.html';
                } else {
                    // Customer stays on homepage
                    window.location.href = 'index.html';
                }
            }, 1500);
            
        } else {
            if (typeof window.showError === 'function') {
                window.showError('Đăng nhập thất bại', 5000);
            } else {
                showError('loginError', 'Đăng nhập thất bại');
            }
        }
        
    } catch (error) {
        console.error('Login error:', error);
        if (typeof window.showError === 'function') {
            window.showError(error.message || 'Tên đăng nhập hoặc mật khẩu không đúng', 5000);
        } else {
            showError('loginError', error.message || 'Tên đăng nhập hoặc mật khẩu không đúng');
        }
        
        // Highlight error fields
        document.getElementById('loginUsername').classList.add('border-red-500', 'ring-red-500');
        document.getElementById('loginPassword').classList.add('border-red-500', 'ring-red-500');
    }
}

// Handle Registration
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const phone = document.getElementById('registerPhone').value.trim();
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    const confirmPassword = document.getElementById('registerConfirmPassword').value.trim();
    
    // Clear previous errors
    document.querySelectorAll('#registerForm input').forEach(input => {
        input.classList.remove('border-red-500', 'ring-red-500');
    });
    
    // Validation
    if (!name || !email || !phone || !username || !password || !confirmPassword) {
        showError('registerError', 'Vui lòng điền đầy đủ thông tin');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('registerError', 'Mật khẩu xác nhận không khớp');
        document.getElementById('registerPassword').classList.add('border-red-500', 'ring-red-500');
        document.getElementById('registerConfirmPassword').classList.add('border-red-500', 'ring-red-500');
        return;
    }
    
    if (password.length < 6) {
        showError('registerError', 'Mật khẩu phải có ít nhất 6 ký tự');
        document.getElementById('registerPassword').classList.add('border-red-500', 'ring-red-500');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('registerError', 'Email không hợp lệ');
        document.getElementById('registerEmail').classList.add('border-red-500', 'ring-red-500');
        return;
    }
    
    // Phone validation
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
        showError('registerError', 'Số điện thoại phải có 10 chữ số');
        document.getElementById('registerPhone').classList.add('border-red-500', 'ring-red-500');
        return;
    }
    
    try {
        // Create user data
        const userData = {
            username: username,
            email: email,
            password: password,
            firstName: name.split(' ')[0],
            lastName: name.split(' ').slice(1).join(' '),
            phone: phone,
            role: 'customer'
        };
        
        // Call register API
        const result = await register(userData);
        
        if (result && result.success) {
            if (typeof window.showSuccess === 'function') {
                window.showSuccess('Đăng ký thành công! Đang chuyển đến trang chủ...', 2000);
            } else {
                showSuccess('registerError', 'Đăng ký thành công! Đang chuyển đến trang chủ...');
            }
            
            // Reset form
            document.getElementById('registerFormElement').reset();
            
            // Redirect to home after 1.5 seconds
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            if (typeof window.showError === 'function') {
                window.showError('Đăng ký thất bại', 5000);
            } else {
                showError('registerError', 'Đăng ký thất bại');
            }
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        const errorMessage = error.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.';
        const lowerMsg = errorMessage.toLowerCase();
        
        let finalMessage = errorMessage;
        
        if (lowerMsg.includes('already exists') || lowerMsg.includes('đã tồn tại')) {
            finalMessage = 'Email hoặc username đã tồn tại. Vui lòng sử dụng thông tin khác.';
            document.getElementById('registerEmail')?.classList.add('border-red-500', 'ring-red-500');
            document.getElementById('registerUsername')?.classList.add('border-red-500', 'ring-red-500');
        } else if (lowerMsg.includes('username')) {
            finalMessage = 'Username đã tồn tại';
            document.getElementById('registerUsername')?.classList.add('border-red-500', 'ring-red-500');
        } else if (lowerMsg.includes('email')) {
            finalMessage = 'Email đã được sử dụng';
            document.getElementById('registerEmail')?.classList.add('border-red-500', 'ring-red-500');
        }
        
        if (typeof window.showError === 'function') {
            window.showError(finalMessage, 5000);
        } else {
            showError('registerError', finalMessage);
        }
    }
}

// Show error message - Fallback local function
function showError(elementId, message) {
    // Try global notification manager first (avoid recursion)
    if (typeof window.showError === 'function' && window.showError !== showError) {
        window.showError(message);
        return;
    }
    
    // Fallback to inline element
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden', 'text-green-600');
        errorElement.classList.add('text-red-600');
    }
}

// Show success message - Fallback local function
function showSuccess(elementId, message) {
    // Try global notification manager first (avoid recursion)
    if (typeof window.showSuccess === 'function' && window.showSuccess !== showSuccess) {
        window.showSuccess(message);
        return;
    }
    
    // Fallback to inline element
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden', 'text-red-600');
        errorElement.classList.add('text-green-600');
    }
}

// Show login form
function showLogin() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('loginTab').classList.add('border-coffee', 'text-coffee');
    document.getElementById('registerTab').classList.remove('border-coffee', 'text-coffee');
    
    // Clear errors
    const loginError = document.getElementById('loginError');
    if (loginError) loginError.classList.add('hidden');
    
    // Clear form
    document.getElementById('loginFormElement').reset();
}

// Show register form
function showRegister() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
    document.getElementById('loginTab').classList.remove('border-coffee', 'text-coffee');
    document.getElementById('registerTab').classList.add('border-coffee', 'text-coffee');
    
    // Clear errors
    const registerError = document.getElementById('registerError');
    if (registerError) registerError.classList.add('hidden');
    
    // Clear form
    document.getElementById('registerFormElement').reset();
}

// Switch between login and register tabs
function switchTab(tab) {
    if (tab === 'login') {
        showLogin();
    } else if (tab === 'register') {
        showRegister();
    }
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = event.currentTarget;
    const icon = button.querySelector('i');
    
    if (input && icon) {
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Don't auto-redirect - allow admin/staff to access customer pages
    // They can use menu to go to admin panel if needed
    
    // Add form submit handlers
    const loginFormElement = document.getElementById('loginFormElement');
    const registerFormElement = document.getElementById('registerFormElement');
    
    if (loginFormElement) {
        loginFormElement.addEventListener('submit', handleLogin);
    }
    
    if (registerFormElement) {
        registerFormElement.addEventListener('submit', handleRegister);
    }
    
    // Remove error styling on input
    document.querySelectorAll('input').forEach(field => {
        field.addEventListener('input', function() {
            this.classList.remove('border-red-500', 'ring-red-500');
        });
    });
    
    // Show password toggle
    document.querySelectorAll('[data-toggle-password]').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const targetId = this.getAttribute('data-toggle-password');
            const input = document.getElementById(targetId);
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
});
