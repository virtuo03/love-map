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