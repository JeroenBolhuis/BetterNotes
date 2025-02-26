import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, Dimensions, AppState, AppStateStatus } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { TabView, TabBar } from 'react-native-tab-view';
import { useTheme, FAB, Text, ActivityIndicator } from 'react-native-paper';
import { RootState } from '../store';
import { Task, completeTask } from '../store/taskSlice';
import { TaskItem } from '../components/TaskItem';
import { AddTaskModal } from '../components/AddTaskModal';
import { calculateCurrentPriority, clearPriorityCache } from '../utils/priorityCalculator';

type Route = {
  key: string;
  title: string;
};

const routes: Route[] = [
  { key: 'active', title: 'Active' },
  { key: 'completed', title: 'Completed' },
];

export const TaskListScreen: React.FC = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const [index, setIndex] = useState(0);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  
  // Task lists
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  
  // For periodic updates
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Handler for task completion
  const handleComplete = useCallback((id: string) => {
    dispatch(completeTask(id));
  }, [dispatch]);

  // Setup periodic priority updates
  useEffect(() => {
    // Function to handle app state changes
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) && 
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        clearPriorityCache();
        setForceUpdate(prev => prev + 1);
      }
      appStateRef.current = nextAppState;
    };

    // Subscribe to app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Set up interval for updating priorities
    updateIntervalRef.current = setInterval(() => {
      // Update the component to recalculate priorities
      setForceUpdate(prev => prev + 1);
    }, 60000); // Update every minute

    return () => {
      subscription.remove();
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  // Update and sort tasks
  useEffect(() => {
    // Sort and filter tasks
    const active = tasks.filter(task => !task.completed);
    const completed = tasks.filter(task => task.completed);

    // Sort active tasks by priority
    const sortedActive = [...active].sort((a, b) => 
      calculateCurrentPriority(b) - calculateCurrentPriority(a)
    );

    // Sort completed tasks by completion date (most recent first)
    const sortedCompleted = [...completed].sort((a, b) => 
      new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime()
    );

    setActiveTasks(sortedActive);
    setCompletedTasks(sortedCompleted);
  }, [tasks, forceUpdate]); // Also update when forceUpdate changes

  // Render tasks with optimizations
  const renderTask = useCallback(({ item }: { item: Task }) => (
    <TaskItem task={item} onComplete={handleComplete} />
  ), [handleComplete]);

  const keyExtractor = useCallback((item: Task) => item.id, []);

  const renderEmptyList = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
        {index === 0 
          ? "No tasks yet. Add your first task with the + button below."
          : "No completed tasks yet. Complete a task to see it here."
        }
      </Text>
    </View>
  ), [index, theme.colors.onSurfaceVariant]);

  const renderScene = useCallback(({ route }: { route: Route }) => {
    const data = route.key === 'active' ? activeTasks : completedTasks;

    return (
      <View style={[styles.scene, { backgroundColor: theme.colors.background }]}>
        <FlatList
          data={data}
          renderItem={renderTask}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            styles.list,
            data.length === 0 && styles.emptyList
          ]}
          ListEmptyComponent={renderEmptyList}
        />
      </View>
    );
  }, [activeTasks, completedTasks, renderTask, theme.colors.background, renderEmptyList]);

  const renderTabBar = useCallback((props: any) => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: theme.colors.primary }}
      style={{ backgroundColor: theme.colors.surface }}
      activeColor={theme.colors.primary}
      inactiveColor={theme.colors.onSurface}
      labelStyle={{ fontWeight: 'bold' }}
    />
  ), [theme]);

  // Add high priority indicator on FAB if there are high priority tasks
  const hasHighPriorityTasks = activeTasks.some(
    task => calculateCurrentPriority(task) >= 80
  );

  return (
    <View style={styles.container}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: Dimensions.get('window').width }}
        renderTabBar={renderTabBar}
        style={{ backgroundColor: theme.colors.background }}
      />
      
      <FAB
        icon="plus"
        style={[
          styles.fab,
          {
            backgroundColor: hasHighPriorityTasks 
              ? theme.colors.error 
              : theme.colors.primary,
            elevation: 8,
          }
        ]}
        onPress={() => setIsAddModalVisible(true)}
        color={theme.colors.onPrimary}
        size="large"
      />

      <AddTaskModal
        visible={isAddModalVisible}
        onDismiss={() => setIsAddModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scene: {
    flex: 1,
  },
  list: {
    padding: 8,
    paddingBottom: 100, // Increased padding for larger FAB
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    borderRadius: 35,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
});