class UIManager {
    constructor(app) {
        this.app = app;
        this.currentTab = 'map-section'; // Imposta la mappa come tab predefinito
        this.deferredPrompt = null;
        this.currentLayout = 'vertical'; // 'vertical' or 'horizontal'
    }

    init() {
        this.setupTabNavigation();
        this.createFloatingHearts();
        this.setupCancelEditButton();
        this.setupImportExportButtons();
        this.setupLayoutToggle();
        this.setupStatsButton(); // Ora contiene la logica corretta
        this.setupListControls();

        // Load initial layout preference
        const savedLayout = localStorage.getItem('memoryLayout') || 'vertical';
        this.currentLayout = savedLayout;
        this.applyLayout(savedLayout, false); // Don't re-render during init
    }

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
        this.applyLayout(layout, true); // Re-render when switching layouts
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

    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-button');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });

        // Assicurati che il tab iniziale sia attivo
        this.switchTab(this.currentTab);
    }

    // CORREZIONE: Apre direttamente il tab Statistiche
    setupStatsButton() {
        document.getElementById('profile-stats-btn')?.addEventListener('click', () => {
            this.switchTab('stats-section');
        });
    }

    // Setup Filtro e Ordine
    setupListControls() {
        // Search Filter
        document.getElementById('memory-search')?.addEventListener('input', () => {
            this.renderMemoryList();
        });

        // Sort Control
        document.getElementById('memory-sort')?.addEventListener('change', () => {
            this.renderMemoryList();
        });
    }

    switchTab(tabId) {
        // 1. Logica esistente per attivare/disattivare tab e bottoni
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

        const selectedButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
        if (selectedButton) {
            selectedButton.classList.add('active');
        }

        document.getElementById(tabId).classList.add('active');

        this.currentTab = tabId;

        const profileBtn = document.getElementById('profile-stats-btn');
        if (profileBtn) {
            // Mostra solo sulla mappa
            profileBtn.style.display = (tabId === 'map-section') ? 'block' : 'none';
        }

        // 2. Logica esistente per rendering e resize
        if (tabId === 'memory-list-section') {
            this.renderMemoryList();
        }

        if (tabId === 'map-section' && this.app.mapManager.map) {
            this.app.mapManager.map.invalidateSize();
        }

        if (tabId === 'stats-section') {
            this.renderStats();
        }
    }

    setupImportExportButtons() {
        // Export all memories
        document.getElementById('export-memories')?.addEventListener('click', () => {
            this.exportAllMemories();
        });

        // Import memories
        document.getElementById('import-memories')?.addEventListener('click', () => {
            this.showImportModal();
        });
    }

    handleMapClick(e, mapManager) {
        const locationString = mapManager.setSelectedLocation(e.latlng);
        document.getElementById('memory-location').value = locationString;

        // Se si seleziona una posizione dalla mappa, sposta l'utente al form 
        if (this.currentTab !== 'add-memory-section') {
            this.switchTab('add-memory-section');
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

                // Torna al tab Mappa dopo l'annullamento dell'editing
                this.switchTab('map-section');
            });
        }
    }

    resetForm(mapManager) {
        const form = document.getElementById('memory-form');
        form.reset();
        form.removeAttribute('data-editing-id');

        mapManager.clearSelection();
        document.getElementById('memory-location').value = '';

        // Reset form title and button (all'interno della sezione #add-memory-section)
        const formTitle = document.querySelector('#add-memory-section h2');
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

            // Dopo il salvataggio, torna alla mappa
            this.switchTab('map-section');
        }, 2000);
    }

    renderMemoryList() {
        const container = document.getElementById('memories-container');
        let memories = this.app.memoryManager.getAllMemories(); // Ottieni i ricordi (già ordinati per data discendente)

        // 1. APPLICA FILTRO TESTUALE
        const searchTerm = document.getElementById('memory-search')?.value.toLowerCase().trim() || '';

        if (searchTerm) {
            memories = memories.filter(memory =>
                memory.title.toLowerCase().includes(searchTerm) ||
                memory.description.toLowerCase().includes(searchTerm)
            );
        }

        // 2. APPLICA ORDINAMENTO
        const sortValue = document.getElementById('memory-sort')?.value || 'date-desc';

        if (sortValue === 'date-asc') {
            memories.sort((a, b) => new Date(a.date) - new Date(b.date));
        } else if (sortValue === 'title-asc') {
            memories.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sortValue === 'date-desc') {
            // Già ordinato di default da getAllMemories, ma lo facciamo per chiarezza
            memories.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        // Apply current layout without triggering re-render
        this.applyLayout(this.currentLayout, false);

        if (memories.length === 0) {
            container.innerHTML = this.getEmptyStateHTML(searchTerm ? 'Nessun ricordo trovato.' : 'Non hai ancora aggiunto ricordi.');
            return;
        }

        container.innerHTML = memories.map(memory => this.createMemoryCardHTML(memory)).join('');
        this.attachMemoryCardEventListeners();
    }

    // Aggiorna la funzione per accettare un messaggio personalizzato
    getEmptyStateHTML(message = 'Non hai ancora aggiunto ricordi.') {
        return `
            <div class="empty-state">
                <i class="fas fa-heart"></i>
                <p>${message}</p>
                <p>Vai alla sezione Mappa per iniziare!</p>
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

        // Switch to the new form section
        this.switchTab('add-memory-section');

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

        // Change form title and button (selezionando all'interno della sezione form)
        const formTitle = document.querySelector('#add-memory-section h2');
        const submitButton = document.querySelector('#memory-form button[type="submit"]');

        formTitle.innerHTML = '<i class="fas fa-edit"></i> Modifica Ricordo';
        submitButton.innerHTML = '<i class="fas fa-save"></i> Aggiorna Ricordo';

        // Show cancel button
        const cancelBtn = document.getElementById('cancel-edit');
        if (cancelBtn) {
            cancelBtn.style.display = 'block';
        }

        // Scroll to form (per sicurezza, se la sidebar è scrollabile)
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
        this.switchTab('map-section');

        const memory = this.app.memoryManager.getMemoryById(memoryId);
        if (memory) {
            this.app.mapManager.focusOnMemory(memory);
        }
    }

    // Render Statistiche
    renderStats() {
        const memories = this.app.memoryManager.getAllMemories();
        const statsContainer = document.getElementById('stats-content');

        // --- Pulsante Info/Aiuto ---
        const infoButtonHTML = `
            <button id="show-info-help" class="btn-small btn-export" 
                    style="margin-bottom: 1.5rem; width: 100%; max-width: 400px; display: block; margin-left: auto; margin-right: auto;">
                <i class="fas fa-question-circle"></i> Come Funziona l'App? (Info & Aiuto)
            </button>
        `;
        // --- Fine Pulsante ---

        if (memories.length === 0) {
            statsContainer.innerHTML = infoButtonHTML + this.getEmptyStateHTML('Nessun dato da visualizzare. Aggiungi i primi ricordi!');
            this.attachStatsEventListeners(); // Collega il listener al pulsante
            return;
        }

        // 1. Totale Ricordi
        const totalMemories = memories.length;
        const oldestMemory = memories[memories.length - 1];
        const oldestDate = this.app.memoryManager.formatDate(oldestMemory.date);

        // Distribuzione per Anno
        const yearDistribution = memories.reduce((acc, memory) => {
            const year = new Date(memory.date).getFullYear();
            acc[year] = (acc[year] || 0) + 1;
            return acc;
        }, {});

        const yearsHtml = Object.entries(yearDistribution)
            .sort(([yearA], [yearB]) => yearB - yearA)
            .map(([year, count]) => `<li><strong>${year}</strong>: ${count} ricordi</li>`).join('');

        // Word Cloud
        const titles = memories.map(m => m.title.toLowerCase().split(/\s+/)).flat();
        const descriptions = memories.map(m => m.description.toLowerCase().split(/\s+/)).flat();
        const allWords = [...titles, ...descriptions];

        const stopWords = new Set(['di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra', 'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'una', 'uno', 'che', 'cosa', 'questo', 'nostro', 'noi', 'mio', 'mia', 'e', 'è', 'del', 'della', 'dei', 'delle', 'al', 'alla', 'agli', 'dalle', 'ci', 'siamo', 'era', 'stato', 'momento', 'ricordo']);

        const wordCounts = allWords.reduce((acc, word) => {
            const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
            if (cleanWord.length > 3 && !stopWords.has(cleanWord)) {
                acc[cleanWord] = (acc[cleanWord] || 0) + 1;
            }
            return acc;
        }, {});

        const topWords = Object.entries(wordCounts)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 20);

        const maxCount = topWords.length > 0 ? topWords[0][1] : 1;

        const wordCloudHtml = topWords.map(([word, count]) => {
            const size = 1 + (count / maxCount) * 1.5;
            const opacity = 0.6 + (count / maxCount) * 0.4;
            const hue = 330;
            const saturation = 70;
            const lightness = 50 + (count / maxCount) * 20;
            const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

            return `<span class="word-tag" style="font-size: ${size}em; opacity: ${opacity}; background: ${color};">${word}</span>`;
        }).join('');

        // Renderizza l'HTML delle Statistiche
        statsContainer.innerHTML = infoButtonHTML + `
            <div class="stats-grid">
                <div class="stat-card">
                    <h4><i class="fas fa-heart"></i> Totale Ricordi Salvati</h4>
                    <p>${totalMemories}</p>
                </div>
                <div class="stat-card">
                    <h4><i class="fas fa-calendar-alt"></i> Ricordo Più Vecchio</h4>
                    <p>${oldestMemory.title}</p>
                    <p style="font-size: 1rem; font-weight: 500;">(${oldestDate})</p>
                </div>
                <div class="stat-card">
                    <h4><i class="fas fa-calendar-check"></i> Anni di Ricordi</h4>
                    <ul style="font-size: 1rem; font-weight: 500;">${yearsHtml}</ul>
                </div>
            </div>
            <div class="word-cloud-container">
                <h4><i class="fas fa-comments"></i> Nuvola delle Parole Chiave</h4>
                <div id="word-cloud">${wordCloudHtml}</div>
            </div>
        `;

        this.attachStatsEventListeners();
    }

    // Funzione per collegare il listener delle Statistiche
    attachStatsEventListeners() {
        document.getElementById('show-info-help')?.addEventListener('click', () => {
            this.showInfoModal();
        });
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
            alert('Per favor, inserisci un codice valido.');
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

    // Modale Info & Aiuto
    showInfoModal() {
        const modalHtml = `
            <div class="import-modal" id="info-modal">
                <div class="import-modal-content">
                    <h3><i class="fas fa-info-circle"></i> Info & Aiuto</h3>
                    
                    <div class="stat-card">
                        <h4><i class="fas fa-map-marker-alt"></i> Selezionare Posizione</h4>
                        <p style="font-size: 1rem; font-weight: 500; color: var(--text-light);">Vai al tab 'Mappa' e <strong>clicca sul punto desiderato</strong> per selezionare la posizione del ricordo. La posizione verrà salvata automaticamente nel form.</p>
                    </div>

                    <div class="stat-card">
                        <h4><i class="fas fa-share-alt"></i> Backup & Condivisione</h4>
                        <p style="font-size: 1rem; font-weight: 500; color: var(--text-light);">Usa 'Esporta' nella sezione 'Ricordi' per creare un codice JSON contenente tutte le tue memorie, utile per backup e condivisione.</p>
                    </div>
                    
                    <div class="stat-card">
                        <h4><i class="fas fa-download"></i> Installazione PWA</h4>
                        <p style="font-size: 1rem; font-weight: 500; color: var(--text-light);">Puoi installare la 'Mappa dei Ricordi' direttamente sul tuo telefono come un'app nativa se vedi il pulsante di installazione.</p>
                    </div>

                    <div class="import-actions">
                        <button id="close-info" class="btn-small">
                            <i class="fas fa-times"></i> Chiudi
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('info-modal')?.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = document.getElementById('info-modal');
        modal.style.display = 'block';

        // Listener per chiudere modale e tornare al tab Statistiche
        document.getElementById('close-info').addEventListener('click', () => {
            modal.remove();
            this.switchTab('stats-section');
        });

        // Chiudi su background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                this.switchTab('stats-section');
            }
        });
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
            bottom: '80px', // Spostato sopra la bottom nav
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