const { app, BrowserWindow, screen, globalShortcut, ipcMain, dialog } = require('electron');
const { fork } = require('child_process');
const path = require('path');

// Keep a global reference to the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let serverProcess;
let isDev = process.argv.includes('--dev');

function createWindow() {
  // Start the backend server as a child process
  serverProcess = fork(path.join(__dirname, 'server.js'));

  // Get primary display's dimensions
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: isDev ? 1200 : width,
    height: isDev ? 800 : height,
    x: isDev ? 100 : 0,
    y: isDev ? 100 : 0,
    transparent: !isDev,
    frame: isDev,
    alwaysOnTop: !isDev,
    resizable: isDev,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    title: 'Live Screen Translator Pro',
    show: false // Don't show until ready
  });

  // Set window properties for production mode
  if (!isDev) {
    mainWindow.setIgnoreMouseEvents(true, { forward: true });
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setFullScreen(false);
    mainWindow.setResizable(false);
  }

  // Load the app by pointing to the URL our server is running
  // We need to give the server a moment to start up.
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:3000');
  }, 3000);

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object
    mainWindow = null;
  });

  // Handle window focus/blur for production mode
  if (!isDev) {
    mainWindow.on('blur', () => {
      // Keep window on top even when not focused
      mainWindow.setAlwaysOnTop(true, 'screen-saver');
    });
  }
}

// Register global shortcuts
function registerGlobalShortcuts() {
  // Toggle translation overlay visibility
  globalShortcut.register('CommandOrControl+Shift+T', () => {
    if (mainWindow) {
      mainWindow.webContents.send('toggle-overlay');
    }
  });

  // Start/Stop capture
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    if (mainWindow) {
      mainWindow.webContents.send('toggle-capture');
    }
  });

  // Pause/Resume capture
  globalShortcut.register('CommandOrControl+Shift+P', () => {
    if (mainWindow) {
      mainWindow.webContents.send('toggle-pause');
    }
  });

  // Quick region selection
  globalShortcut.register('CommandOrControl+Shift+R', () => {
    if (mainWindow) {
      mainWindow.webContents.send('select-region');
    }
  });

  // Toggle window visibility (for production mode)
  if (!isDev) {
    globalShortcut.register('CommandOrControl+Shift+H', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });
  }
}

// IPC handlers for communication between main and renderer processes
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-platform', () => {
  return process.platform;
});

ipcMain.handle('show-error-dialog', async (event, title, content) => {
  const result = await dialog.showErrorBox(title, content);
  return result;
});

ipcMain.handle('show-info-dialog', async (event, title, content) => {
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: title,
    message: content,
    buttons: ['OK']
  });
  return result;
});

ipcMain.handle('get-screen-info', () => {
  const displays = screen.getAllDisplays();
  return displays.map(display => ({
    id: display.id,
    bounds: display.bounds,
    workArea: display.workArea,
    scaleFactor: display.scaleFactor,
    rotation: display.rotation,
    internal: display.internal
  }));
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  createWindow();
  registerGlobalShortcuts();
});

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

// Handle app quit
app.on('quit', () => {
  // Unregister all global shortcuts
  globalShortcut.unregisterAll();
  
  // Kill the server process
  if (serverProcess) {
    console.log('Killing server process...');
    serverProcess.kill();
    serverProcess = null;
  }
});

// Handle app before-quit
app.on('before-quit', (event) => {
  // Prevent default quit behavior to allow cleanup
  event.preventDefault();
  
  if (mainWindow) {
    mainWindow.webContents.send('app-quitting');
    
    // Give the renderer process a moment to clean up
    setTimeout(() => {
      app.exit(0);
    }, 1000);
  } else {
    app.exit(0);
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    console.log('Prevented new window creation:', navigationUrl);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  
  if (mainWindow) {
    mainWindow.webContents.send('error', {
      type: 'uncaught-exception',
      message: error.message,
      stack: error.stack
    });
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  
  if (mainWindow) {
    mainWindow.webContents.send('error', {
      type: 'unhandled-rejection',
      reason: reason
    });
  }
});
