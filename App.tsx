import React, { useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { Provider as ReduxProvider } from 'react-redux';
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { store } from './src/store';
import { TaskListScreen } from './src/screens/TaskListScreen';
import { AddTaskScreen } from './src/screens/AddTaskScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { loadTasks } from './src/store/taskSlice';
import { loadTasks as loadTasksFromStorage } from './src/utils/storage';
import { useSelector } from 'react-redux';
import { RootState } from './src/store';

type TabParamList = {
  Tasks: undefined;
  'Add Task': undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

function AppContent() {
  const systemColorScheme = useColorScheme();
  const themeMode = useSelector((state: RootState) => state.settings.themeMode);
  
  const theme = useCallback(() => {
    if (themeMode === 'auto') {
      return systemColorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;
    }
    return themeMode === 'dark' ? MD3DarkTheme : MD3LightTheme;
  }, [themeMode, systemColorScheme]);

  useEffect(() => {
    const initializeApp = async () => {
      const tasks = await loadTasksFromStorage();
      store.dispatch(loadTasks(tasks));
    };

    initializeApp();
  }, []);

  return (
    <PaperProvider theme={theme()}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: theme().colors.primary,
            tabBarInactiveTintColor: 'gray',
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
            name="Add Task"
            component={AddTaskScreen}
            options={{
              tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <MaterialCommunityIcons
                  name="plus-circle-outline"
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
    <ReduxProvider store={store}>
      <AppContent />
    </ReduxProvider>
  );
}
