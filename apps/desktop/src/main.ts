import { app, BrowserWindow, Tray, Menu, nativeImage, Notification } from 'electron';
import * as path from 'path';
import { JournalWatcher } from './watcher';
import { SyncClient } from './sync';

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;
let journalWatcher: JournalWatcher | null = null;
let syncClient: SyncClient | null = null;

const API_URL = process.env.API_URL || 'http://localhost:3001';
const JOURNAL_PATH = path.join(
  process.env.USERPROFILE || process.env.HOME || '',
  'Saved Games',
  'Frontier Developments',
  'Elite Dangerous'
);

function createTray() {
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3LnppcC5vcmcvZmlsZS5leGlmAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+ldWQAAAL1JREFUOI3tkMsJg0AMhT9R+I/uyBuwY8exC96DTewDF3Bv4MKNuANbsIJbs4IJiYEkSCFJUkKyhPx3elxdXV19fF5IwPM8r0mS9AeQ0S3Lsk8ZY9pIkoRdAGPM7+u6vkxEnKUkSdoNYGytKApJki4AY9pYWBhJktQCYGxtbWVJkhQBuCTJ1dVVbG1tIQjjPwCMMZJlmWFZln3fPwFYa5VSliVpmqYphmGYZFn6urq6+hOw3n8A/lmE9wC/EkQAAAAASUVORK5CYII='
  );

  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Elite Companion', enabled: false },
    { type: 'separator' },
    { label: 'Status: Not Connected', enabled: false, id: 'status' },
    { label: 'Last Sync: Never', enabled: false, id: 'lastSync' },
    { type: 'separator' },
    { label: 'Open Settings', click: openSettings },
    { label: 'Quit', click: quitApp },
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('Elite Dangerous Companion');
}

function openSettings() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 400,
    height: 500,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    icon: path.join(__dirname, 'assets/icon.png'),
  });

  mainWindow.loadFile(path.join(__dirname, 'settings.html'));
  mainWindow.on('close', () => {
    mainWindow = null;
  });
}

function quitApp() {
  if (journalWatcher) {
    journalWatcher.stop();
  }
  app.quit();
}

function updateStatus(status: string) {
  if (tray) {
    const menu = tray.menu;
    const statusItem = menu.getMenuItemById('status');
    if (statusItem) {
      statusItem.label = `Status: ${status}`;
    }
  }
}

function updateLastSync(time: string) {
  if (tray) {
    const menu = tray.menu;
    const lastSyncItem = menu.getMenuItemById('lastSync');
    if (lastSyncItem) {
      lastSyncItem.label = `Last Sync: ${time}`;
    }
  }
}

async function startWatcher(apiToken: string) {
  syncClient = new SyncClient(API_URL, apiToken);

  journalWatcher = new JournalWatcher(JOURNAL_PATH);

  journalWatcher.on('event', async (event) => {
    if (syncClient) {
      try {
        await syncClient.syncEvents([event]);
        updateLastSync(new Date().toLocaleTimeString());
      } catch (error) {
        console.error('Failed to sync event:', error);
      }
    }
  });

  journalWatcher.on('error', (error) => {
    console.error('Journal watcher error:', error);
    updateStatus('Error');
  });

  journalWatcher.start();
  updateStatus('Connected');
}

app.whenReady().then(() => {
  createTray();

  // Check for stored API token
  const store = require('electron-store');
  const config = new store({ name: 'config' });
  const apiToken = config.get('apiToken') as string;

  if (apiToken) {
    startWatcher(apiToken);
  } else {
    updateStatus('Not Connected');
    openSettings();
  }
});

app.on('window-all-closed', (e: Electron.Event) => {
  e.preventDefault();
});

export { updateStatus, updateLastSync, startWatcher };