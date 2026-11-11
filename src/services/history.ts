export type History<T> = { past: T[]; present: T; future: T[] };
export type HistoryAction<T> = { type: 'set' | 'preview' | 'commit'; value: T } | { type: 'undo' } | { type: 'redo' };
export function historyTransition<T>(state: History<T>, action: HistoryAction<T>): History<T> {
  if (action.type === 'undo') return state.past.length ? { past: state.past.slice(0, -1), present: state.past[state.past.length - 1], future: [state.present, ...state.future].slice(0, 40) } : state;
  if (action.type === 'redo') return state.future.length ? { past: [...state.past, state.present].slice(-40), present: state.future[0], future: state.future.slice(1) } : state;
  if (action.type === 'preview') return { ...state, present: action.value, future: [] };
  if (action.type === 'commit') return JSON.stringify(state.present) === JSON.stringify(action.value) ? state : { ...state, past: [...state.past, action.value].slice(-40), future: [] };
  if (JSON.stringify(state.present) === JSON.stringify(action.value)) return state;
  return { past: [...state.past, state.present].slice(-40), present: action.value, future: [] };
}
