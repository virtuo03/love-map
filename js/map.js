class MapManager {
    constructor() {
        this.map = null;
        this.memoryClustering = null;
        this.selectedLocation = null;
        this.selectionMarker = null;
        this.mapClickHandler = null;
    }

    init() {
        this.initializeMap();
        this.memoryClustering = new MemoryClustering(this.map);
    }

    initializeMap() {
        this.map = L.map('map').setView([41.9028, 12.4964], 5);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(this.map);
    }

    setupMapClickHandler(handler) {
        this.mapClickHandler = handler;
        this.map.on('click', (e) => {
            if (this.mapClickHandler) {
                this.mapClickHandler(e);
            }
        });
    }

    addMemoryToMap(memory) {
        const marker = L.marker(memory.location, {
            icon: L.divIcon({
                className: 'memory-marker',
                html: '<i class="fas fa-heart" style="color: #c2185b; font-size: 24px; text-shadow: 0 0 8px white;"></i>',
                iconSize: [30, 30],
                iconAnchor: [15, 30]
            })
        });

        const popupContent = this.createPopupContent(memory);
        marker.bindPopup(popupContent);

        marker.on('click', function () {
            this.openPopup();
        });

        this.memoryClustering.addMarker(marker, memory.id);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    createPopupContent(memory) {
        let content = `
        <div class="popup-content">
            <h3>${this.escapeHtml(memory.title)}</h3>
            <p class="popup-description">${this.escapeHtml(memory.description)}</p>
    `;

        if (memory.photo) {
            content += `
            <div class="popup-image">
                <img src="${memory.photo}" alt="${this.escapeHtml(memory.title)}">
            </div>
        `;
        }

        content += `
            <p class="popup-date">
                <i class="fas fa-calendar"></i> ${this.formatDate(memory.date)}
            </p>
        </div>
    `;

        return content;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return date.toLocaleDateString('it-IT', options);
    }

    updateMemoryOnMap(memory) {
        // Remove old marker
        this.memoryClustering.removeMarker(memory.id);

        // Add updated marker
        this.addMemoryToMap(memory);
    }

    setSelectedLocation(latlng) {
        this.selectedLocation = latlng;

        // Remove previous selection marker
        if (this.selectionMarker) {
            this.map.removeLayer(this.selectionMarker);
        }

        // Add new selection marker
        this.selectionMarker = L.marker(latlng, {
            icon: L.divIcon({
                className: 'selection-marker',
                html: '<i class="fas fa-heart" style="color: #ff0000; font-size: 20px;"></i>',
                iconSize: [24, 24],
                iconAnchor: [12, 24]
            })
        }).addTo(this.map);

        return `Lat: ${latlng.lat.toFixed(4)}, Lng: ${latlng.lng.toFixed(4)}`;
    }

    getSelectedLocation() {
        return this.selectedLocation;
    }

    clearSelection() {
        this.selectedLocation = null;
        if (this.selectionMarker) {
            this.map.removeLayer(this.selectionMarker);
            this.selectionMarker = null;
        }
    }

    focusOnMemory(memory) {
        this.map.setView(memory.location, 13);

        setTimeout(() => {
            this.memoryClustering.markerClusterGroup.zoomToShowLayer(
                this.memoryClustering.markerClusterGroup.getLayers().find(layer => {
                    const markerData = this.memoryClustering.markers.find(m => m.id === memory.id);
                    return markerData && markerData.marker === layer;
                }),
                () => {
                    const marker = this.memoryClustering.markerClusterGroup.getLayers().find(layer => {
                        const markerData = this.memoryClustering.markers.find(m => m.id === memory.id);
                        return markerData && markerData.marker === layer;
                    });
                    if (marker) {
                        marker.openPopup();
                    }
                }
            );
        }, 500);
    }
}