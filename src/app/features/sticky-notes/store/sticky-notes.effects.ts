import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { createEffect } from '@ngrx/effects';
import { tap, throttleTime, withLatestFrom } from 'rxjs/operators';
import { selectOpenStickyNotes } from './sticky-notes.selectors';
import { StickyNotesActions } from './sticky-notes.actions';
import { IPC } from '../../../../core/electron/electron.const';
import { IS_ELECTRON } from '../../../../app.constants';
import {
  selectTaskEntities,
  selectTaskByIdWithSubTaskData,
} from '../../tasks/store/task.selectors';
import { TaskSharedActions } from '../../../../root-store/meta/task-shared.actions';

@Injectable()
export class StickyNotesEffects {
  private _store = inject(Store);

  syncStickyNotesToMain$ = createEffect(
    () =>
      this._store.select(selectOpenStickyNotes).pipe(
        throttleTime(100),
        withLatestFrom(this._store.select(selectTaskEntities)),
        tap(([notes, tasks]) => {
          if (IS_ELECTRON && window.ea && tasks) {
            const enrichedNotes = notes.map((note) => {
              const task = tasks[note.taskId];
              return {
                ...note,
                title: task?.title || note.taskId,
                subtasks: (task?.subTaskIds || []).map((subId) => ({
                  id: subId,
                  title: tasks[subId]?.title || subId,
                  isDone: tasks[subId]?.isDone || false,
                })),
              };
            });
            window.ea.send(IPC.STICKY_SYNC, enrichedNotes);
          }
        }),
      ),
    { dispatch: false },
  );

  constructor() {
    // Listen for sticky note actions from window
    if (IS_ELECTRON && window.ea) {
      window.ea.on(IPC.STICKY_ACTION, (event: any, payload: any) => {
        this.handleStickyAction(payload);
      });
    }
  }

  private handleStickyAction(payload: any): void {
    const { taskId, action, color, bounds } = payload;

    switch (action) {
      case 'complete':
        this._store.dispatch(
          TaskSharedActions.updateTask({
            task: { id: taskId, changes: { isDone: true } },
          }),
        );
        break;
      case 'skip':
        this._store.dispatch(StickyNotesActions.unpin({ taskId }));
        break;
      case 'delete':
        // Get task data and delete
        this._store
          .select((s) => selectTaskByIdWithSubTaskData(s, taskId))
          .subscribe((task) => {
            if (task) {
              this._store.dispatch(TaskSharedActions.deleteTask({ task }));
              this._store.dispatch(StickyNotesActions.unpin({ taskId }));
            }
          });
        break;
      case 'setColor':
        this._store.dispatch(StickyNotesActions.setColor({ taskId, color }));
        break;
      case 'setBounds':
        this._store.dispatch(StickyNotesActions.setBounds({ taskId, bounds }));
        break;
    }
  }
}
