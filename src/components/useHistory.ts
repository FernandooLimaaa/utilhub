import { useCallback, useReducer, useRef } from 'react';
import { historyTransition } from '../services/history';

export function useHistory<T>(initial: T) {
  const [state, dispatch] = useReducer(historyTransition<T>, { past: [], present: initial, future: [] });
  const group = useRef<T | null>(null);
  const set = useCallback((value: T) => dispatch({ type: group.current === null ? 'set' : 'preview', value }), []);
  const begin = () => { if (group.current === null) group.current = state.present; };
  const end = () => { if (group.current !== null) { dispatch({ type: 'commit', value: group.current }); group.current = null; } };
  return { value: state.present, set, begin, end, canUndo: !!state.past.length, canRedo: !!state.future.length, undo: () => { end(); dispatch({ type: 'undo' }); }, redo: () => { end(); dispatch({ type: 'redo' }); } };
}
