import { ipcMain } from 'electron';
import { IPC } from '../shared-with-frontend/ipc-events.const';
import { StickyWindowManager, StickyNoteData } from '../sticky-window-manager';
import { log } from 'electron-log/main';

let stickyWindowManager: StickyWindowManager;

export const initStickyNotesIpc = (manager: StickyWindowManager): void => {
  stickyWindowManager = manager;

  // Renderer sends STICKY_SYNC with array of notes to sync window state
  ipcMain.on(IPC.STICKY_SYNC, (event, notes: StickyNoteData[]) => {
    log('STICKY_SYNC received:', notes.length, 'notes');
    stickyWindowManager.sync(notes);
  });

  // Handle bounds changes from sticky note windows (move/resize)
  ipcMain.on('STICKY_BOUNDS_CHANGED', (event, payload: { taskId: string; bounds: any }) => {
    log('STICKY_BOUNDS_CHANGED:', payload.taskId);
    // This will be relayed back to renderer to update store
    // Handled via STICKY_ACTION channel
  });
};
