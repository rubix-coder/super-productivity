import { createSelector } from '@ngrx/store';
import { stickyNotesFeature } from './sticky-notes.reducer';
import { StickyNote } from './sticky-notes.reducer';

export const selectStickyNotesState = stickyNotesFeature.selectState;

export const selectStickyNotesById = (
  taskId: string,
): ReturnType<typeof createSelector> =>
  createSelector(selectStickyNotesState, (state) => state?.[taskId]);

export const selectAllStickyNotes = createSelector(selectStickyNotesState, (state) =>
  Object.entries(state ?? {}).map(([taskId, note]) => ({
    taskId,
    ...(note as StickyNote),
  })),
);

export const selectOpenStickyNotes = createSelector(selectAllStickyNotes, (notes) =>
  notes.filter((n) => n?.isOpen),
);
