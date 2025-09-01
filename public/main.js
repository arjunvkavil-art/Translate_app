const ws = new WebSocket(`ws://${window.location.host}`);

ws.onopen = () => {
  console.log('WebSocket connection established');
};

const overlay = document.getElementById('overlay');
const profileSelect = document.getElementById('profile-select');
const loadProfileBtn = document.getElementById('load-profile');
const toggleSelectBtn = document.getElementById('toggle-select');

ws.onmessage = (event) => {
  const translations = JSON.parse(event.data);

  // Clear previous translations
  overlay.innerHTML = '';

  if (translations.length === 0) return;

  // Get the dimensions of the canvas (which matches the captured screen resolution)
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  // Get the dimensions of the overlay (the browser viewport)
  const overlayWidth = overlay.clientWidth;
  const overlayHeight = overlay.clientHeight;

  // Calculate scaling factors from canvas -> overlay
  const scaleX = overlayWidth / canvasWidth;
  const scaleY = overlayHeight / canvasHeight;
  const normX = Math.min(selection.x, selection.x + selection.w);
  const normY = Math.min(selection.y, selection.y + selection.h);
  const hasSelection = selection.active && selection.w !== 0 && selection.h !== 0;

  translations.forEach(item => {
    if (item.bbox) {
      const div = document.createElement('div');
      div.className = 'translated-text';
      div.innerText = item.text;

      // Account for region offset correctly: offset after scaling
      if (hasSelection) {
        div.style.left = (normX + (item.bbox.x0 * scaleX)) + 'px';
        div.style.top = (normY + (item.bbox.y0 * scaleY)) + 'px';
      } else {
        div.style.left = (item.bbox.x0 * scaleX) + 'px';
        div.style.top = (item.bbox.y0 * scaleY) + 'px';
      }
      div.style.width = ((item.bbox.x1 - item.bbox.x0) * scaleX) + 'px';
      div.style.height = ((item.bbox.y1 - item.bbox.y0) * scaleY) + 'px';

      overlay.appendChild(div);
    }
  });
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket connection closed');
};

const startButton = document.getElementById('start-capture');
const heading = document.querySelector('h1');
const video = document.getElementById('screen-video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Load profiles into select
async function loadProfiles() {
  try {
    const res = await fetch('/api/profiles');
    const json = await res.json();
    profileSelect.innerHTML = '';
    for (const p of json.profiles) {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name || p.id;
      profileSelect.appendChild(opt);
    }
  } catch (e) {
    console.error('Failed to load profiles', e);
  }
}
loadProfiles();

loadProfileBtn.addEventListener('click', async () => {
  const id = profileSelect.value;
  try {
    await fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
  } catch (e) {
    console.error('Failed to set profile', e);
  }
});

// Region selection state
const selection = { active: false, selecting: false, x: 0, y: 0, w: 0, h: 0 };
const selectionDiv = document.createElement('div');
selectionDiv.style.position = 'fixed';
selectionDiv.style.border = '2px dashed #00eaff';
selectionDiv.style.pointerEvents = 'none';
selectionDiv.style.zIndex = '101';
selectionDiv.style.display = 'none';
document.body.appendChild(selectionDiv);

toggleSelectBtn.addEventListener('click', () => {
  selection.active = !selection.active;
  if (!selection.active) {
    selection.selecting = false;
    selectionDiv.style.display = 'none';
  }
});

document.addEventListener('mousedown', (e) => {
  if (!selection.active) return;
  selection.selecting = true;
  selection.x = e.clientX;
  selection.y = e.clientY;
  selection.w = 0;
  selection.h = 0;
  selectionDiv.style.left = selection.x + 'px';
  selectionDiv.style.top = selection.y + 'px';
  selectionDiv.style.width = '0px';
  selectionDiv.style.height = '0px';
  selectionDiv.style.display = 'block';
});

document.addEventListener('mousemove', (e) => {
  if (!selection.active || !selection.selecting) return;
  selection.w = e.clientX - selection.x;
  selection.h = e.clientY - selection.y;
  selectionDiv.style.width = Math.abs(selection.w) + 'px';
  selectionDiv.style.height = Math.abs(selection.h) + 'px';
  selectionDiv.style.left = (selection.w < 0 ? e.clientX : selection.x) + 'px';
  selectionDiv.style.top = (selection.h < 0 ? e.clientY : selection.y) + 'px';
});

document.addEventListener('mouseup', () => {
  if (!selection.active) return;
  selection.selecting = false;
});

// Integrate with Electron hotkey toggle to flip selection mode
if (window.electronAPI && window.electronAPI.onToggleSelectMode) {
  window.electronAPI.onToggleSelectMode(() => {
    toggleSelectBtn.click();
  });
}

// Text Mode
const textInput = document.getElementById('text-input');
const textBtn = document.getElementById('translate-text');
const textOut = document.getElementById('text-output');
textBtn.addEventListener('click', async () => {
  const text = (textInput.value || '').trim();
  if (!text) return;
  try {
    const res = await fetch('/api/translate-text', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
    const json = await res.json();
    textOut.textContent = json.translation || '';
  } catch (e) {
    textOut.textContent = 'Error';
  }
});

// Dictionary Mode
const dictInput = document.getElementById('dict-input');
const dictBtn = document.getElementById('dict-lookup');
const dictOut = document.getElementById('dict-output');
dictBtn.addEventListener('click', async () => {
  const q = (dictInput.value || '').trim();
  if (!q) return;
  try {
    const res = await fetch(`/api/dictionary?q=${encodeURIComponent(q)}`);
    const json = await res.json();
    dictOut.textContent = (json.results || []).slice(0, 3).map(r => `${r.zh} → ${r.en}`).join(' | ');
  } catch (e) {
    dictOut.textContent = 'Error';
  }
});

startButton.addEventListener('click', async () => {
  // Hide the controls
  heading.style.display = 'none';
  startButton.style.display = 'none';

  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: 'always' },
      audio: false
    });

    video.srcObject = stream;
    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          let sx = 0, sy = 0, sw = canvas.width, sh = canvas.height;
          if (selection.active && selection.w !== 0 && selection.h !== 0) {
            // Map selection from viewport to canvas coordinates
            const overlayWidth = overlay.clientWidth;
            const overlayHeight = overlay.clientHeight;
            const scaleX = canvas.width / overlayWidth;
            const scaleY = canvas.height / overlayHeight;
            const x = Math.min(selection.x, selection.x + selection.w);
            const y = Math.min(selection.y, selection.y + selection.h);
            const w = Math.abs(selection.w);
            const h = Math.abs(selection.h);
            sx = Math.max(0, Math.round(x * scaleX));
            sy = Math.max(0, Math.round(y * scaleY));
            sw = Math.max(1, Math.round(w * scaleX));
            sh = Math.max(1, Math.round(h * scaleY));
            const imgData = ctx.getImageData(sx, sy, sw, sh);
            const tmpCanvas = document.createElement('canvas');
            tmpCanvas.width = sw;
            tmpCanvas.height = sh;
            const tctx = tmpCanvas.getContext('2d');
            tctx.putImageData(imgData, 0, 0);
            const dataUrl = tmpCanvas.toDataURL('image/jpeg', 0.5);
            ws.send(dataUrl);
            return;
          }
          const dataUrl = canvas.toDataURL('image/jpeg', 0.5); // Use JPEG with 50% quality
          ws.send(dataUrl);
        }
      }, 1000); // Send a frame every second
    };

  } catch (error) {
    console.error('Error starting screen capture:', error);
  }
});
