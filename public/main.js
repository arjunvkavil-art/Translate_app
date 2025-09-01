class LiveScreenTranslator {
  constructor() {
    this.ws = null;
    this.stream = null;
    this.video = null;
    this.canvas = null;
    this.ctx = null;
    this.captureInterval = null;
    this.isCapturing = false;
    this.isPaused = false;
    this.currentMode = 'full_screen';
    this.currentProfile = null;
    this.selectedRegion = null;
    this.translationsCount = 0;
    this.startTime = null;
    this.translationHistory = [];
    
    this.initializeElements();
    this.initializeWebSocket();
    this.loadProfiles();
    this.setupEventListeners();
    this.updateStats();
  }

  initializeElements() {
    this.video = document.createElement('video');
    this.video.autoplay = true;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    
    this.overlay = document.getElementById('translation-overlay');
    this.regionSelector = document.getElementById('region-selector');
    this.statusDot = document.getElementById('status-dot');
    this.statusText = document.getElementById('status-text');
    
    // Control buttons
    this.startBtn = document.getElementById('start-capture');
    this.pauseBtn = document.getElementById('pause-capture');
    this.stopBtn = document.getElementById('stop-capture');
    this.selectRegionBtn = document.getElementById('select-region');
    this.clearRegionBtn = document.getElementById('clear-region');
    
    // Settings elements
    this.ocrEngine = document.getElementById('ocr-engine');
    this.translationEngine = document.getElementById('translation-engine');
    this.confidenceThreshold = document.getElementById('confidence-threshold');
    this.confidenceValue = document.getElementById('confidence-value');
    this.updateFrequency = document.getElementById('update-frequency');
    
    // Statistics elements
    this.translationsCountEl = document.getElementById('translations-count');
    this.accuracyRateEl = document.getElementById('accuracy-rate');
    this.uptimeEl = document.getElementById('uptime');
    
    // Mode buttons
    this.modeButtons = document.querySelectorAll('.mode-btn');
    this.regionSection = document.getElementById('region-section');
  }

  initializeWebSocket() {
    this.ws = new WebSocket(`ws://${window.location.host}`);
    
    this.ws.onopen = () => {
      console.log('WebSocket connection established');
      this.updateStatus('Connected', 'success');
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleWebSocketMessage(data);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.updateStatus('Connection Error', 'error');
    };

    this.ws.onclose = () => {
      console.log('WebSocket connection closed');
      this.updateStatus('Disconnected', 'error');
    };
  }

  async loadProfiles() {
    try {
      const response = await fetch('/api/profiles');
      const profiles = await response.json();
      this.renderProfiles(profiles);
    } catch (error) {
      console.error('Failed to load profiles:', error);
    }
  }

  renderProfiles(profiles) {
    const profileGrid = document.getElementById('profile-grid');
    profileGrid.innerHTML = '';

    // Add "None" option
    const noneCard = this.createProfileCard('none', 'No Profile', 'General purpose translation', null);
    noneCard.classList.add('active');
    profileGrid.appendChild(noneCard);

    // Add industrial profiles
    Object.entries(profiles).forEach(([key, profile]) => {
      const card = this.createProfileCard(key, profile.name, profile.description, profile.custom_terms);
      profileGrid.appendChild(card);
    });
  }

  createProfileCard(key, name, description, customTerms) {
    const card = document.createElement('div');
    card.className = 'profile-card';
    card.dataset.profile = key;
    
    card.innerHTML = `
      <h3>${name}</h3>
      <p>${description}</p>
      ${customTerms ? `<div class="profile-badge">${Object.keys(customTerms).length} terms</div>` : ''}
    `;
    
    card.addEventListener('click', () => this.selectProfile(key));
    return card;
  }

  selectProfile(profileKey) {
    // Remove active class from all cards
    document.querySelectorAll('.profile-card').forEach(card => {
      card.classList.remove('active');
    });
    
    // Add active class to selected card
    document.querySelector(`[data-profile="${profileKey}"]`).classList.add('active');
    
    this.currentProfile = profileKey === 'none' ? null : profileKey;
    
    // Send configuration to server
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'config',
        profile: this.currentProfile,
        mode: this.currentMode
      }));
    }
  }

  setupEventListeners() {
    // Mode selection
    this.modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.setMode(btn.dataset.mode);
      });
    });

    // Control buttons
    this.startBtn.addEventListener('click', () => this.startCapture());
    this.pauseBtn.addEventListener('click', () => this.pauseCapture());
    this.stopBtn.addEventListener('click', () => this.stopCapture());
    this.selectRegionBtn.addEventListener('click', () => this.startRegionSelection());
    this.clearRegionBtn.addEventListener('click', () => this.clearRegion());

    // Settings
    this.confidenceThreshold.addEventListener('input', (e) => {
      this.confidenceValue.textContent = `${e.target.value}%`;
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'Enter':
            e.preventDefault();
            if (!this.isCapturing) this.startCapture();
            else this.stopCapture();
            break;
          case ' ':
            e.preventDefault();
            if (this.isCapturing) this.pauseCapture();
            break;
        }
      }
    });
  }

  setMode(mode) {
    this.currentMode = mode;
    
    // Update UI
    this.modeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    // Show/hide region section
    this.regionSection.classList.toggle('hidden', mode !== 'region');
    
    // Send configuration to server
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'config',
        profile: this.currentProfile,
        mode: this.currentMode
      }));
    }
  }

  async startCapture() {
    try {
      this.updateStatus('Starting capture...', 'loading');
      
      if (this.currentMode === 'region' && !this.selectedRegion) {
        alert('Please select a region first');
        return;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false
      });

      this.stream = stream;
      this.video.srcObject = stream;
      
      this.video.onloadedmetadata = () => {
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        
        this.isCapturing = true;
        this.startTime = Date.now();
        this.startCaptureLoop();
        this.updateStatus('Capturing', 'success');
      };

    } catch (error) {
      console.error('Error starting capture:', error);
      this.updateStatus('Capture failed', 'error');
    }
  }

  startCaptureLoop() {
    const frequency = parseInt(this.updateFrequency.value) || 1000;
    
    this.captureInterval = setInterval(() => {
      if (this.isCapturing && !this.isPaused && this.ws.readyState === WebSocket.OPEN) {
        this.captureFrame();
      }
    }, frequency);
  }

  captureFrame() {
    if (!this.video.videoWidth) return;
    
    // Draw video frame to canvas
    this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
    
    // If region mode is active, crop the image
    let imageData;
    if (this.currentMode === 'region' && this.selectedRegion) {
      const { x, y, width, height } = this.selectedRegion;
      const croppedCanvas = document.createElement('canvas');
      const croppedCtx = croppedCanvas.getContext('2d');
      
      croppedCanvas.width = width;
      croppedCanvas.height = height;
      croppedCtx.drawImage(this.canvas, x, y, width, height, 0, 0, width, height);
      
      imageData = croppedCanvas.toDataURL('image/jpeg', 0.8);
    } else {
      imageData = this.canvas.toDataURL('image/jpeg', 0.8);
    }
    
    // Send to server
    this.ws.send(JSON.stringify({
      type: 'ocr_request',
      imageData: imageData,
      region: this.selectedRegion,
      settings: {
        engine: this.ocrEngine.value,
        confidence_threshold: parseInt(this.confidenceThreshold.value) / 100
      }
    }));
  }

  pauseCapture() {
    this.isPaused = !this.isPaused;
    this.pauseBtn.innerHTML = this.isPaused ? 
      '<i class="fas fa-play"></i> Resume' : 
      '<i class="fas fa-pause"></i> Pause';
    this.updateStatus(this.isPaused ? 'Paused' : 'Capturing', this.isPaused ? 'warning' : 'success');
  }

  stopCapture() {
    this.isCapturing = false;
    this.isPaused = false;
    
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
    this.updateStatus('Stopped', 'error');
    this.clearOverlay();
  }

  startRegionSelection() {
    this.updateStatus('Select region...', 'loading');
    
    // Create a full-screen overlay for region selection
    const selectionOverlay = document.createElement('div');
    selectionOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.3);
      cursor: crosshair;
      z-index: 9999;
    `;
    
    document.body.appendChild(selectionOverlay);
    
    let isSelecting = false;
    let startX, startY;
    
    selectionOverlay.addEventListener('mousedown', (e) => {
      isSelecting = true;
      startX = e.clientX;
      startY = e.clientY;
      
      this.regionSelector.style.left = startX + 'px';
      this.regionSelector.style.top = startY + 'px';
      this.regionSelector.style.width = '0px';
      this.regionSelector.style.height = '0px';
      this.regionSelector.style.display = 'block';
    });
    
    selectionOverlay.addEventListener('mousemove', (e) => {
      if (!isSelecting) return;
      
      const currentX = e.clientX;
      const currentY = e.clientY;
      
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);
      
      this.regionSelector.style.left = Math.min(startX, currentX) + 'px';
      this.regionSelector.style.top = Math.min(startY, currentY) + 'px';
      this.regionSelector.style.width = width + 'px';
      this.regionSelector.style.height = height + 'px';
    });
    
    selectionOverlay.addEventListener('mouseup', (e) => {
      if (!isSelecting) return;
      
      isSelecting = false;
      
      const rect = this.regionSelector.getBoundingClientRect();
      this.selectedRegion = {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      };
      
      // Remove selection overlay
      document.body.removeChild(selectionOverlay);
      this.regionSelector.style.display = 'none';
      
      this.updateStatus('Region selected', 'success');
      
      // Update region info
      const regionInfo = document.getElementById('region-info');
      regionInfo.innerHTML = `
        <p><strong>Selected Region:</strong></p>
        <p>X: ${Math.round(rect.left)}, Y: ${Math.round(rect.top)}</p>
        <p>Width: ${Math.round(rect.width)}, Height: ${Math.round(rect.height)}</p>
      `;
    });
  }

  clearRegion() {
    this.selectedRegion = null;
    this.regionSelector.style.display = 'none';
    
    const regionInfo = document.getElementById('region-info');
    regionInfo.innerHTML = '<p>Click "Select Region" and drag to select the area you want to monitor.</p>';
    
    this.updateStatus('Region cleared', 'info');
  }

  handleWebSocketMessage(data) {
    switch (data.type) {
      case 'translation_result':
        this.displayTranslations(data.translations);
        this.updateStatistics(data.translations);
        break;
      
      case 'config_updated':
        console.log('Configuration updated:', data);
        break;
      
      case 'error':
        console.error('Server error:', data.message);
        this.updateStatus('Error: ' + data.message, 'error');
        break;
    }
  }

  displayTranslations(translations) {
    // Clear previous translations
    this.overlay.innerHTML = '';
    
    if (!translations || translations.length === 0) return;
    
    translations.forEach(translation => {
      if (translation.bbox) {
        const box = document.createElement('div');
        box.className = 'translation-box';
        
        box.innerHTML = `
          <div class="original">${translation.original}</div>
          <div class="translated">${translation.translated}</div>
        `;
        
        // Position the translation box
        const scaleX = window.innerWidth / this.canvas.width;
        const scaleY = window.innerHeight / this.canvas.height;
        
        box.style.left = (translation.bbox.x0 * scaleX) + 'px';
        box.style.top = (translation.bbox.y0 * scaleY) + 'px';
        box.style.width = ((translation.bbox.x1 - translation.bbox.x0) * scaleX) + 'px';
        box.style.height = ((translation.bbox.y1 - translation.bbox.y0) * scaleY) + 'px';
        
        // Add click handler to show more details
        box.addEventListener('click', () => {
          this.showTranslationDetails(translation);
        });
        
        this.overlay.appendChild(box);
      }
    });
  }

  showTranslationDetails(translation) {
    // Create a modal or tooltip with detailed information
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      max-width: 400px;
    `;
    
    modal.innerHTML = `
      <h3>Translation Details</h3>
      <p><strong>Original:</strong> ${translation.original}</p>
      <p><strong>Translated:</strong> ${translation.translated}</p>
      <p><strong>Confidence:</strong> ${Math.round(translation.confidence)}%</p>
      <p><strong>Profile:</strong> ${this.currentProfile || 'None'}</p>
      <button onclick="this.parentElement.remove()" style="margin-top: 10px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
    `;
    
    document.body.appendChild(modal);
  }

  clearOverlay() {
    this.overlay.innerHTML = '';
  }

  updateStatistics(translations) {
    this.translationsCount += translations.length;
    this.translationsCountEl.textContent = this.translationsCount;
    
    // Calculate accuracy based on confidence scores
    if (translations.length > 0) {
      const avgConfidence = translations.reduce((sum, t) => sum + t.confidence, 0) / translations.length;
      this.accuracyRateEl.textContent = `${Math.round(avgConfidence)}%`;
    }
  }

  updateStats() {
    // Update uptime
    if (this.startTime) {
      const uptime = Date.now() - this.startTime;
      const minutes = Math.floor(uptime / 60000);
      const seconds = Math.floor((uptime % 60000) / 1000);
      this.uptimeEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    requestAnimationFrame(() => this.updateStats());
  }

  updateStatus(message, type = 'info') {
    this.statusText.textContent = message;
    
    // Update status dot color
    const colors = {
      success: '#48bb78',
      error: '#f56565',
      warning: '#ed8936',
      loading: '#667eea',
      info: '#4299e1'
    };
    
    this.statusDot.style.background = colors[type] || colors.info;
  }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
  window.translator = new LiveScreenTranslator();
});
