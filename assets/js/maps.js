// assets/js/maps.js

// Gestion des cartes interactives
class MedicalMap {
    constructor(mapElementId, options = {}) {
        this.mapElement = document.getElementById(mapElementId);
        this.map = null;
        this.markers = [];
        this.directionsService = null;
        this.directionsRenderer = null;
        this.options = {
            zoom: 12,
            center: { lat: 48.8566, lng: 2.3522 }, // Paris par défaut
            ...options
        };
        
        this.init();
    }
    
    async init() {
        if (!this.mapElement) {
            console.error('Élément de carte non trouvé');
            return;
        }
        
        // Charger l'API Google Maps
        await this.loadGoogleMapsAPI();
        
        // Initialiser la carte
        this.map = new google.maps.Map(this.mapElement, {
            zoom: this.options.zoom,
            center: this.options.center,
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            styles: this.getMapStyle()
        });
        
        // Initialiser les services
        this.directionsService = new google.maps.DirectionsService();
        this.directionsRenderer = new google.maps.DirectionsRenderer();
        this.directionsRenderer.setMap(this.map);
        
        // Configurer les événements
        this.setupEvents();
        
        // Charger les données initiales
        this.loadInitialData();
    }
    
    async loadGoogleMapsAPI() {
        return new Promise((resolve, reject) => {
            if (window.google && window.google.maps) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${CONFIG.MAPS_API_KEY}&libraries=places`;
            script.async = true;
            script.defer = true;
            
            script.onload = resolve;
            script.onerror = reject;
            
            document.head.appendChild(script);
        });
    }
    
    getMapStyle() {
        return [
            {
                "featureType": "all",
                "elementType": "geometry",
                "stylers": [{"color": "#f5f5f5"}]
            },
            {
                "featureType": "all",
                "elementType": "labels.text.fill",
                "stylers": [{"gamma": 0.01}, {"lightness": 20}]
            },
            {
                "featureType": "all",
                "elementType": "labels.text.stroke",
                "stylers": [{"visibility": "off"}]
            },
            {
                "featureType": "all",
                "elementType": "labels.icon",
                "stylers": [{"visibility": "off"}]
            },
            {
                "featureType": "administrative",
                "elementType": "geometry",
                "stylers": [{"visibility": "on"}]
            },
            {
                "featureType": "landscape",
                "elementType": "geometry",
                "stylers": [{"lightness": "0"}, {"saturation": "0"}, {"color": "#f5f5f5"}]
            },
            {
                "featureType": "poi",
                "elementType": "geometry",
                "stylers": [{"color": "#ebebeb"}]
            },
            {
                "featureType": "road",
                "elementType": "geometry",
                "stylers": [{"color": "#ffffff"}]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry",
                "stylers": [{"color": "#d8d8d8"}]
            },
            {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [{"color": "#d4e6f4"}]
            }
        ];
    }
    
    setupEvents() {
        // Recentrer la carte sur la position de l'utilisateur
        const locateBtn = document.querySelector('.btn-locate');
        if (locateBtn) {
            locateBtn.addEventListener('click', () => {
                this.locateUser();
            });
        }
        
        // Recherche d'adresse
        const searchInput = document.querySelector('.map-search');
        if (searchInput) {
            const searchBox = new google.maps.places.SearchBox(searchInput);
            
            searchBox.addListener('places_changed', () => {
                const places = searchBox.getPlaces();
                if (places.length === 0) return;
                
                const place = places[0];
                this.map.setCenter(place.geometry.location);
                this.map.setZoom(15);
            });
        }
    }
    
    async loadInitialData() {
        // Charger les pharmacies
        await this.loadPharmacies();
        
        // Charger les laboratoires
        await this.loadLaboratories();
        
        // Charger les coursiers en temps réel
        await this.loadCouriers();
        
        // Mettre à jour périodiquement les positions
        this.startRealTimeUpdates();
    }
    
    async loadPharmacies() {
        try {
            const response = await fetch('../data/pharmacies.json');
            const pharmacies = await response.json();
            
            pharmacies.forEach(pharmacy => {
                this.addMarker({
                    position: { lat: pharmacy.latitude, lng: pharmacy.longitude },
                    title: pharmacy.nom,
                    type: 'pharmacy',
                    data: pharmacy,
                    icon: this.getMarkerIcon('pharmacy')
                });
            });
        } catch (error) {
            console.error('Erreur lors du chargement des pharmacies:', error);
        }
    }
    
    async loadLaboratories() {
        try {
            const response = await fetch('../data/laboratories.json');
            const laboratories = await response.json();
            
            laboratories.forEach(lab => {
                this.addMarker({
                    position: { lat: lab.latitude, lng: lab.longitude },
                    title: lab.nom,
                    type: 'laboratory',
                    data: lab,
                    icon: this.getMarkerIcon('laboratory')
                });
            });
        } catch (error) {
            console.error('Erreur lors du chargement des laboratoires:', error);
        }
    }
    
    async loadCouriers() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/couriers/locations`);
            const couriers = await response.json();
            
            couriers.forEach(courier => {
                this.addMarker({
                    position: { lat: courier.latitude, lng: courier.longitude },
                    title: `Coursier ${courier.name}`,
                    type: 'courier',
                    data: courier,
                    icon: this.getMarkerIcon('courier'),
                    animation: google.maps.Animation.DROP
                });
            });
        } catch (error) {
            console.error('Erreur lors du chargement des coursiers:', error);
        }
    }
    
    addMarker(options) {
        const marker = new google.maps.Marker({
            position: options.position,
            map: this.map,
            title: options.title,
            icon: options.icon,
            animation: options.animation
        });
        
        // Info window
        const infoWindow = new google.maps.InfoWindow({
            content: this.getInfoWindowContent(options)
        });
        
        marker.addListener('click', () => {
            infoWindow.open(this.map, marker);
        });
        
        this.markers.push({
            marker: marker,
            type: options.type,
            data: options.data,
            infoWindow: infoWindow
        });
        
        return marker;
    }
    
    getMarkerIcon(type) {
        const icons = {
            pharmacy: {
                url: 'assets/images/icons/pharmacy.png',
                scaledSize: new google.maps.Size(40, 40)
            },
            laboratory: {
                url: 'assets/images/icons/laboratory.png',
                scaledSize: new google.maps.Size(40, 40)
            },
            courier: {
                url: 'assets/images/icons/courier.png',
                scaledSize: new google.maps.Size(30, 30)
            },
            patient: {
                url: 'assets/images/icons/patient.png',
                scaledSize: new google.maps.Size(40, 40)
            },
            hospital: {
                url: 'assets/images/icons/hospital.png',
                scaledSize: new google.maps.Size(50, 50)
            }
        };
        
        return icons[type] || null;
    }
    
    getInfoWindowContent(options) {
        let content = `<div class="map-info-window">`;
        content += `<h4>${options.title}</h4>`;
        
        if (options.data) {
            if (options.data.adresse) {
                content += `<p><i class="fas fa-map-marker-alt"></i> ${options.data.adresse}</p>`;
            }
            if (options.data.telephone) {
                content += `<p><i class="fas fa-phone"></i> ${options.data.telephone}</p>`;
            }
            if (options.data.horaires) {
                content += `<p><i class="fas fa-clock"></i> ${options.data.horaires}</p>`;
            }
            
            if (options.type === 'pharmacy') {
                content += `<button onclick="orderFromPharmacy('${options.data.id}')" class="btn btn-sm btn-primary">Commander</button>`;
            } else if (options.type === 'laboratory') {
                content += `<button onclick="scheduleExam('${options.data.id}')" class="btn btn-sm btn-primary">Prendre RDV</button>`;
            }
        }
        
        content += `</div>`;
        return content;
    }
    
    async calculateRoute(origin, destination, waypoints = []) {
        const request = {
            origin: origin,
            destination: destination,
            waypoints: waypoints.map(wp => ({ location: wp, stopover: true })),
            travelMode: google.maps.TravelMode.DRIVING,
            optimizeWaypoints: true,
            provideRouteAlternatives: false
        };
        
        try {
            const response = await this.directionsService.route(request);
            this.directionsRenderer.setDirections(response);
            
            // Afficher les informations d'itinéraire
            this.displayRouteInfo(response);
            
            return response;
        } catch (error) {
            console.error('Erreur lors du calcul de l\'itinéraire:', error);
            showToast('Impossible de calculer l\'itinéraire', 'error');
            return null;
        }
    }
    
    displayRouteInfo(response) {
        const route = response.routes[0];
        const summaryPanel = document.getElementById('route-summary');
        
        if (!summaryPanel) return;
        
        let html = '<div class="route-info">';
        html += `<h5>Itinéraire (${route.legs[0].distance.text} - ${route.legs[0].duration.text})</h5>`;
        
        route.legs.forEach((leg, index) => {
            html += `<div class="route-leg">`;
            html += `<strong>Étape ${index + 1}:</strong> ${leg.start_address} → ${leg.end_address}<br>`;
            html += `<small>Distance: ${leg.distance.text} | Durée: ${leg.duration.text}</small>`;
            html += `</div>`;
        });
        
        html += '</div>';
        summaryPanel.innerHTML = html;
    }
    
    locateUser() {
        if (!navigator.geolocation) {
            showToast('La géolocalisation n\'est pas supportée par votre navigateur', 'error');
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                this.map.setCenter(userLocation);
                this.map.setZoom(15);
                
                // Ajouter un marqueur pour la position de l'utilisateur
                this.addMarker({
                    position: userLocation,
                    title: 'Votre position',
                    type: 'patient',
                    icon: this.getMarkerIcon('patient')
                });
                
                showToast('Position détectée avec succès', 'success');
            },
            (error) => {
                console.error('Erreur de géolocalisation:', error);
                showToast('Impossible de déterminer votre position', 'error');
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    }
    
    filterMarkers(type) {
        this.markers.forEach(markerObj => {
            if (type === 'all' || markerObj.type === type) {
                markerObj.marker.setMap(this.map);
            } else {
                markerObj.marker.setMap(null);
            }
        });
    }
    
    clearMarkers() {
        this.markers.forEach(markerObj => {
            markerObj.marker.setMap(null);
        });
        this.markers = [];
    }
    
    startRealTimeUpdates() {
        // Mettre à jour les positions des coursiers toutes les 30 secondes
        setInterval(async () => {
            await this.updateCourierPositions();
        }, 30000);
    }
    
    async updateCourierPositions() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/couriers/locations`);
            const couriers = await response.json();
            
            // Supprimer les anciens marqueurs de coursiers
            this.markers = this.markers.filter(markerObj => {
                if (markerObj.type === 'courier') {
                    markerObj.marker.setMap(null);
                    return false;
                }
                return true;
            });
            
            // Ajouter les nouveaux marqueurs
            couriers.forEach(courier => {
                this.addMarker({
                    position: { lat: courier.latitude, lng: courier.longitude },
                    title: `Coursier ${courier.name}`,
                    type: 'courier',
                    data: courier,
                    icon: this.getMarkerIcon('courier')
                });
            });
        } catch (error) {
            console.error('Erreur lors de la mise à jour des coursiers:', error);
        }
    }
    
    async findNearest(type, location) {
        let nearest = null;
        let minDistance = Infinity;
        
        const relevantMarkers = this.markers.filter(m => m.type === type);
        
        for (const markerObj of relevantMarkers) {
            const distance = this.calculateDistance(
                location,
                markerObj.marker.getPosition().toJSON()
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                nearest = markerObj;
            }
        }
        
        return nearest;
    }
    
    calculateDistance(point1, point2) {
        const R = 6371; // Rayon de la Terre en km
        const dLat = this.deg2rad(point2.lat - point1.lat);
        const dLon = this.deg2rad(point2.lng - point1.lng);
        
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(point1.lat)) * Math.cos(this.deg2rad(point2.lat)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    deg2rad(deg) {
        return deg * (Math.PI/180);
    }
}

// Fonctions globales pour l'interface
function orderFromPharmacy(pharmacyId) {
    showModal('order-modal');
    document.getElementById('selected-pharmacy').value = pharmacyId;
}

function scheduleExam(labId) {
    showModal('appointment-modal');
    document.getElementById('selected-lab').value = labId;
}

// Initialisation de la carte
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser la carte principale si l'élément existe
    const mainMapElement = document.getElementById('main-map');
    if (mainMapElement) {
        window.mainMap = new MedicalMap('main-map', {
            zoom: 13,
            center: { lat: 48.8566, lng: 2.3522 }
        });
    }
    
    // Initialiser les mini-cartes
    const miniMaps = document.querySelectorAll('.mini-map');
    miniMaps.forEach((mapElement, index) => {
        if (mapElement.id) {
            const miniMap = new google.maps.Map(mapElement, {
                zoom: 15,
                center: { lat: 48.8566, lng: 2.3522 },
                disableDefaultUI: true,
                zoomControl: false,
                draggable: false
            });
            
            new google.maps.Marker({
                position: { lat: 48.8566, lng: 2.3522 },
                map: miniMap,
                title: 'Location'
            });
        }
    });
    
    // Gestion des filtres de carte
    const filterButtons = document.querySelectorAll('.map-filter');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            
            // Mettre à jour l'état actif
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filtrer les marqueurs
            if (window.mainMap) {
                window.mainMap.filterMarkers(type);
            }
        });
    });
});

// Exportation
window.MedicalMap = MedicalMap;