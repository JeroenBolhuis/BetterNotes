import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Provider as ReduxProvider } from 'react-redux';
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { store } from './src/store';
import { TaskListScreen } from './src/screens/TaskListScreen';
import { NotesScreen } from './src/screens/NotesScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { loadTasks } from './src/store/taskSlice';
import { loadNotes } from './src/store/noteSlice';
import { loadTasks as loadTasksFromStorage } from './src/utils/storage';
import { loadNotes as loadNotesFromStorage } from './src/utils/storage';
import { useSelector } from 'react-redux';
import { RootState } from './src/store';

type TabParamList = {
  Tasks: undefined;
  Notes: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

// Customize the themes
const CustomLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    background: '#f6f6f6',
    surface: '#ffffff',
  },
};

const CustomDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    background: '#121212',
    surface: '#1e1e1e',
    onSurface: '#ffffff',
    onBackground: '#ffffff',
  },
};

// Navigation themes
const CustomNavigationLightTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    background: CustomLightTheme.colors.background,
    card: CustomLightTheme.colors.surface,
    text: CustomLightTheme.colors.onSurface,
  },
};

const CustomNavigationDarkTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    background: CustomDarkTheme.colors.background,
    card: CustomDarkTheme.colors.surface,
    text: CustomDarkTheme.colors.onSurface,
  },
};

function AppContent() {
  const themeMode = useSelector((state: RootState) => state.settings.themeMode);
  
  const theme = themeMode === 'dark' ? CustomDarkTheme : CustomLightTheme;
  const navigationTheme = themeMode === 'dark' ? CustomNavigationDarkTheme : CustomNavigationLightTheme;

  useEffect(() => {
    const initializeApp = async () => {
      const tasks = await loadTasksFromStorage();
      store.dispatch(loadTasks(tasks));
      
      const notes = await loadNotesFromStorage();
      store.dispatch(loadNotes(notes));
    };

    initializeApp();
  }, []);

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer theme={navigationTheme}>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: 'gray',
            tabBarStyle: {
              backgroundColor: theme.colors.surface,
            },
            headerStyle: {
              backgroundColor: theme.colors.surface,
            },
            headerTintColor: theme.colors.onSurface,
          }}
        >
          <Tab.Screen
            name="Tasks"
            component={TaskListScreen}
            options={{
              tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <MaterialCommunityIcons
                  name="format-list-checks"
                  size={size}
                  color={color}
                />
              ),
            }}
          />
          <Tab.Screen
            name="Notes"
            component={NotesScreen}
            options={{
              tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <MaterialCommunityIcons
                  name="note-text"
                  size={size}
                  color={color}
                />
              ),
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <MaterialCommunityIcons
                  name="cog"
                  size={size}
                  color={color}
                />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <ReduxProvider store={store}>
        <AppContent />
      </ReduxProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
