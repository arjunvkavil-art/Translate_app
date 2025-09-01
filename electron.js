const { app, BrowserWindow, screen, globalShortcut } = require('electron');
const { fork } = require('child_process');
const path = require('path');

// Keep a global reference to the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let serverProcess;

function createWindow() {
  // Start the backend server as a child process
  serverProcess = fork(path.join(__dirname, 'server.js'));

  // Get primary display's dimensions
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  // Load the app by pointing to the URL our server is running
  // We need to give the server a moment to start up.
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:3000');
  }, 3000); // 3-second delay, not ideal but simple for now.

  // Open the DevTools for debugging.
  // mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object
    mainWindow = null;
  });

  // Register a global hotkey to toggle mouse passthrough
  const accelerator = 'CommandOrControl+Shift+T';
  const registered = globalShortcut.register(accelerator, () => {
    if (!mainWindow) return;
    // toggle ignore mouse events
    const currentlyIgnoring = mainWindow.isAlwaysOnTop(); // not ideal, track separately if needed
    const newState = !mainWindow._ignoringMouse;
    mainWindow.setIgnoreMouseEvents(newState, { forward: true });
    mainWindow._ignoringMouse = newState;
    mainWindow.webContents.send('toggle-select-mode');
  });
  if (!registered) {
    console.warn('Global hotkey registration failed');
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// Make sure to kill the server process when the app quits.
app.on('quit', () => {
  if (serverProcess) {
    console.log('Killing server process...');
    serverProcess.kill();
    serverProcess = null;
  }
  globalShortcut.unregisterAll();
});
