// Theme management
class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.applyTheme();
        this.bindEvents();
    }

    bindEvents() {
        const themeBtn = document.getElementById('theme-btn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => this.toggleTheme());
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        localStorage.setItem('theme', this.theme);
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        const themeBtn = document.getElementById('theme-btn');
        if (themeBtn) {
            const icon = themeBtn.querySelector('i');
            if (icon) {
                icon.className = this.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
            }
        }
    }
}

// Complaint form management
class ComplaintForm {
    constructor() {
        this.form = document.getElementById('complaintForm');
        this.wordCountElement = document.getElementById('wordCount');
        this.submitBtn = document.getElementById('submitBtn');
        this.complaintBody = document.getElementById('complaintBody');
        this.timestampField = document.getElementById('timestamp');
        
        this.initializeForm();
        this.bindEvents();
        this.updateTimestamp();
    }

    initializeForm() {
        // Set current timestamp
        this.updateTimestamp();
        
        // Update timestamp every second
        setInterval(() => this.updateTimestamp(), 1000);
    }

    bindEvents() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
        
        if (this.complaintBody) {
            this.complaintBody.addEventListener('input', () => this.updateWordCount());
        }

        // User menu dropdown
        const userBtn = document.getElementById('userBtn');
        const dropdownMenu = document.getElementById('dropdownMenu');
        
        if (userBtn && dropdownMenu) {
            userBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownMenu.classList.toggle('show');
            });

            document.addEventListener('click', () => {
                dropdownMenu.classList.remove('show');
            });
        }
    }

    updateTimestamp() {
        if (this.timestampField) {
            const now = new Date();
            const formatted = now.toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            this.timestampField.value = formatted;
        }
    }

    updateWordCount() {
        if (!this.complaintBody || !this.wordCountElement) return;
        
        const text = this.complaintBody.value.trim();
        const words = text ? text.split(/\s+/).filter(word => word.length > 0) : [];
        const wordCount = words.length;
        
        this.wordCountElement.textContent = wordCount;
        
        const wordCountContainer = this.wordCountElement.parentElement;
        if (wordCount >= 10) {
            wordCountContainer.classList.add('valid');
            wordCountContainer.classList.remove('invalid');
        } else {
            wordCountContainer.classList.add('invalid');
            wordCountContainer.classList.remove('valid');
        }
    }

    validateForm() {
        const formData = new FormData(this.form);
        const complaintText = formData.get('complaintBody').trim();
        const words = complaintText.split(/\s+/).filter(word => word.length > 0);
        
        if (words.length < 9) {
            this.showError('Complaint must contain at least 10 words.');
            return false;
        }
        
        // Basic validation for other fields
        const requiredFields = ['name', 'rollNo', 'roomNo'];
        for (const field of requiredFields) {
            if (!formData.get(field).trim()) {
                this.showError(`${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required.`);
                return false;
            }
        }
        
        return true;
    }

async handleSubmit(e) {
    e.preventDefault();
    
    if (!this.validateForm()) return;
    
    this.showLoading();
    
    try {
        const formData = new FormData(this.form);
        const response = await fetch('submit_complaint.php', {
            method: 'POST',
            body: formData
        });
        
        // Log response details for debugging
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        // Get response text first
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.error('Response was not valid JSON:', responseText);
            throw new Error('Server returned invalid response: ' + responseText.substring(0, 100));
        }
        
        this.hideLoading();
        
        if (result.success) {
            this.showSuccess();
            this.form.reset();
            this.updateWordCount();
        } else {
            this.showError(result.message || 'Failed to submit complaint. Please try again.');
        }
    } catch (error) {
        console.error('Submission error details:', error);
        this.hideLoading();
        
        // Show more specific error message
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            this.showError('Network connection failed. Please check your internet connection and try again.');
        } else {
            this.showError('Error: ' + error.message);
        }
    }
}


    showLoading() {
        const modal = document.getElementById('loadingModal');
        if (modal) {
            modal.classList.add('show');
        }
        
        if (this.submitBtn) {
            this.submitBtn.disabled = true;
            this.submitBtn.classList.add('loading');
        }
    }

    hideLoading() {
        const modal = document.getElementById('loadingModal');
        if (modal) {
            modal.classList.remove('show');
        }
        
        if (this.submitBtn) {
            this.submitBtn.disabled = false;
            this.submitBtn.classList.remove('loading');
        }
    }

    showSuccess() {
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.classList.add('show');
        }
    }

    showError(message) {
        const modal = document.getElementById('errorModal');
        const messageElement = document.getElementById('errorMessage');
        
        if (messageElement) {
            messageElement.textContent = message;
        }
        
        if (modal) {
            modal.classList.add('show');
        }
    }
}

// Utility functions
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

function resetForm() {
    const form = document.getElementById('complaintForm');
    if (form) {
        form.reset();
        const wordCountElement = document.getElementById('wordCount');
        if (wordCountElement) {
            wordCountElement.textContent = '0';
            wordCountElement.parentElement.classList.remove('valid', 'invalid');
        }
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear session and redirect to login
        fetch('auth.php?action=logout', { method: 'POST' })
            .then(() => {
                localStorage.removeItem('user_data');
                window.location.href = 'index.html';
            })
            .catch(() => {
                // Force redirect even if request fails
                window.location.href = 'index.html';
            });
    }
}

// User management
function loadUserData() {
    // Check if user is logged in
    fetch('auth.php?action=check_session')
        .then(response => response.json())
        .then(data => {
            if (data.logged_in) {
                const userName = document.getElementById('userName');
                if (userName && data.user) {
                    userName.textContent = data.user.name.split(' ')[0]; // First name only
                }
            } else {
                window.location.href = 'index.html';
            }
        })
        .catch(() => {
            window.location.href = 'index.html';
        });
}

// Animation helpers
function addRippleEffect(element, event) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        pointer-events: none;
        animation: ripple 0.6s ease-out;
    `;
    
    element.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme manager
    new ThemeManager();
    
    // Initialize complaint form if on dashboard page
    if (document.getElementById('complaintForm')) {
        new ComplaintForm();
        loadUserData();
    }
    
    // Add ripple effects to buttons
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function(e) {
            if (!this.disabled) {
                addRippleEffect(this, e);
            }
        });
    });
    
    // Handle click outside modal to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
            }
        });
    });
});

// Add CSS animation for ripple effect
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .btn {
        position: relative;
        overflow: hidden;
    }
`;
document.head.appendChild(style);
