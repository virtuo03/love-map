class UIManager {
    constructor(app) {
        this.app = app;
        this.currentTab = 'map-section';
        this.deferredPrompt = null;
        this.currentLayout = 'vertical';
        this.isFormOpen = false;
        this.isMemoryListOpen = false;
    }

    init() {
        this.setupBottomNavigation();
        this.setupFloatingActionButton();
        this.createFloatingHearts();
        this.setupCancelEditButton();
        this.setupImportExportButtons();
        this.setupLayoutToggle();
        this.setupCloseButtons();
        
        // Load initial layout preference
        const savedLayout = localStorage.getItem('memoryLayout') || 'vertical';
        this.currentLayout = savedLayout;
        this.applyLayout(savedLayout, false);
    }

    setupBottomNavigation() {
        const mapBtn = document.querySelector('[data-tab="map-section"]');
        const memoriesBtn = document.getElementById('nav-memories');
        const addBtn = document.getElementById('nav-add');

        // Map button - always shows map
        mapBtn.addEventListener('click', () => {
            this.closeAllOverlays();
            this.updateActiveNav(mapBtn);
        });

        // Memories button - shows memory list overlay
        memoriesBtn.addEventListener('click', () => {
            this.toggleMemoryListOverlay();
            this.updateActiveNav(memoriesBtn);
        });

        // Add button - shows form overlay
        addBtn.addEventListener('click', () => {
            this.toggleMemoryFormOverlay();
            this.updateActiveNav(addBtn);
        });
    }

    updateActiveNav(activeButton) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeButton.classList.add('active');
    }

    setupFloatingActionButton() {
        const fab = document.getElementById('fab-add-memory');
        fab.addEventListener('click', () => {
            this.toggleMemoryFormOverlay();
            this.updateActiveNav(document.getElementById('nav-add'));
        });
    }

    toggleMemoryFormOverlay() {
        const sidebar = document.getElementById('memory-form-sidebar');
        const memoryListOverlay = document.getElementById('memory-list-overlay');
        
        if (this.isFormOpen) {
            sidebar.classList.remove('active');
            this.isFormOpen = false;
            this.updateActiveNav(document.querySelector('[data-tab="map-section"]'));
        } else {
            // Close memory list if open
            if (this.isMemoryListOpen) {
                memoryListOverlay.classList.remove('active');
                this.isMemoryListOpen = false;
            }
            
            sidebar.classList.add('active');
            this.isFormOpen = true;
            this.resetForm(this.app.mapManager);
        }
    }

    toggleMemoryListOverlay() {
        const sidebar = document.getElementById('memory-form-sidebar');
        const memoryListOverlay = document.getElementById('memory-list-overlay');
        
        if (this.isMemoryListOpen) {
            memoryListOverlay.classList.remove('active');
            this.isMemoryListOpen = false;
            this.updateActiveNav(document.querySelector('[data-tab="map-section"]'));
        } else {
            // Close form if open
            if (this.isFormOpen) {
                sidebar.classList.remove('active');
                this.isFormOpen = false;
            }
            
            memoryListOverlay.classList.add('active');
            this.isMemoryListOpen = true;
            this.renderMemoryList();
        }
    }

    closeAllOverlays() {
        const sidebar = document.getElementById('memory-form-sidebar');
        const memoryListOverlay = document.getElementById('memory-list-overlay');
        
        sidebar.classList.remove('active');
        memoryListOverlay.classList.remove('active');
        this.isFormOpen = false;
        this.isMemoryListOpen = false;
    }

    setupCloseButtons() {
        document.getElementById('close-sidebar').addEventListener('click', () => {
            this.toggleMemoryFormOverlay();
        });
        
        document.getElementById('close-memory-list').addEventListener('click', () => {
            this.toggleMemoryListOverlay();
        });
    }

    // ... [rest of the UIManager class remains the same, including:]

    setupLayoutToggle() {
        const verticalBtn = document.getElementById('layout-vertical');
        const horizontalBtn = document.getElementById('layout-horizontal');

        if (verticalBtn && horizontalBtn) {
            verticalBtn.addEventListener('click', () => this.switchLayout('vertical'));
            horizontalBtn.addEventListener('click', () => this.switchLayout('horizontal'));
        }
    }

    switchLayout(layout) {
        this.currentLayout = layout;
        this.applyLayout(layout, true);
    }

    applyLayout(layout, shouldRender = true) {
        const container = document.getElementById('memories-container');
        
        // Update layout classes
        container.classList.remove('vertical-layout', 'horizontal-layout');
        container.classList.add(layout + '-layout');

        // Update active button states
        document.querySelectorAll('.layout-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.getElementById(`layout-${layout}`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // Save preference to localStorage
        localStorage.setItem('memoryLayout', layout);
        
        // Re-render the memory list with the new layout if requested
        if (shouldRender) {
            this.renderMemoryList();
        }
    }

    handleMapClick(e, mapManager) {
        const locationString = mapManager.setSelectedLocation(e.latlng);
        document.getElementById('memory-location').value = locationString;
        
        // Open form if it's not already open
        if (!this.isFormOpen) {
            this.toggleMemoryFormOverlay();
        }
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
        const formTitle = document.querySelector('#memory-form-sidebar h2');
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

        // Apply current layout without triggering re-render
        this.applyLayout(this.currentLayout, false);

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
                <p>Clicca sul pulsante "+" per iniziare!</p>
            </div>
        `;
    }

    createMemoryCardHTML(memory) {
        const imageContent = memory.photo ?
            `<img src="${memory.photo}" alt="${memory.title}">` :
            `<div class="placeholder"><i class="fas fa-heart"></i></div>`;

        if (this.currentLayout === 'horizontal') {
            return this.createHorizontalCardHTML(memory, imageContent);
        } else {
            return this.createVerticalCardHTML(memory, imageContent);
        }
    }

    createVerticalCardHTML(memory, imageContent) {
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
                <button class="btn-small btn-share" data-id="${memory.id}">
                    <i class="fas fa-share"></i> Condividi
                </button>
                <button class="btn-small btn-view-on-map" data-id="${memory.id}">
                    <i class="fas fa-map-marked-alt"></i> Mappa
                </button>
                <button class="btn-small btn-delete" data-id="${memory.id}">
                    <i class="fas fa-trash"></i> Elimina
                </button>
            </div>
        </div>
    </div>
    `;
    }

    createHorizontalCardHTML(memory, imageContent) {
        return `
    <div class="memory-card" data-id="${memory.id}">
        <div class="memory-image">${imageContent}</div>
        <div class="memory-content">
            <div class="memory-title">${memory.title}</div>
            <div class="memory-desc">${memory.description}</div>
            <div class="memory-meta">
                <div class="memory-date"><i class="fas fa-calendar"></i> ${this.app.memoryManager.formatDate(memory.date)}</div>
                <div class="memory-location"><i class="fas fa-map-marker-alt"></i> Mappa</div>
            </div>
        </div>
        <div class="memory-actions">
            <button class="btn-small btn-edit" data-id="${memory.id}" title="Modifica">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn-small btn-share" data-id="${memory.id}" title="Condividi">
                <i class="fas fa-share"></i>
            </button>
            <button class="btn-small btn-view-on-map" data-id="${memory.id}" title="Mappa">
                <i class="fas fa-map-marked-alt"></i>
            </button>
            <button class="btn-small btn-delete" data-id="${memory.id}" title="Elimina">
                <i class="fas fa-trash"></i>
            </button>
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

        // Close memory list and open form
        this.closeAllOverlays();
        this.toggleMemoryFormOverlay();

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
        const formTitle = document.querySelector('#memory-form-sidebar h2');
        const submitButton = document.querySelector('#memory-form button[type="submit"]');

        formTitle.innerHTML = '<i class="fas fa-edit"></i> Modifica Ricordo';
        submitButton.innerHTML = '<i class="fas fa-save"></i> Aggiorna Ricordo';

        // Show cancel button
        const cancelBtn = document.getElementById('cancel-edit');
        if (cancelBtn) {
            cancelBtn.style.display = 'block';
        }

        // Scroll to top of form
        document.getElementById('memory-form-sidebar').scrollTop = 0;
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

        document.querySelectorAll('.btn-share').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const memoryId = parseInt(btn.getAttribute('data-id'));
                this.shareMemory(memoryId);
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
        // Close memory list
        this.closeAllOverlays();

        const memory = this.app.memoryManager.getMemoryById(memoryId);
        if (memory) {
            this.app.mapManager.focusOnMemory(memory);
        }
    }

    // Export all memories
    exportAllMemories() {
        const exportData = this.app.memoryManager.exportMemories();
        this.showExportModal(exportData, 'Tutti i ricordi');
    }

    // Share single memory
    shareMemory(memoryId) {
        const exportData = this.app.memoryManager.exportMemory(memoryId);
        const memory = this.app.memoryManager.getMemoryById(memoryId);
        this.showExportModal(exportData, memory.title);
    }

    // Show export modal with shareable text
    showExportModal(exportData, title) {
        const modalHtml = `
            <div class="import-modal" id="export-modal">
                <div class="import-modal-content">
                    <h3><i class="fas fa-share-alt"></i> Condividi Ricordo</h3>
                    <p>Condividi questo codice con un amico:</p>
                    <textarea class="import-textarea" readonly>${exportData}</textarea>
                    <div class="import-actions">
                        <button id="copy-export" class="btn-small btn-export">
                            <i class="fas fa-copy"></i> Copia
                        </button>
                        <button id="close-export" class="btn-small">
                            <i class="fas fa-times"></i> Chiudi
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        document.getElementById('export-modal')?.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = document.getElementById('export-modal');
        modal.style.display = 'block';

        // Copy to clipboard functionality
        document.getElementById('copy-export').addEventListener('click', () => {
            const textarea = modal.querySelector('.import-textarea');
            textarea.select();
            document.execCommand('copy');

            // Show success feedback
            const copyBtn = document.getElementById('copy-export');
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copiato!';
            copyBtn.style.background = 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)';

            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.style.background = 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)';
            }, 2000);
        });

        // Close modal
        document.getElementById('close-export').addEventListener('click', () => {
            modal.remove();
        });

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // Show import modal
    showImportModal() {
        const modalHtml = `
            <div class="import-modal" id="import-modal">
                <div class="import-modal-content">
                    <h3><i class="fas fa-download"></i> Importa Ricordi</h3>
                    <p>Incolla qui il codice del ricordo da importare:</p>
                    <textarea class="import-textarea" placeholder="Incolla il codice JSON qui..."></textarea>
                    <div class="import-actions">
                        <button id="confirm-import" class="btn-small btn-import">
                            <i class="fas fa-download"></i> Importa
                        </button>
                        <button id="close-import" class="btn-small">
                            <i class="fas fa-times"></i> Annulla
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        document.getElementById('import-modal')?.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = document.getElementById('import-modal');
        modal.style.display = 'block';

        // Import functionality
        document.getElementById('confirm-import').addEventListener('click', () => {
            this.handleImport();
        });

        // Close modal
        document.getElementById('close-import').addEventListener('click', () => {
            modal.remove();
        });

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', function closeOnEscape(e) {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', closeOnEscape);
            }
        });
    }

    // Handle import process
    async handleImport() {
        const textarea = document.querySelector('#import-modal .import-textarea');
        const importData = textarea.value.trim();

        if (!importData) {
            alert('Per favore, inserisci un codice valido.');
            return;
        }

        try {
            const importedMemories = this.app.memoryManager.importMemories(importData);

            // Close modal
            document.getElementById('import-modal').remove();

            // Show success message
            await Swal.fire({
                title: 'Importazione Completata!',
                html: `Hai importato con successo ${importedMemories.length} ricordo(i).`,
                icon: 'success',
                confirmButtonColor: '#c2185b',
                background: 'var(--card-bg)',
                color: 'var(--text-color)'
            });

            // Refresh the memory list and map
            this.renderMemoryList();
            importedMemories.forEach(memory => {
                this.app.mapManager.addMemoryToMap(memory);
            });

        } catch (error) {
            await Swal.fire({
                title: 'Errore di Importazione',
                text: error.message,
                icon: 'error',
                confirmButtonColor: '#c2185b',
                background: 'var(--card-bg)',
                color: 'var(--text-color)'
            });
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