const ws = new WebSocket(`ws://${window.location.host}`);

ws.onopen = () => {
  console.log('WebSocket connection established');
};

const overlay = document.getElementById('overlay');

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

  // Calculate scaling factors
  const scaleX = overlayWidth / canvasWidth;
  const scaleY = overlayHeight / canvasHeight;

  translations.forEach(item => {
    if (item.bbox) {
      const div = document.createElement('div');
      div.className = 'translated-text';
      div.innerText = item.text;

      div.style.left = (item.bbox.x0 * scaleX) + 'px';
      div.style.top = (item.bbox.y0 * scaleY) + 'px';
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
          const dataUrl = canvas.toDataURL('image/jpeg', 0.5); // Use JPEG with 50% quality
          ws.send(dataUrl);
        }
      }, 1000); // Send a frame every second
    };

  } catch (error) {
    console.error('Error starting screen capture:', error);
  }
});
