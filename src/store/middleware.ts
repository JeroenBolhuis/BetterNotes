import { Middleware, AnyAction } from '@reduxjs/toolkit';
import { saveTasks } from '../utils/storage';
import { saveNotes } from '../utils/storage';
import { RootState } from './index';

export const persistMiddleware: Middleware = store => next => action => {
  const result = next(action);
  
  if (
    typeof action === 'object' &&
    action !== null &&
    'type' in action &&
    typeof action.type === 'string'
  ) {
    const state = store.getState() as RootState;
    
    // Persist tasks
    if (
      action.type.startsWith('tasks/') &&
      action.type !== 'tasks/loadTasks'
    ) {
      saveTasks(state.tasks.tasks);
    }
    
    // Persist notes
    if (
      action.type.startsWith('notes/') &&
      action.type !== 'notes/loadNotes'
    ) {
      saveNotes(state.notes.notes);
    }
  }
  
  return result;
}; 