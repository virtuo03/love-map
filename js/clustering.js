// clustering.js
// Gestione del clustering per i marker sulla mappa

class MemoryClustering {
    constructor(map) {
        this.map = map;
        this.markers = [];
        this.markerClusterGroup = null;
        this.initializeClusterGroup();
    }

    // Inizializza il gruppo di clustering
    initializeClusterGroup() {
        this.markerClusterGroup = L.markerClusterGroup({
            chunkedLoading: true,
            iconCreateFunction: (cluster) => this.createClusterIcon(cluster),
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            maxClusterRadius: 40
        });

        // Aggiungi il gruppo di clustering alla mappa
        this.map.addLayer(this.markerClusterGroup);
    }

    // Crea un'icona personalizzata per i cluster
    createClusterIcon(cluster) {
        const count = cluster.getChildCount();
        let size, fontSize, heartSize;
        
        if (count < 10) {
            size = 'small';
            fontSize = '14px';
            heartSize = '20px';
        } else if (count < 50) {
            size = 'medium';
            fontSize = '16px';
            heartSize = '24px';
        } else {
            size = 'large';
            fontSize = '18px';
            heartSize = '28px';
        }
        
        // Create a custom cluster icon with heart
        return L.divIcon({
            html: `
                <div class="heart-cluster heart-cluster-${size}">
                    <i class="fas fa-heart"></i>
                    <span class="cluster-count">${count}</span>
                </div>
            `,
            className: `heart-cluster-icon heart-cluster-${size}`,
            iconSize: L.point(40, 40),
            iconAnchor: [20, 20]
        });
    }

    // Aggiungi un marker al gruppo di clustering
    addMarker(marker, memoryId) {
        this.markers.push({ id: memoryId, marker: marker });
        this.markerClusterGroup.addLayer(marker);
    }

    // Rimuovi un marker dal gruppo di clustering
    removeMarker(memoryId) {
        const markerIndex = this.markers.findIndex(m => m.id === memoryId);
        if (markerIndex !== -1) {
            this.markerClusterGroup.removeLayer(this.markers[markerIndex].marker);
            this.markers.splice(markerIndex, 1);
        }
    }

    // Pulisci tutti i marker
    clearAllMarkers() {
        this.markerClusterGroup.clearLayers();
        this.markers = [];
    }

    // Aggiorna il clustering (utile dopo modifiche)
    refresh() {
        this.markerClusterGroup.refreshClusters();
    }

    // Trova un marker per ID
    findMarker(memoryId) {
        return this.markers.find(m => m.id === memoryId);
    }
}