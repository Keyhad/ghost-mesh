const { app, BrowserWindow, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let tray = null;
let bleServerProcess = null;
let nextServerProcess = null;

const BLE_SERVER_PORT = 8080;
const WEB_SERVER_PORT = 3000;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../../../public/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    },
    show: false
  });

  mainWindow.loadURL(`http://localhost:${WEB_SERVER_PORT}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  const iconPath = path.join(__dirname, '../../../public/icon.png');
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon.resize({ width: 16, height: 16 }));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        } else {
          createWindow();
        }
      }
    },
    {
      label: 'Status',
      submenu: [
        { label: `BLE Server: ${bleServerProcess ? 'Running' : 'Stopped'}`, enabled: false },
        { label: `Web Server: ${nextServerProcess ? 'Running' : 'Stopped'}`, enabled: false }
      ]
    },
    { type: 'separator' },
    {
      label: 'Restart Services',
      click: () => {
        stopServers();
        setTimeout(() => startServers(), 1000);
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('GhostMesh');

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
    } else {
      createWindow();
    }
  });
}

function startBLEServer() {
  return new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, '../../../dist/server/ble-server.js');

    bleServerProcess = spawn('node', [serverPath], {
      env: { ...process.env, LOG_LEVEL: 'info' },
      cwd: path.join(__dirname, '../../..')
    });

    bleServerProcess.stdout.on('data', (data) => {
      console.log(`[BLE Server] ${data.toString()}`);
    });

    bleServerProcess.stderr.on('data', (data) => {
      console.error(`[BLE Server Error] ${data.toString()}`);
    });

    bleServerProcess.on('error', (error) => {
      console.error('[BLE Server] Failed to start:', error);
      reject(error);
    });

    bleServerProcess.on('exit', (code) => {
      console.log(`[BLE Server] Exited with code ${code}`);
      bleServerProcess = null;
    });

    // Give it a moment to start
    setTimeout(() => resolve(), 2000);
  });
}

function startNextServer() {
  return new Promise((resolve, reject) => {
    nextServerProcess = spawn('npm', ['start'], {
      cwd: path.join(__dirname, '../../..'),
      shell: true
    });

    nextServerProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[Next.js] ${output}`);

      if (output.includes('Ready') || output.includes('started server')) {
        resolve();
      }
    });

    nextServerProcess.stderr.on('data', (data) => {
      console.error(`[Next.js Error] ${data.toString()}`);
    });

    nextServerProcess.on('error', (error) => {
      console.error('[Next.js] Failed to start:', error);
      reject(error);
    });

    nextServerProcess.on('exit', (code) => {
      console.log(`[Next.js] Exited with code ${code}`);
      nextServerProcess = null;
    });

    // Timeout if server doesn't start
    setTimeout(() => resolve(), 10000);
  });
}

async function startServers() {
  try {
    console.log('Starting BLE Server...');
    await startBLEServer();

    console.log('Starting Next.js Server...');
    await startNextServer();

    console.log('All servers started successfully');
  } catch (error) {
    console.error('Failed to start servers:', error);
  }
}

function stopServers() {
  if (bleServerProcess) {
    bleServerProcess.kill();
    bleServerProcess = null;
  }

  if (nextServerProcess) {
    nextServerProcess.kill();
    nextServerProcess = null;
  }
}

app.whenReady().then(async () => {
  await startServers();
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Keep app running even if all windows are closed (system tray)
});

app.on('before-quit', () => {
  app.isQuitting = true;
  stopServers();
});

app.on('will-quit', () => {
  stopServers();
});
