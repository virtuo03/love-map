class UIManager {
    constructor(app) {
        this.app = app;
        this.currentTab = 'map-section';
        this.deferredPrompt = null;
    }

    init() {
        this.setupTabNavigation();
        this.createFloatingHearts();
        this.setupCancelEditButton();
    }

    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-button');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });
    }

    switchTab(tabId) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

        // Activate selected tab
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        document.getElementById(tabId).classList.add('active');

        this.currentTab = tabId;

        // If switching to memory list, render it
        if (tabId === 'memory-list-section') {
            this.renderMemoryList();
        }
    }

    handleMapClick(e, mapManager) {
        const locationString = mapManager.setSelectedLocation(e.latlng);
        document.getElementById('memory-location').value = locationString;
    }

    getFormData(mapManager) {
        return {
            title: document.getElementById('memory-title').value,
            description: document.getElementById('memory-desc').value,
            date: document.getElementById('memory-date').value,
            location: mapManager.getSelectedLocation(),
            photoFile: document.getElementById('memory-photo').files[0]
        };
    }

    setupCancelEditButton() {
        const cancelBtn = document.getElementById('cancel-edit');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.resetForm(this.app.mapManager);
                cancelBtn.style.display = 'none';
            });
        }
    }

    resetForm(mapManager) {
        const form = document.getElementById('memory-form');
        form.reset();
        form.removeAttribute('data-editing-id');

        mapManager.clearSelection();
        document.getElementById('memory-location').value = '';

        // Reset form title and button
        const formTitle = document.querySelector('.sidebar h2');
        const submitButton = document.querySelector('#memory-form button[type="submit"]');

        formTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Aggiungi un Ricordo';
        submitButton.innerHTML = '<i class="fas fa-save"></i> Salva Ricordo';

        // Hide cancel button
        const cancelBtn = document.getElementById('cancel-edit');
        if (cancelBtn) {
            cancelBtn.style.display = 'none';
        }
    }

    showSuccessFeedback(isEditing = false) {
        const submitBtn = document.querySelector('#memory-form button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        const successText = isEditing ?
            '<i class="fas fa-check"></i> Ricordo Aggiornato!' :
            '<i class="fas fa-check"></i> Ricordo Salvato!';

        submitBtn.innerHTML = successText;
        submitBtn.style.background = 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)';

        setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.style.background = 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)';
        }, 2000);
    }

    renderMemoryList() {
        const container = document.getElementById('memories-container');
        const memories = this.app.memoryManager.getAllMemories();

        if (memories.length === 0) {
            container.innerHTML = this.getEmptyStateHTML();
            return;
        }

        container.innerHTML = memories.map(memory => this.createMemoryCardHTML(memory)).join('');
        this.attachMemoryCardEventListeners();
    }

    getEmptyStateHTML() {
        return `
            <div class="empty-state">
                <i class="fas fa-heart"></i>
                <p>Non hai ancora aggiunto ricordi.</p>
                <p>Vai alla sezione Mappa per iniziare!</p>
            </div>
        `;
    }

    createMemoryCardHTML(memory) {
        const imageContent = memory.photo ?
            `<img src="${memory.photo}" alt="${memory.title}">` :
            `<div class="placeholder"><i class="fas fa-heart"></i></div>`;

        return `
        <div class="memory-card" data-id="${memory.id}">
            <div class="memory-image">${imageContent}</div>
            <div class="memory-content">
                <div class="memory-title"><i class="fas fa-heart"></i> ${memory.title}</div>
                <div class="memory-desc">${memory.description}</div>
                <div class="memory-meta">
                    <div class="memory-date"><i class="fas fa-calendar"></i> ${this.app.memoryManager.formatDate(memory.date)}</div>
                    <div class="memory-location"><i class="fas fa-map-marker-alt"></i> Mappa</div>
                </div>
                <div class="memory-actions">
                    <button class="btn-small btn-edit" data-id="${memory.id}">
                        <i class="fas fa-edit"></i> Modifica
                    </button>
                    <button class="btn-small btn-view-on-map" data-id="${memory.id}">
                        <i class="fas fa-map-marked-alt"></i> Vedi sulla Mappa
                    </button>
                    <button class="btn-small btn-delete" data-id="${memory.id}">
                        <i class="fas fa-trash"></i> Elimina
                    </button>
                </div>
            </div>
        </div>
    `;
    }

    editMemory(memoryId) {
        const memory = this.app.memoryManager.getMemoryById(memoryId);
        if (!memory) {
            console.error('Memory not found:', memoryId);
            return;
        }

        // Switch to map tab
        this.switchTab('map-section');

        // Populate form with memory data
        this.populateEditForm(memory);

        // Focus on the memory location
        this.app.mapManager.focusOnMemory(memory);
    }

    populateEditForm(memory) {
        // Fill form fields with memory data
        document.getElementById('memory-title').value = memory.title;
        document.getElementById('memory-desc').value = memory.description;

        // Format date for input[type="date"]
        const date = new Date(memory.date);
        const formattedDate = date.toISOString().split('T')[0];
        document.getElementById('memory-date').value = formattedDate;

        // Set location
        this.app.mapManager.setSelectedLocation(memory.location);
        document.getElementById('memory-location').value =
            `Lat: ${memory.location.lat.toFixed(4)}, Lng: ${memory.location.lng.toFixed(4)}`;

        // Store the memory ID being edited
        document.getElementById('memory-form').setAttribute('data-editing-id', memory.id);

        // Change form title and button
        const formTitle = document.querySelector('.sidebar h2');
        const submitButton = document.querySelector('#memory-form button[type="submit"]');

        formTitle.innerHTML = '<i class="fas fa-edit"></i> Modifica Ricordo';
        submitButton.innerHTML = '<i class="fas fa-save"></i> Aggiorna Ricordo';

        // Show cancel button
        const cancelBtn = document.getElementById('cancel-edit');
        if (cancelBtn) {
            cancelBtn.style.display = 'block';
        }

        // Scroll to form
        document.querySelector('.sidebar').scrollIntoView({ behavior: 'smooth' });
    }

    attachMemoryCardEventListeners() {
        document.querySelectorAll('.btn-view-on-map').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const memoryId = parseInt(btn.getAttribute('data-id'));
                this.viewMemoryOnMap(memoryId);
            });
        });

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const memoryId = parseInt(btn.getAttribute('data-id'));
                this.editMemory(memoryId);
            });
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const memoryId = parseInt(btn.getAttribute('data-id'));
                this.deleteMemory(memoryId);
            });
        });
    }

    viewMemoryOnMap(memoryId) {
        this.switchTab('map-section');

        const memory = this.app.memoryManager.getMemoryById(memoryId);
        if (memory) {
            this.app.mapManager.focusOnMemory(memory);
        }
    }

    async deleteMemory(memoryId) {
        const memory = this.app.memoryManager.getMemoryById(memoryId);
        const memoryTitle = memory ? memory.title : 'questo ricordo';

        const result = await Swal.fire({
            title: 'Sei sicuro?',
            html: `Stai per eliminare <strong>"${memoryTitle}"</strong>.<br>Questa azione non può essere annullata.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#c2185b',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sì, elimina!',
            cancelButtonText: 'Annulla',
            background: 'var(--card-bg)',
            color: 'var(--text-color)',
            customClass: {
                popup: 'custom-swal-popup',
                title: 'custom-swal-title',
                htmlContainer: 'custom-swal-html',
                confirmButton: 'custom-swal-confirm',
                cancelButton: 'custom-swal-cancel'
            }
        });

        if (result.isConfirmed) {
            this.app.memoryManager.deleteMemory(memoryId);
            this.app.mapManager.memoryClustering.removeMarker(memoryId);
            this.renderMemoryList();

            Swal.fire({
                title: 'Eliminato!',
                text: 'Il ricordo è stato eliminato.',
                icon: 'success',
                confirmButtonColor: '#c2185b',
                background: 'var(--card-bg)',
                color: 'var(--text-color)',
                timer: 2000,
                showConfirmButton: false
            });
        }
    }

    createFloatingHearts() {
        setInterval(() => {
            const heart = document.createElement('div');
            heart.innerHTML = '<i class="fas fa-heart" style="color: #ff80ab;"></i>';
            heart.style.position = 'fixed';
            heart.style.top = '0';
            heart.style.left = Math.random() * window.innerWidth + 'px';
            heart.style.opacity = '0';
            heart.style.fontSize = (Math.random() * 20 + 10) + 'px';
            heart.style.pointerEvents = 'none';
            heart.style.zIndex = '9999';
            document.body.appendChild(heart);

            const animation = heart.animate([
                { top: '0', opacity: 0 },
                { top: '10px', opacity: 0.7 },
                { top: window.innerHeight + 'px', opacity: 0 }
            ], {
                duration: Math.random() * 3000 + 4000,
                easing: 'cubic-bezier(0.250, 0.250, 0.750, 0.750)'
            });

            animation.onfinish = () => heart.remove();
        }, 3000);
    }

    initPWAInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });
    }

    showInstallButton() {
        const installButton = document.createElement('button');
        installButton.innerHTML = '<i class="fas fa-download"></i>';
        installButton.title = 'Installa app';
        Object.assign(installButton.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: '1000',
            background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)'
        });

        installButton.addEventListener('click', () => {
            installButton.style.display = 'none';
            this.deferredPrompt.prompt();
            this.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('Utente ha accettato l\'installazione');
                } else {
                    console.log('Utente ha rifiutato l\'installazione');
                }
                this.deferredPrompt = null;
            });
        });

        document.body.appendChild(installButton);
    }
}