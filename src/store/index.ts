import { configureStore } from '@reduxjs/toolkit';
import taskReducer from './taskSlice';
import settingsReducer from './settingsSlice';
import { persistMiddleware } from './middleware';

export const store = configureStore({
  reducer: {
    tasks: taskReducer,
    settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(persistMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 