import { ipcMain, BrowserWindow } from 'electron';
import { IPC } from '../shared-with-frontend/ipc-events.const';
import { StickyWindowManager, StickyNoteData } from '../sticky-window-manager';
import { log } from 'electron-log/main';

let stickyWindowManager: StickyWindowManager;
let mainWindow: BrowserWindow | null = null;

export const setStickyNotesMainWindow = (win: BrowserWindow): void => {
  mainWindow = win;
};

export const getStickyWindowManager = (): StickyWindowManager | null => {
  return stickyWindowManager || null;
};

export const initStickyNotesIpc = (manager: StickyWindowManager): void => {
  stickyWindowManager = manager;

  // Handle show all notes request from tray menu
  ipcMain.on('SHOW_ALL_STICKY_NOTES', () => {
    stickyWindowManager.showAllWindows();
  });

  // Renderer sends STICKY_SYNC with array of notes to sync window state
  ipcMain.on(IPC.STICKY_SYNC, (event, notes: StickyNoteData[]) => {
    log('STICKY_SYNC received:', notes.length, 'notes');
    stickyWindowManager.sync(notes);
  });

  // Handle actions from sticky note windows (complete, delete, skip, recolor)
  ipcMain.on(
    IPC.STICKY_ACTION,
    (event, payload: { taskId: string; action: string; color?: string }) => {
      log('STICKY_ACTION:', payload.action, 'taskId:', payload.taskId);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(IPC.STICKY_ACTION, payload);
      }
    },
  );

  // Handle bounds changes from sticky note windows (move/resize)
  ipcMain.on(
    'STICKY_BOUNDS_CHANGED',
    (event, payload: { taskId: string; bounds: any }) => {
      log('STICKY_BOUNDS_CHANGED:', payload.taskId);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('STICKY_BOUNDS_CHANGED', payload);
      }
    },
  );
};
