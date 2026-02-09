// Configuration dynamique en fonction de l'environnement
const CONFIG = {
    // API URL - change automatiquement selon l'environnement
    API_BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:4000/api'
        : `https://${window.location.hostname.replace('laboratoire-frontend', 'laboratoire-backend')}.onrender.com/api`,
    
    // Socket.IO URL
    SOCKET_URL: window.location.hostname === 'localhost'
        ? 'http://localhost:4000'
        : `https://${window.location.hostname.replace('laboratoire-frontend', 'laboratoire-backend')}.onrender.com`,
    
    MAPS_API_KEY: 'YOUR_GOOGLE_MAPS_API_KEY',
    ITEMS_PER_PAGE: 10
};

// Export pour utilisation dans d'autres fichiers
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
