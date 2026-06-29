import { createActionGroup, props } from '@ngrx/store';

export interface StickyNoteBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const StickyNotesActions = createActionGroup({
  source: 'Sticky Notes',
  events: {
    pin: props<{
      taskId: string;
      color: string;
    }>(),

    unpin: props<{
      taskId: string;
    }>(),

    setColor: props<{
      taskId: string;
      color: string;
    }>(),

    setBounds: props<{
      taskId: string;
      bounds: StickyNoteBounds;
    }>(),

    setOpen: props<{
      taskId: string;
      isOpen: boolean;
    }>(),
  },
});
