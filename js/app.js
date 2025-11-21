class MemoryMapApp {
    constructor() {
        this.mapManager = new MapManager();
        this.memoryManager = new MemoryManager();
        this.uiManager = new UIManager(this); // Pass app instance to UI manager

        this.init();
    }

    async init() {
        // Initialize components in correct order
        this.mapManager.init();
        this.memoryManager.init();
        this.uiManager.init();

        // Set up event listeners
        this.setupEventListeners();

        // Load existing memories
        this.loadMemories();

        // Initialize PWA
        this.initPWA();
    }

    setupEventListeners() {
        // Memory form submission
        document.getElementById('memory-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleMemorySubmit();
        });

        // Map click for location selection - handle it directly in MapManager
        this.mapManager.setupMapClickHandler((e) => {
            this.uiManager.handleMapClick(e, this.mapManager);
        });
    }

    async handleMemorySubmit() {
        const form = document.getElementById('memory-form');
        const isEditing = form.hasAttribute('data-editing-id');
        const memoryId = isEditing ? parseInt(form.getAttribute('data-editing-id')) : null;

        const formData = this.uiManager.getFormData(this.mapManager);

        if (!formData.location) {
            alert('Per favore, seleziona una posizione sulla mappa.');
            return;
        }

        try {
            let memory;
            if (isEditing) {
                // Update existing memory
                memory = await this.memoryManager.updateMemory(memoryId, formData);
                // Update marker on map
                this.mapManager.updateMemoryOnMap(memory);
            } else {
                // Create new memory
                memory = await this.memoryManager.saveMemory(formData);
                this.mapManager.addMemoryToMap(memory);
            }

            this.uiManager.resetForm(this.mapManager);
            this.uiManager.showSuccessFeedback(isEditing);

        } catch (error) {
            console.error('Error saving memory:', error);
            alert('Errore nel salvare il ricordo. Controlla la console per i dettagli.');
        }
    }

    loadMemories() {
        const memories = this.memoryManager.getAllMemories();
        memories.forEach(memory => {
            this.mapManager.addMemoryToMap(memory);
        });
    }

    initPWA() {
        // Service Worker registration
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('ServiceWorker registrato con successo: ', registration.scope);
                })
                .catch(error => {
                    console.log('Registrazione ServiceWorker fallita: ', error);
                });
        }

        // PWA installation prompt
        this.uiManager.initPWAInstallPrompt();
    }
}

// Make app globally available for event handlers
let app;

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app = new MemoryMapApp();
});