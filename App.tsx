import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Provider as ReduxProvider } from 'react-redux';
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
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
import { createNavigationContainerRef, StackActions } from '@react-navigation/native';

type TabParamList = {
  Tasks: undefined;
  Notes: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const SwipeableTabs = createMaterialTopTabNavigator<TabParamList>();
const navigationRef = createNavigationContainerRef<TabParamList>();

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

// Create a swipeable tab navigator that doesn't show the top tab bar
function SwipeableTabsNavigator() {
  const themeMode = useSelector((state: RootState) => state.settings.themeMode);
  const theme = themeMode === 'dark' ? CustomDarkTheme : CustomLightTheme;

  // Custom tab change handler to sync with bottom tabs
  const handleTabChange = (index: number) => {
    if (navigationRef.isReady()) {
      const routeName = ['Tasks', 'Notes', 'Settings'][index] as keyof TabParamList;
      navigationRef.dispatch(StackActions.replace(routeName));
    }
  };

  return (
    <SwipeableTabs.Navigator
      initialRouteName="Tasks"
      screenOptions={{
        tabBarStyle: { display: 'none' }, // Hide the tab bar
        swipeEnabled: true, // Enable swiping between tabs
        animationEnabled: true, // Enable animations
      }}
      screenListeners={{
        state: (e) => {
          const index = e.data.state?.index;
          if (index !== undefined) {
            handleTabChange(index);
          }
        }
      }}
    >
      <SwipeableTabs.Screen 
        name="Tasks" 
        component={TaskListScreen} 
        options={{ title: "Tasks" }}
      />
      <SwipeableTabs.Screen 
        name="Notes" 
        component={NotesScreen} 
        options={{ title: "Notes" }}
      />
      <SwipeableTabs.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: "Settings" }}
      />
    </SwipeableTabs.Navigator>
  );
}

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
      <NavigationContainer theme={navigationTheme} ref={navigationRef}>
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
            // Show headers for each screen
            headerShown: false, // Keep this false to avoid showing duplicate headers
          }}
        >
          <Tab.Screen
            name="Tasks"
            component={SwipeableTabsNavigator}
            options={{
              tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <MaterialCommunityIcons
                  name="format-list-checks"
                  size={size}
                  color={color}
                />
              ),
            }}
            listeners={{
              tabPress: e => {
                // Prevent default action
                e.preventDefault();
                // Go to Tasks route in both navigators
                if (navigationRef.isReady()) {
                  navigationRef.navigate('Tasks');
                }
              },
            }}
          />
          <Tab.Screen
            name="Notes"
            component={SwipeableTabsNavigator}
            options={{
              tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <MaterialCommunityIcons
                  name="note-text"
                  size={size}
                  color={color}
                />
              ),
            }}
            listeners={{
              tabPress: e => {
                // Prevent default action
                e.preventDefault();
                // Go to Notes route in both navigators
                if (navigationRef.isReady()) {
                  navigationRef.navigate('Notes');
                }
              },
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SwipeableTabsNavigator}
            options={{
              tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <MaterialCommunityIcons
                  name="cog"
                  size={size}
                  color={color}
                />
              ),
            }}
            listeners={{
              tabPress: e => {
                // Prevent default action
                e.preventDefault();
                // Go to Settings route in both navigators
                if (navigationRef.isReady()) {
                  navigationRef.navigate('Settings');
                }
              },
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
