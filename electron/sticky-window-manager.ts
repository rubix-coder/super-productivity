import { BrowserWindow } from 'electron';
import { join } from 'path';
import { log } from 'electron-log/main';

export interface StickyNoteData {
  taskId: string;
  title: string;
  color: string;
  bounds: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  isOpen: boolean;
}

export class StickyWindowManager {
  private windows = new Map<string, BrowserWindow>();
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    this.setupIpcHandlers();
  }

  setMainWindow(win: BrowserWindow): void {
    this.mainWindow = win;
  }

  sync(notes: StickyNoteData[]): void {
    const existingTaskIds = new Set(this.windows.keys());
    const incomingTaskIds = new Set(notes.map((n) => n.taskId));

    // Close windows for unpinned tasks
    for (const taskId of existingTaskIds) {
      if (!incomingTaskIds.has(taskId)) {
        this.closeWindow(taskId);
      }
    }

    // Open or update windows for pinned tasks
    for (const note of notes) {
      if (note.isOpen) {
        this.openOrUpdateWindow(note);
      } else {
        this.closeWindow(note.taskId);
      }
    }
  }

  private openOrUpdateWindow(note: StickyNoteData): void {
    const existing = this.windows.get(note.taskId);

    if (existing && !existing.isDestroyed()) {
      // Update existing window
      existing.setBounds({
        x: note.bounds.x,
        y: note.bounds.y,
        width: note.bounds.w,
        height: note.bounds.h,
      });
      // Send updated data to renderer
      existing.webContents.send('STICKY_NOTE_DATA', note);
    } else {
      // Create new window
      const win = new BrowserWindow({
        x: note.bounds.x,
        y: note.bounds.y,
        width: note.bounds.w,
        height: note.bounds.h,
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: true,
        webPreferences: {
          preload: join(__dirname, 'preload.js'),
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
        },
      });

      // Try to set always-on-top (may not work on native Wayland)
      try {
        win.setAlwaysOnTop(true, 'floating');
      } catch (e) {
        log('Warning: Could not set alwaysOnTop (may be on native Wayland)');
      }

      win.loadFile(join(__dirname, 'assets/sticky-note.html'));

      win.webContents.on('did-finish-load', () => {
        win.webContents.send('STICKY_NOTE_DATA', note);
      });

      win.on('move', () => {
        win.webContents.send('WINDOW_BOUNDS_CHANGED');
      });

      win.on('resize', () => {
        win.webContents.send('WINDOW_BOUNDS_CHANGED');
      });

      win.on('closed', () => {
        this.windows.delete(note.taskId);
      });

      this.windows.set(note.taskId, win);
    }
  }

  private closeWindow(taskId: string): void {
    const win = this.windows.get(taskId);
    if (win && !win.isDestroyed()) {
      win.close();
    }
    this.windows.delete(taskId);
  }

  private setupIpcHandlers(): void {
    // IPC handlers are now in ipc-handlers/sticky-notes-ipc.ts
  }
}
