import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Provider as ReduxProvider } from 'react-redux';
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme, adaptNavigationTheme } from 'react-native-paper';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { store } from './src/store';
import { TaskListScreen } from './src/screens/TaskListScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { loadTasks } from './src/store/taskSlice';
import { loadTasks as loadTasksFromStorage } from './src/utils/storage';
import { useSelector } from 'react-redux';
import { RootState } from './src/store';

type TabParamList = {
  Tasks: undefined;
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

// Adapt navigation theme
const { LightTheme: AdaptedLightTheme, DarkTheme: AdaptedDarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

function AppContent() {
  const themeMode = useSelector((state: RootState) => state.settings.themeMode);
  
  const theme = themeMode === 'dark' ? CustomDarkTheme : CustomLightTheme;
  const navigationTheme = themeMode === 'dark' ? AdaptedDarkTheme : AdaptedLightTheme;

  useEffect(() => {
    const initializeApp = async () => {
      const tasks = await loadTasksFromStorage();
      store.dispatch(loadTasks(tasks));
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
