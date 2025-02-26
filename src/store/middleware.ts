import { Middleware, AnyAction } from '@reduxjs/toolkit';
import { saveTasks } from '../utils/storage';
import { RootState } from './index';

export const persistMiddleware: Middleware = store => next => action => {
  const result = next(action);
  
  if (
    typeof action === 'object' &&
    action !== null &&
    'type' in action &&
    typeof action.type === 'string' &&
    action.type.startsWith('tasks/') &&
    action.type !== 'tasks/loadTasks'
  ) {
    const state = store.getState() as RootState;
    saveTasks(state.tasks.tasks);
  }
  
  return result;
}; 