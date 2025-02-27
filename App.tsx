import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Provider as ReduxProvider } from 'react-redux';
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme, NavigationState, CommonActions } from '@react-navigation/native';
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

// Create a navigation context to share navigation state across components
export const NavigationStateContext = React.createContext<{
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}>({
  currentTab: 'Tasks',
  setCurrentTab: () => {},
});

// Create a navigation folder structure following best practices
// Define navigation types
export type RootTabParamList = {
  Tasks: undefined;
  Notes: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

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

// Main app content with navigation
function AppContent() {
  const themeMode = useSelector((state: RootState) => state.settings.themeMode);
  const theme = themeMode === 'dark' ? CustomDarkTheme : CustomLightTheme;
  const navigationTheme = themeMode === 'dark' ? CustomNavigationDarkTheme : CustomNavigationLightTheme;
  
  // Reference to the navigation object
  const navigationRef = useRef(null);
  const [currentTab, setCurrentTab] = useState('Tasks');

  // Set up app initialization
  useEffect(() => {
    const initializeApp = async () => {
      const tasks = await loadTasksFromStorage();
      store.dispatch(loadTasks(tasks));
      
      const notes = await loadNotesFromStorage();
      store.dispatch(loadNotes(notes));
    };

    initializeApp();
  }, []);

  // Function to log navigation state changes - useful for debugging
  const onNavigationStateChange = (state: NavigationState | undefined) => {
    if (__DEV__ && state) {
      console.log('Navigation state changed:', state);
    }
    
    // Update the current tab when navigation state changes
    if (state && state.index !== undefined && state.routes) {
      setCurrentTab(state.routes[state.index].name);
    }
  };

  return (
    <NavigationStateContext.Provider value={{ currentTab, setCurrentTab }}>
      <PaperProvider theme={theme}>
        <NavigationContainer 
          theme={navigationTheme}
          ref={navigationRef}
          onStateChange={onNavigationStateChange}
        >
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarActiveTintColor: theme.colors.primary,
              tabBarInactiveTintColor: 'gray',
              tabBarStyle: {
                backgroundColor: theme.colors.surface,
              },
              headerStyle: {
                backgroundColor: theme.colors.surface,
              },
              headerTintColor: theme.colors.onSurface,
              // Use icon based on route name
              tabBarIcon: ({ color, size }) => {
                let iconName: "format-list-checks" | "note-text" | "cog" = "format-list-checks";

                if (route.name === 'Tasks') {
                  iconName = "format-list-checks";
                } else if (route.name === 'Notes') {
                  iconName = "note-text";
                } else if (route.name === 'Settings') {
                  iconName = "cog";
                }

                return (
                  <MaterialCommunityIcons
                    name={iconName}
                    size={size}
                    color={color}
                    testID={`tab-icon-${route.name.toLowerCase()}`}
                    accessibilityLabel={`${route.name} tab`}
                  />
                );
              },
            })}
            screenListeners={({ navigation }) => ({
              tabPress: (e) => {
                // Update current tab on tab press
                const target = e.target?.split('-')[0];
                if (target) {
                  setCurrentTab(target);
                }
              },
            })}
          >
            <Tab.Screen 
              name="Tasks" 
              component={TaskListScreen} 
              options={{ 
                title: "Tasks",
              }}
              listeners={({ navigation }) => ({
                focus: () => setCurrentTab('Tasks'),
              })}
            />
            <Tab.Screen 
              name="Notes" 
              component={NotesScreen}
              options={{
                title: "Notes",
              }}
              listeners={({ navigation }) => ({
                focus: () => setCurrentTab('Notes'),
              })}
            />
            <Tab.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{
                title: "Settings",
              }}
              listeners={({ navigation }) => ({
                focus: () => setCurrentTab('Settings'),
              })}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </NavigationStateContext.Provider>
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
