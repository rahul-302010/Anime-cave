/**
 * Anime Cave Electron Main - Desktop wrapper
 * file: electron/main.js:1
 */
const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let backendProcess = null;
let mainWindow = null;

const isDev = !app.isPackaged;
const BACKEND_PORT = process.env.PORT || 4000;
const FRONTEND_URL = isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, '../frontend/dist/index.html')}`;

function startBackend() {
  const backendPath = path.join(__dirname, '../backend/src/index.js');
  const nodeExec = process.execPath.includes('electron') ? 'node' : process.execPath;
  // Try portable node first
  const portableNode = 'C:\\nodejs-portable\\node.exe';
  const exec = fs.existsSync(portableNode) ? portableNode : 'node';

  console.log('[electron] starting backend with', exec, backendPath);
  try {
    backendProcess = spawn(exec, [backendPath], {
      cwd: path.join(__dirname, '../backend'),
      env: { ...process.env, PORT: BACKEND_PORT, FRONTEND_URL: 'http://localhost:5173' },
      stdio: 'inherit',
      shell: false
    });
    backendProcess.on('error', (e) => console.error('[backend] spawn error', e));
    backendProcess.on('exit', (code) => console.log('[backend] exited', code));
  } catch (e) {
    console.error('[backend] failed to start', e);
    dialog.showErrorBox('Backend failed', String(e));
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    backgroundColor: '#0a0a0f',
    title: 'Anime Cave V1 — Desktop',
    icon: path.join(__dirname, '../frontend/public/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    },
    autoHideMenuBar: true
  });

  // Handle external links: Crunchyroll etc open in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.includes('crunchyroll.com') || url.includes('youtube.com') || url.includes('youtu.be')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (e, url) => {
    const parsed = new URL(url);
    if (parsed.origin !== new URL(FRONTEND_URL).origin && !url.startsWith('file://')) {
      if (url.includes('crunchyroll.com') || url.includes('youtube.com')) {
        e.preventDefault();
        shell.openExternal(url);
      }
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  startBackend();
  // wait a bit for backend to boot
  setTimeout(createWindow, 1500);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (backendProcess) {
    try { backendProcess.kill(); } catch {}
    backendProcess = null;
  }
});

// Local file access - expose safe dialog for picking owned files (future)
const { ipcMain } = require('electron');
ipcMain.handle('pick-video', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Videos', extensions: ['mp4','mkv','webm'] }]
  });
  if (canceled) return null;
  return filePaths[0];
});
