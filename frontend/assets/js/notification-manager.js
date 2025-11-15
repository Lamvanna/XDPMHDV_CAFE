/**
 * Notification Manager Module
 * Quản lý hệ thống thông báo toast an toàn, không đệ quy, có hàng đợi
 * 
 * Features:
 * - Queue-based notification system (hàng đợi)
 * - No recursion, no stack overflow
 * - Auto-cleanup to prevent memory leaks
 * - Smooth animations
 * - Multiple notification types: success, error, warning, info
 */

class NotificationManager {
    constructor(options = {}) {
        this.queue = [];
        this.activeNotifications = new Map();
        this.isProcessing = false;
        this.maxNotifications = options.maxNotifications || 3;
        this.defaultDuration = options.defaultDuration || 5000;
        this.containerPosition = options.containerPosition || 'top-right';
        this.animationDuration = 300; // ms
        
        this.init();
    }

    /**
     * Khởi tạo container cho notifications
     */
    init() {
        if (document.getElementById('notification-container')) {
            return; // Container đã tồn tại
        }

        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = `notification-container notification-${this.containerPosition}`;
        container.style.cssText = `
            position: fixed;
            z-index: 9999;
            pointer-events: none;
            ${this.getPositionStyles()}
        `;
        
        document.body.appendChild(container);
        
        // Thêm styles nếu chưa có
        this.injectStyles();
    }

    /**
     * Lấy CSS position dựa trên containerPosition
     */
    getPositionStyles() {
        const positions = {
            'top-right': 'top: 20px; right: 20px;',
            'top-left': 'top: 20px; left: 20px;',
            'top-center': 'top: 20px; left: 50%; transform: translateX(-50%);',
            'bottom-right': 'bottom: 20px; right: 20px;',
            'bottom-left': 'bottom: 20px; left: 20px;',
            'bottom-center': 'bottom: 20px; left: 50%; transform: translateX(-50%);'
        };
        return positions[this.containerPosition] || positions['top-right'];
    }

    /**
     * Thêm CSS styles vào document
     */
    injectStyles() {
        if (document.getElementById('notification-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification-container {
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
                width: auto;
            }

            .notification-toast {
                pointer-events: auto;
                background: white;
                border-radius: 8px;
                padding: 16px 20px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                display: flex;
                align-items: center;
                gap: 12px;
                min-width: 300px;
                max-width: 400px;
                opacity: 0;
                transform: translateX(400px);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .notification-toast.show {
                opacity: 1;
                transform: translateX(0);
            }

            .notification-toast.hide {
                opacity: 0;
                transform: translateX(400px);
            }

            .notification-icon {
                flex-shrink: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                font-size: 14px;
                font-weight: bold;
            }

            .notification-content {
                flex: 1;
                font-size: 14px;
                line-height: 1.5;
                color: #333;
            }

            .notification-close {
                flex-shrink: 0;
                width: 20px;
                height: 20px;
                border: none;
                background: transparent;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #999;
                font-size: 18px;
                transition: color 0.2s;
                padding: 0;
            }

            .notification-close:hover {
                color: #333;
            }

            /* Success */
            .notification-toast.success {
                border-left: 4px solid #10b981;
            }

            .notification-toast.success .notification-icon {
                background: #d1fae5;
                color: #10b981;
            }

            /* Error */
            .notification-toast.error {
                border-left: 4px solid #ef4444;
            }

            .notification-toast.error .notification-icon {
                background: #fee2e2;
                color: #ef4444;
            }

            /* Warning */
            .notification-toast.warning {
                border-left: 4px solid #f59e0b;
            }

            .notification-toast.warning .notification-icon {
                background: #fef3c7;
                color: #f59e0b;
            }

            /* Info */
            .notification-toast.info {
                border-left: 4px solid #3b82f6;
            }

            .notification-toast.info .notification-icon {
                background: #dbeafe;
                color: #3b82f6;
            }

            @media (max-width: 640px) {
                .notification-container {
                    left: 10px !important;
                    right: 10px !important;
                    transform: none !important;
                    max-width: none;
                }

                .notification-toast {
                    min-width: auto;
                    max-width: none;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Hiển thị notification
     * @param {string} message - Nội dung thông báo
     * @param {string} type - Loại: success, error, warning, info
     * @param {number} duration - Thời gian hiển thị (ms), 0 = không tự động ẩn
     */
    show(message, type = 'info', duration = null) {
        // Validate parameters
        if (!message || typeof message !== 'string') {
            console.error('NotificationManager: Invalid message');
            return null;
        }

        const validTypes = ['success', 'error', 'warning', 'info'];
        if (!validTypes.includes(type)) {
            type = 'info';
        }

        // Tạo notification object
        const notification = {
            id: this.generateId(),
            message,
            type,
            duration: duration !== null ? duration : this.defaultDuration
        };

        // Thêm vào queue
        this.queue.push(notification);

        // Process queue
        this.processQueue();

        return notification.id;
    }

    /**
     * Xử lý hàng đợi notification
     */
    async processQueue() {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;

        while (this.queue.length > 0 && this.activeNotifications.size < this.maxNotifications) {
            const notification = this.queue.shift();
            await this.displayNotification(notification);
        }

        this.isProcessing = false;
    }

    /**
     * Hiển thị một notification
     */
    async displayNotification(notification) {
        const container = document.getElementById('notification-container');
        if (!container) {
            console.error('NotificationManager: Container not found');
            return;
        }

        // Tạo toast element
        const toast = this.createToastElement(notification);
        
        // Thêm vào container
        container.appendChild(toast);

        // Thêm vào active notifications
        this.activeNotifications.set(notification.id, {
            element: toast,
            timeoutId: null
        });

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto hide sau duration (nếu có)
        if (notification.duration > 0) {
            const timeoutId = setTimeout(() => {
                this.hide(notification.id);
            }, notification.duration);

            this.activeNotifications.get(notification.id).timeoutId = timeoutId;
        }
    }

    /**
     * Tạo toast DOM element
     */
    createToastElement(notification) {
        const toast = document.createElement('div');
        toast.className = `notification-toast ${notification.type}`;
        toast.dataset.notificationId = notification.id;

        const icon = this.getIcon(notification.type);
        
        toast.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">${this.escapeHtml(notification.message)}</div>
            <button class="notification-close" aria-label="Đóng">&times;</button>
        `;

        // Close button event
        const closeBtn = toast.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.hide(notification.id);
        });

        return toast;
    }

    /**
     * Lấy icon cho từng loại notification
     */
    getIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    /**
     * Ẩn notification
     */
    hide(notificationId) {
        const activeNotification = this.activeNotifications.get(notificationId);
        
        if (!activeNotification) {
            return;
        }

        const { element, timeoutId } = activeNotification;

        // Clear timeout nếu có
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        // Animation ẩn
        element.classList.remove('show');
        element.classList.add('hide');

        // Remove khỏi DOM sau animation
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.activeNotifications.delete(notificationId);

            // Process queue tiếp nếu còn
            this.processQueue();
        }, this.animationDuration);
    }

    /**
     * Ẩn tất cả notifications
     */
    hideAll() {
        const ids = Array.from(this.activeNotifications.keys());
        ids.forEach(id => this.hide(id));
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Escape HTML để tránh XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Shorthand methods
     */
    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }

    /**
     * Cleanup - gọi khi không còn dùng
     */
    destroy() {
        this.hideAll();
        this.queue = [];
        
        const container = document.getElementById('notification-container');
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }

        const styles = document.getElementById('notification-styles');
        if (styles && styles.parentNode) {
            styles.parentNode.removeChild(styles);
        }
    }
}

// Tạo instance global
if (typeof window !== 'undefined') {
    window.notificationManager = new NotificationManager({
        maxNotifications: 3,
        defaultDuration: 5000,
        containerPosition: 'top-right'
    });

    // Expose shorthand methods globally
    window.showNotification = (message, type, duration) => {
        return window.notificationManager.show(message, type, duration);
    };

    window.showSuccess = (message, duration) => {
        return window.notificationManager.success(message, duration);
    };

    window.showError = (message, duration) => {
        return window.notificationManager.error(message, duration);
    };

    window.showWarning = (message, duration) => {
        return window.notificationManager.warning(message, duration);
    };

    window.showInfo = (message, duration) => {
        return window.notificationManager.info(message, duration);
    };
}
