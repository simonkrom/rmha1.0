// assets/js/main.js

// Configuration globale - dynamique selon l'environnement
const CONFIG = {
    API_BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:4000/api'
        : `https://${window.location.hostname.replace('laboratoire-frontend', 'laboratoire-backend')}.onrender.com/api`,
    MAPS_API_KEY: 'YOUR_GOOGLE_MAPS_API_KEY',
    ITEMS_PER_PAGE: 10
};

// État global de l'application
let AppState = {
    user: null,
    currentPage: 1,
    filters: {},
    notifications: []
};

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadUserData();
});

function initializeApp() {
    // Initialiser les composants communs
    initNavigation();
    initNotifications();
    initModals();
    
    // Vérifier l'authentification
    checkAuth();
}

// Gestion de l'authentification
function checkAuth() {
    const protectedPages = ['manager', 'coursier', 'pharmacien'];
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
    
    if (protectedPages.includes(currentPage) && !AppState.user) {
        window.location.href = '../index.html';
        return;
    }
}

// Gestion de la navigation
function initNavigation() {
    // Navigation mobile
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.dashboard-sidebar');
    
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
    
    // Navigation active
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.dashboard-nav a');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
}

// Gestion des notifications
function initNotifications() {
    const notificationBell = document.querySelector('.notification-bell');
    const notificationPanel = document.querySelector('.notification-panel');
    
    if (notificationBell && notificationPanel) {
        notificationBell.addEventListener('click', () => {
            notificationPanel.classList.toggle('show');
            markNotificationsAsRead();
        });
    }
    
    // Charger les notifications
    loadNotifications();
}

async function loadNotifications() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/notifications`);
        const notifications = await response.json();
        AppState.notifications = notifications;
        updateNotificationBadge();
    } catch (error) {
        console.error('Erreur lors du chargement des notifications:', error);
    }
}

function updateNotificationBadge() {
    const unreadCount = AppState.notifications.filter(n => !n.read).length;
    const badge = document.querySelector('.notification-badge');
    
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

function markNotificationsAsRead() {
    AppState.notifications.forEach(notification => {
        notification.read = true;
    });
    updateNotificationBadge();
}

// Gestion des modales
function initModals() {
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.modal-close, .btn-cancel');
    
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
    
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Gestion des données utilisateur
async function loadUserData() {
    const userData = localStorage.getItem('user');
    if (userData) {
        AppState.user = JSON.parse(userData);
        updateUserInterface();
    }
}

function updateUserInterface() {
    const userElements = document.querySelectorAll('.user-name, .user-role');
    
    userElements.forEach(element => {
        if (element.classList.contains('user-name') && AppState.user) {
            element.textContent = AppState.user.name;
        }
        if (element.classList.contains('user-role') && AppState.user) {
            element.textContent = AppState.user.role;
        }
    });
}

// Gestion des données
async function fetchData(endpoint, params = {}) {
    try {
        const queryString = new URLSearchParams(params).toString();
        const url = `${CONFIG.API_BASE_URL}/${endpoint}${queryString ? `?${queryString}` : ''}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Erreur lors de la récupération des données (${endpoint}):`, error);
        showToast('Erreur de connexion au serveur', 'error');
        return null;
    }
}

async function postData(endpoint, data) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Erreur lors de l'envoi des données (${endpoint}):`, error);
        showToast('Erreur de connexion au serveur', 'error');
        return null;
    }
}

// Utilitaires
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${getToastIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close">&times;</button>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    toast.querySelector('.toast-close').addEventListener('click', () => {
        hideToast(toast);
    });
    
    setTimeout(() => {
        hideToast(toast);
    }, 5000);
}

function hideToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
        toast.remove();
    }, 300);
}

function getToastIcon(type) {
    switch(type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

// Pagination
function setupPagination(totalItems, itemsPerPage = CONFIG.ITEMS_PER_PAGE) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginationContainer = document.querySelector('.pagination');
    
    if (!paginationContainer || totalPages <= 1) return;
    
    let html = '';
    
    // Bouton précédent
    html += `<button class="page-btn ${AppState.currentPage === 1 ? 'disabled' : ''}" 
              onclick="changePage(${AppState.currentPage - 1})" ${AppState.currentPage === 1 ? 'disabled' : ''}>
              <i class="fas fa-chevron-left"></i>
            </button>`;
    
    // Pages
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= AppState.currentPage - 2 && i <= AppState.currentPage + 2)) {
            html += `<button class="page-btn ${i === AppState.currentPage ? 'active' : ''}" 
                      onclick="changePage(${i})">${i}</button>`;
        } else if (i === AppState.currentPage - 3 || i === AppState.currentPage + 3) {
            html += '<span class="page-dots">...</span>';
        }
    }
    
    // Bouton suivant
    html += `<button class="page-btn ${AppState.currentPage === totalPages ? 'disabled' : ''}" 
              onclick="changePage(${AppState.currentPage + 1})" ${AppState.currentPage === totalPages ? 'disabled' : ''}>
              <i class="fas fa-chevron-right"></i>
            </button>`;
    
    paginationContainer.innerHTML = html;
}

function changePage(page) {
    if (page < 1 || page > Math.ceil(AppState.totalItems / CONFIG.ITEMS_PER_PAGE)) return;
    
    AppState.currentPage = page;
    // Recharger les données avec la nouvelle page
    loadTableData();
}

// Exportation des fonctions globales
window.showModal = showModal;
window.closeModal = closeModal;
window.changePage = changePage;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;

// Styles pour les toasts
const toastStyles = document.createElement('style');
toastStyles.textContent = `
.toast {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 300px;
    transform: translateX(150%);
    transition: transform 0.3s ease;
    z-index: 10000;
}

.toast.show {
    transform: translateX(0);
}

.toast-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.toast i {
    font-size: 1.25rem;
}

.toast-success i { color: #2ecc71; }
.toast-error i { color: #e74c3c; }
.toast-warning i { color: #f39c12; }
.toast-info i { color: #3498db; }

.toast-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #7f8c8d;
    cursor: pointer;
    padding: 0;
    margin-left: 1rem;
}

.toast-close:hover {
    color: #2c3e50;
}
`;
document.head.appendChild(toastStyles);