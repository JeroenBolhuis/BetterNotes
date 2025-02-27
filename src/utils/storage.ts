import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '../store/taskSlice';
import { Note } from '../store/noteSlice';
import { differenceInDays } from 'date-fns';

const TASKS_STORAGE_KEY = '@better_notes_tasks';
const NOTES_STORAGE_KEY = '@better_notes_notes';

export const saveTasks = async (tasks: Task[]): Promise<void> => {
  try {
    // Filter out tasks completed more than 7 days ago
    const filteredTasks = tasks.filter(task => {
      if (!task.completed || !task.completedAt) return true;
      
      const completedDate = new Date(task.completedAt);
      const daysSinceCompletion = differenceInDays(new Date(), completedDate);
      
      return daysSinceCompletion <= 7;
    });
    
    await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(filteredTasks));
  } catch (error) {
    console.error('Error saving tasks:', error);
  }
};

export const loadTasks = async (): Promise<Task[]> => {
  try {
    const tasksJson = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
    return tasksJson ? JSON.parse(tasksJson) : [];
  } catch (error) {
    console.error('Error loading tasks:', error);
    return [];
  }
};

export const saveNotes = async (notes: Note[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  } catch (error) {
    console.error('Error saving notes:', error);
  }
};

export const loadNotes = async (): Promise<Note[]> => {
  try {
    const notesJson = await AsyncStorage.getItem(NOTES_STORAGE_KEY);
    return notesJson ? JSON.parse(notesJson) : [];
  } catch (error) {
    console.error('Error loading notes:', error);
    return [];
  }
}; 