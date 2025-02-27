import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface NotesState {
  notes: Note[];
}

const initialState: NotesState = {
  notes: [],
};

export const noteSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    addNote: (state, action: PayloadAction<Note>) => {
      state.notes.push(action.payload);
    },
    updateNote: (state, action: PayloadAction<Note>) => {
      const index = state.notes.findIndex(note => note.id === action.payload.id);
      if (index !== -1) {
        state.notes[index] = action.payload;
      }
    },
    deleteNote: (state, action: PayloadAction<string>) => {
      state.notes = state.notes.filter(note => note.id !== action.payload);
    },
    loadNotes: (state, action: PayloadAction<Note[]>) => {
      state.notes = action.payload;
    },
  },
});

export const { addNote, updateNote, deleteNote, loadNotes } = noteSlice.actions;
export default noteSlice.reducer; 