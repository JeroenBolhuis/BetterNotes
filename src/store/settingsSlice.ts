import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface SettingsState {
  themeMode: ThemeMode;
}

const initialState: SettingsState = {
  themeMode: 'auto',
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.themeMode = action.payload;
    },
  },
});

export const { setThemeMode } = settingsSlice.actions;
export default settingsSlice.reducer; 