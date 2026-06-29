import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { createEffect } from '@ngrx/effects';
import { tap, throttleTime, withLatestFrom } from 'rxjs/operators';
import { selectOpenStickyNotes } from './sticky-notes.selectors';
import { IPC } from '../../../../core/electron/electron.const';
import { IS_ELECTRON } from '../../../../app.constants';
import { selectTaskById, selectTaskEntities } from '../../tasks/store/task.selectors';

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
}
