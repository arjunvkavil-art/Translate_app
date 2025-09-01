class LiveScreenTranslator {
  constructor() {
    this.ws = null;
    this.currentMode = 'app-target';
    this.selectedProfile = null;
    this.isCapturing = false;
    this.regions = [];
    this.translationHistory = [];
    this.stats = {
      totalTranslations: 0,
      activeConnections: 0,
      availableProfiles: 0,
      uptime: 0
    };
    
    this.initializeWebSocket();
    this.initializeEventListeners();
    this.loadProfiles();
    this.loadStats();
    this.loadHistory();
  }

  initializeWebSocket() {
    this.ws = new WebSocket(`ws://${window.location.host}`);
    
    this.ws.onopen = () => {
      this.updateConnectionStatus(true);
      this.showNotification('Connected to translation server', 'success');
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleWebSocketMessage(data);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.updateConnectionStatus(false);
      this.showNotification('Connection error', 'error');
    };

    this.ws.onclose = () => {
      this.updateConnectionStatus(false);
      this.showNotification('Disconnected from server', 'error');
    };
  }

  initializeEventListeners() {
    // Mode selection
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchMode(e.target.closest('.mode-btn').dataset.mode);
      });
    });

    // Profile selection
    document.getElementById('profile-grid').addEventListener('click', (e) => {
      const profileCard = e.target.closest('.profile-card');
      if (profileCard) {
        this.selectProfile(profileCard.dataset.profileId);
      }
    });

    // Controls
    document.getElementById('start-capture').addEventListener('click', () => {
      this.startCapture();
    });

    document.getElementById('stop-capture').addEventListener('click', () => {
      this.stopCapture();
    });

    document.getElementById('clear-overlay').addEventListener('click', () => {
      this.clearOverlay();
    });

    // Translation engine
    document.getElementById('translation-engine').addEventListener('change', (e) => {
      this.updateTranslationEngine(e.target.value);
    });

    // OCR confidence
    document.getElementById('ocr-confidence').addEventListener('input', (e) => {
      document.getElementById('confidence-value').textContent = `${e.target.value}%`;
    });

    // App target mode
    document.getElementById('refresh-apps').addEventListener('click', () => {
      this.refreshApplications();
    });

    // Region mode
    this.initializeRegionCanvas();
    document.getElementById('add-region').addEventListener('click', () => {
      this.addRegion();
    });
    document.getElementById('clear-regions').addEventListener('click', () => {
      this.clearRegions();
    });

    // Voice mode
    document.getElementById('start-voice').addEventListener('click', () => {
      this.startVoiceRecognition();
    });

    // Text mode
    document.getElementById('translate-text').addEventListener('click', () => {
      this.translateText();
    });

    // Dictionary mode
    document.getElementById('search-dictionary').addEventListener('click', () => {
      this.searchDictionary();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });
  }

  switchMode(mode) {
    // Update active button
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

    // Hide all mode content
    document.querySelectorAll('.mode-content').forEach(content => {
      content.classList.add('hidden');
    });

    // Show selected mode content
    document.getElementById(`${mode}-mode`).classList.remove('hidden');

    this.currentMode = mode;
    this.showNotification(`Switched to ${mode.replace('-', ' ')} mode`, 'success');
  }

  async loadProfiles() {
    try {
      const response = await fetch('/api/profiles');
      const profiles = await response.json();
      
      const profileGrid = document.getElementById('profile-grid');
      profileGrid.innerHTML = '';

      profiles.forEach(profile => {
        const card = document.createElement('div');
        card.className = 'profile-card';
        card.dataset.profileId = profile.id;
        
        const features = Object.keys(profile.customGlossary || {}).slice(0, 3);
        
        card.innerHTML = `
          <h4>${profile.name}</h4>
          <p>${profile.description}</p>
          <div class="features">
            ${features.map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
            ${features.length < Object.keys(profile.customGlossary || {}).length ? 
              `<span class="feature-tag">+${Object.keys(profile.customGlossary || {}).length - features.length} more</span>` : ''}
          </div>
        `;
        
        profileGrid.appendChild(card);
      });

      this.stats.availableProfiles = profiles.length;
      this.updateStats();
    } catch (error) {
      console.error('Error loading profiles:', error);
      this.showNotification('Failed to load profiles', 'error');
    }
  }

  selectProfile(profileId) {
    // Update UI
    document.querySelectorAll('.profile-card').forEach(card => {
      card.classList.remove('selected');
    });
    document.querySelector(`[data-profile-id="${profileId}"]`).classList.add('selected');
    
    document.getElementById('current-profile').textContent = 
      document.querySelector(`[data-profile-id="${profileId}"] h4`).textContent;

    // Send to server
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'set_profile',
        profileId: profileId
      }));
    }

    this.selectedProfile = profileId;
    this.showNotification(`Selected ${profileId} profile`, 'success');
  }

  async startCapture() {
    if (this.isCapturing) {
      this.showNotification('Already capturing', 'error');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false
      });

      const video = document.getElementById('screen-video');
      const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');

      video.srcObject = stream;
      
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        this.isCapturing = true;
        this.captureInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN && this.isCapturing) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            
            this.ws.send(JSON.stringify({
              type: 'ocr_request',
              imageData: dataUrl,
              region: this.currentMode === 'region' ? this.regions : null,
              engine: document.getElementById('translation-engine').value
            }));
          }
        }, 2000); // Capture every 2 seconds
      };

      this.showNotification('Screen capture started', 'success');
    } catch (error) {
      console.error('Error starting capture:', error);
      this.showNotification('Failed to start capture', 'error');
    }
  }

  stopCapture() {
    if (!this.isCapturing) {
      this.showNotification('Not currently capturing', 'error');
      return;
    }

    this.isCapturing = false;
    clearInterval(this.captureInterval);
    
    const video = document.getElementById('screen-video');
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }

    this.showNotification('Screen capture stopped', 'success');
  }

  clearOverlay() {
    document.getElementById('translation-overlay').innerHTML = '';
    this.showNotification('Translation overlay cleared', 'success');
  }

  updateConnectionStatus(connected) {
    const statusDot = document.getElementById('connection-status');
    const statusText = document.getElementById('status-text');
    
    if (connected) {
      statusDot.classList.remove('disconnected');
      statusText.textContent = 'Connected';
    } else {
      statusDot.classList.add('disconnected');
      statusText.textContent = 'Disconnected';
    }
  }

  handleWebSocketMessage(data) {
    switch (data.type) {
      case 'ocr_result':
        this.displayTranslations(data.results);
        break;
      case 'translation_result':
        this.displayTextTranslation(data);
        break;
      case 'profile_set':
        this.showNotification('Profile updated', 'success');
        break;
      case 'error':
        this.showNotification(data.message, 'error');
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  displayTranslations(results) {
    const overlay = document.getElementById('translation-overlay');
    
    // Clear previous translations
    overlay.innerHTML = '';

    if (results.length === 0) return;

    results.forEach(result => {
      if (result.bbox) {
        const div = document.createElement('div');
        div.className = 'translation-box';
        
        div.innerHTML = `
          <div class="original">${result.original}</div>
          <div class="translated">${result.translated}</div>
        `;

        // Calculate position based on screen scaling
        const canvas = document.getElementById('canvas');
        const overlayWidth = overlay.clientWidth;
        const overlayHeight = overlay.clientHeight;
        
        const scaleX = overlayWidth / canvas.width;
        const scaleY = overlayHeight / canvas.height;

        div.style.left = (result.bbox.x0 * scaleX) + 'px';
        div.style.top = (result.bbox.y0 * scaleY) + 'px';
        div.style.width = ((result.bbox.x1 - result.bbox.x0) * scaleX) + 'px';
        div.style.height = ((result.bbox.y1 - result.bbox.y0) * scaleY) + 'px';

        overlay.appendChild(div);
      }
    });

    // Update stats
    this.stats.totalTranslations += results.length;
    this.updateStats();
  }

  displayTextTranslation(data) {
    const output = document.getElementById('text-output');
    output.innerHTML = `
      <div style="margin-bottom: 10px;">
        <strong>Original:</strong> <span style="color: #e53e3e;">${data.original}</span>
      </div>
      <div>
        <strong>Translation:</strong> <span style="color: #2d3748;">${data.translated}</span>
      </div>
      <div style="margin-top: 10px; font-size: 12px; color: #718096;">
        Engine: ${data.engine}
      </div>
    `;
  }

  initializeRegionCanvas() {
    const canvas = document.getElementById('region-canvas');
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let startX, startY;

    canvas.addEventListener('mousedown', (e) => {
      isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      startX = e.clientX - rect.left;
      startY = e.clientY - rect.top;
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!isDrawing) return;
      
      const rect = canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      // Clear canvas and redraw
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#667eea';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(startX, startY, currentX - startX, currentY - startY);

      // Update info
      document.getElementById('region-info').textContent = 
        `Region: ${Math.abs(currentX - startX)}x${Math.abs(currentY - startY)} pixels`;
    });

    canvas.addEventListener('mouseup', () => {
      isDrawing = false;
    });
  }

  addRegion() {
    const canvas = document.getElementById('region-canvas');
    const ctx = canvas.getContext('2d');
    
    // Get the drawn region (simplified - in real implementation, you'd track the coordinates)
    const region = {
      x: 100,
      y: 100,
      width: 200,
      height: 100
    };

    this.regions.push(region);
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'add_region',
        region: region
      }));
    }

    this.showNotification('Region added', 'success');
  }

  clearRegions() {
    this.regions = [];
    const canvas = document.getElementById('region-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    document.getElementById('region-info').textContent = 'Click and drag to select a region';
    
    this.showNotification('All regions cleared', 'success');
  }

  startVoiceRecognition() {
    if (!('webkitSpeechRecognition' in window)) {
      this.showNotification('Speech recognition not supported', 'error');
      return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'zh-CN';

    recognition.onstart = () => {
      document.getElementById('start-voice').innerHTML = '<i class="fas fa-stop"></i> Stop Recognition';
      this.showNotification('Voice recognition started', 'success');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      document.getElementById('voice-output').innerHTML = `
        <div style="margin-bottom: 10px;">
          <strong>Recognized:</strong> ${transcript}
        </div>
        <div class="loading">Translating...</div>
      `;

      // Send for translation
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'translate_text',
          text: transcript,
          from: 'zh-cn',
          to: 'en',
          engine: document.getElementById('translation-engine').value
        }));
      }
    };

    recognition.onerror = (event) => {
      this.showNotification('Voice recognition error', 'error');
    };

    recognition.onend = () => {
      document.getElementById('start-voice').innerHTML = '<i class="fas fa-microphone"></i> Start Voice Recognition';
    };

    recognition.start();
  }

  translateText() {
    const text = document.getElementById('text-input').value.trim();
    if (!text) {
      this.showNotification('Please enter text to translate', 'error');
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'translate_text',
        text: text,
        from: 'zh-cn',
        to: 'en',
        engine: document.getElementById('translation-engine').value
      }));
    }
  }

  async searchDictionary() {
    const searchTerm = document.getElementById('dictionary-search').value.trim();
    if (!searchTerm) {
      this.showNotification('Please enter a search term', 'error');
      return;
    }

    try {
      const response = await fetch(`/api/glossaries?search=${encodeURIComponent(searchTerm)}`);
      const results = await response.json();
      
      const resultsDiv = document.getElementById('dictionary-results');
      if (results.length === 0) {
        resultsDiv.innerHTML = '<p style="color: #718096;">No results found</p>';
      } else {
        resultsDiv.innerHTML = results.map(result => `
          <div style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 10px;">
            <strong>${result.name}</strong> (${result.category})
            <div style="margin-top: 5px; font-size: 14px; color: #4a5568;">
              ${JSON.parse(result.terms)[searchTerm] || 'Term not found in this glossary'}
            </div>
          </div>
        `).join('');
      }
    } catch (error) {
      console.error('Dictionary search error:', error);
      this.showNotification('Dictionary search failed', 'error');
    }
  }

  async loadStats() {
    try {
      const response = await fetch('/api/stats');
      this.stats = await response.json();
      this.updateStats();
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  updateStats() {
    const statsGrid = document.getElementById('stats-grid');
    statsGrid.innerHTML = `
      <div class="stat-card">
        <div class="stat-number">${this.stats.totalTranslations}</div>
        <div class="stat-label">Translations</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${this.stats.activeConnections}</div>
        <div class="stat-label">Connections</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${this.stats.availableProfiles}</div>
        <div class="stat-label">Profiles</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${Math.round(this.stats.uptime / 60)}m</div>
        <div class="stat-label">Uptime</div>
      </div>
    `;
  }

  async loadHistory() {
    try {
      const response = await fetch('/api/history?limit=10');
      const history = await response.json();
      
      const historyList = document.getElementById('history-list');
      historyList.innerHTML = history.map(item => `
        <div class="history-item">
          <div class="history-text">
            <div class="history-original">${item.original_text}</div>
            <div class="history-translated">${item.translated_text}</div>
          </div>
          <div class="history-time">${new Date(item.timestamp).toLocaleTimeString()}</div>
        </div>
      `).join('');
    } catch (error) {
      console.error('Error loading history:', error);
    }
  }

  refreshApplications() {
    // In a real implementation, this would query the system for running applications
    const targetApp = document.getElementById('target-app');
    targetApp.innerHTML = `
      <option value="">Select an application...</option>
      <option value="ircb500.exe">Inovance IRCB500</option>
      <option value="ScreenEditor.exe">Delta Screen Editor</option>
      <option value="GXDeveloper.exe">Mitsubishi GX Developer</option>
      <option value="SimaticManager.exe">Siemens STEP 7</option>
      <option value="chrome.exe">Google Chrome</option>
      <option value="notepad.exe">Notepad</option>
    `;
    
    this.showNotification('Applications refreshed', 'success');
  }

  updateTranslationEngine(engine) {
    this.showNotification(`Translation engine changed to ${engine}`, 'success');
  }

  handleKeyboardShortcuts(e) {
    // Ctrl+Shift+T: Start/Stop translation
    if (e.ctrlKey && e.shiftKey && e.key === 'T') {
      e.preventDefault();
      if (this.isCapturing) {
        this.stopCapture();
      } else {
        this.startCapture();
      }
    }
    
    // Ctrl+Shift+C: Clear overlay
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      this.clearOverlay();
    }
    
    // Ctrl+Shift+R: Refresh apps
    if (e.ctrlKey && e.shiftKey && e.key === 'R') {
      e.preventDefault();
      this.refreshApplications();
    }
  }

  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new LiveScreenTranslator();
});
