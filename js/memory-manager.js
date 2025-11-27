class MemoryManager {
    constructor() {
        this.memories = [];
    }

    init() {
        this.loadFromStorage();
    }

    loadFromStorage() {
        this.memories = JSON.parse(localStorage.getItem('memories')) || [];

        // Convert location objects to LatLng
        this.memories.forEach(memory => {
            if (typeof memory.location === 'object' && memory.location.lat && memory.location.lng) {
                memory.location = L.latLng(memory.location.lat, memory.location.lng);
            }
        });
    }

    saveToStorage() {
        localStorage.setItem('memories', JSON.stringify(this.memories));
    }

    async saveMemory(formData) {
        const newMemory = {
            id: Date.now(),
            title: formData.title,
            description: formData.description,
            location: formData.location,
            photo: await this.processPhoto(formData.photoFile),
            date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString()
        };

        this.memories.push(newMemory);
        this.saveToStorage();

        return newMemory;
    }

    async updateMemory(memoryId, formData) {
        const memoryIndex = this.memories.findIndex(memory => memory.id === memoryId);
        if (memoryIndex === -1) {
            throw new Error('Memory not found');
        }

        // Update memory data
        this.memories[memoryIndex] = {
            ...this.memories[memoryIndex],
            title: formData.title,
            description: formData.description,
            location: formData.location,
            photo: await this.processPhoto(formData.photoFile) || this.memories[memoryIndex].photo,
            date: formData.date ? new Date(formData.date).toISOString() : this.memories[memoryIndex].date
        };

        this.saveToStorage();
        console.log('Memory updated:', this.memories[memoryIndex]);

        return this.memories[memoryIndex];
    }

    exportMemories() {
        const exportData = {
            version: "1.0",
            app: "Mappa dei Ricordi",
            memories: this.memories.map(memory => ({
                ...memory,
                location: {
                    lat: memory.location.lat,
                    lng: memory.location.lng
                }
            }))
        };
        
        return JSON.stringify(exportData, null, 2);
    }

    // Export a single memory
    exportMemory(memoryId) {
        const memory = this.getMemoryById(memoryId);
        if (!memory) return null;

        const exportData = {
            version: "1.0",
            app: "Mappa dei Ricordi",
            memory: {
                ...memory,
                location: {
                    lat: memory.location.lat,
                    lng: memory.location.lng
                }
            }
        };
        
        return JSON.stringify(exportData, null, 2);
    }

    // Import memories from JSON string - FIXED: Preserve original IDs
    importMemories(jsonString) {
        try {
            const importData = JSON.parse(jsonString);
            
            if (!importData.memories && !importData.memory) {
                throw new Error("Formato dati non valido");
            }

            const memoriesToImport = importData.memories || [importData.memory];
            const importedMemories = [];

            memoriesToImport.forEach(memoryData => {
                // Validate required fields
                if (!memoryData.title || !memoryData.location) {
                    console.warn('Memory skipped - missing required fields:', memoryData);
                    return;
                }

                // Check if memory already exists to avoid duplicates
                if (this.memoryExists(memoryData)) {
                    console.log('Memory already exists, skipping:', memoryData.title);
                    return;
                }

                // Preserve original ID if available, otherwise create new one
                const memoryId = memoryData.id && !this.getMemoryById(memoryData.id) 
                    ? memoryData.id 
                    : Date.now() + Math.random();

                // Create new memory with imported data
                const newMemory = {
                    id: memoryId,
                    title: memoryData.title,
                    description: memoryData.description || '',
                    location: L.latLng(memoryData.location.lat, memoryData.location.lng),
                    photo: memoryData.photo || null,
                    date: memoryData.date || new Date().toISOString()
                };

                this.memories.push(newMemory);
                importedMemories.push(newMemory);
            });

            this.saveToStorage();
            return importedMemories;

        } catch (error) {
            console.error('Error importing memories:', error);
            throw new Error('Errore nell\'importare i ricordi: ' + error.message);
        }
    }

    // Check if memory already exists (to avoid duplicates)
    memoryExists(memoryToCheck) {
        return this.memories.some(memory => 
            memory.id === memoryToCheck.id || (
                memory.title === memoryToCheck.title &&
                memory.location.lat === memoryToCheck.location.lat &&
                memory.location.lng === memoryToCheck.location.lng &&
                memory.date === memoryToCheck.date
            )
        );
    }

    async processPhoto(photoFile) {
        if (!photoFile) return null;

        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(photoFile);
        });
    }

    getAllMemories() {
        return [...this.memories].sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    getMemoryById(id) {
        return this.memories.find(memory => memory.id === id);
    }

    deleteMemory(id) {
        this.memories = this.memories.filter(memory => memory.id !== id);
        this.saveToStorage();
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return date.toLocaleDateString('it-IT', options);
    }
}