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
            iconCreateFunction: this.createClusterIcon,
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
        const size = count < 10 ? 'small' : count < 50 ? 'medium' : 'large';
        
        return L.divIcon({
            html: `<div class="cluster-icon cluster-${size}">${count}</div>`,
            className: 'memory-cluster',
            iconSize: L.point(40, 40)
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