import { createFeature, createReducer, on } from '@ngrx/store';
import { StickyNotesActions, StickyNoteBounds } from './sticky-notes.actions';

export const STICKY_NOTES_FEATURE_KEY = 'stickyNotes';

export interface StickyNote {
  color: string;
  bounds: StickyNoteBounds;
  isOpen: boolean;
}

export interface StickyNotesState {
  [taskId: string]: StickyNote | undefined;
}

export const stickyNotesInitialState: StickyNotesState = {};

export const stickyNotesReducer = createReducer(
  stickyNotesInitialState,
  on(StickyNotesActions.pin, (state, { taskId, color }) => ({
    ...state,
    [taskId]: {
      color,
      bounds: { x: 100, y: 100, w: 300, h: 400 },
      isOpen: true,
    },
  })),
  on(StickyNotesActions.unpin, (state, { taskId }) => {
    const newState = { ...state };
    delete newState[taskId];
    return newState;
  }),
  on(StickyNotesActions.setColor, (state, { taskId, color }) => ({
    ...state,
    [taskId]: {
      ...state[taskId]!,
      color,
    },
  })),
  on(StickyNotesActions.setBounds, (state, { taskId, bounds }) => ({
    ...state,
    [taskId]: {
      ...state[taskId]!,
      bounds,
    },
  })),
  on(StickyNotesActions.setOpen, (state, { taskId, isOpen }) => ({
    ...state,
    [taskId]: {
      ...state[taskId]!,
      isOpen,
    },
  })),
);

export const stickyNotesFeature = createFeature({
  name: STICKY_NOTES_FEATURE_KEY,
  reducer: stickyNotesReducer,
});
