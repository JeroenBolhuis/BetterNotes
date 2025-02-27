import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, Dimensions, AppState, AppStateStatus } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme, FAB, Text, ActivityIndicator, Divider } from 'react-native-paper';
import { RootState } from '../store';
import { Task, completeTask } from '../store/taskSlice';
import { TaskItem } from '../components/TaskItem';
import { AddTaskModal } from '../components/AddTaskModal';
import { calculateCurrentPriority, clearPriorityCache } from '../utils/priorityCalculator';
import { differenceInDays } from 'date-fns';

export const TaskListScreen: React.FC = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  
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

  // Separate and sort tasks
  const { activeTasks, completedTasks } = React.useMemo(() => {
    // Filter tasks
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

    return { activeTasks: sortedActive, completedTasks: sortedCompleted };
  }, [tasks, forceUpdate]);

  // Combine active and completed tasks for display
  const displayTasks = [...activeTasks, ...completedTasks];

  // Render tasks with optimizations
  const renderTask = useCallback(({ item, index }: { item: Task, index: number }) => {
    // Add a divider before the first completed task
    const isFirstCompletedTask = index === activeTasks.length && completedTasks.length > 0;
    
    return (
      <>
        {isFirstCompletedTask && (
          <View style={styles.completedDividerContainer}>
            <Divider style={styles.completedDivider} />
            <Text style={[styles.completedLabel, { color: theme.colors.onSurfaceVariant }]}>
              Completed Tasks
            </Text>
            <Divider style={styles.completedDivider} />
          </View>
        )}
        <TaskItem 
          task={item} 
          onComplete={handleComplete} 
          isCompleted={item.completed}
        />
      </>
    );
  }, [handleComplete, activeTasks.length, completedTasks.length, theme.colors.onSurfaceVariant]);

  const keyExtractor = useCallback((item: Task) => item.id, []);

  const renderEmptyList = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
        No tasks yet. Add your first task with the + button below.
      </Text>
    </View>
  ), [theme.colors.onSurfaceVariant]);

  // Add high priority indicator on FAB if there are high priority tasks
  const hasHighPriorityTasks = activeTasks.some(
    task => calculateCurrentPriority(task) >= 80
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={displayTasks}
        renderItem={renderTask}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.list,
          displayTasks.length === 0 && styles.emptyList
        ]}
        ListEmptyComponent={renderEmptyList}
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
  completedDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 8,
  },
  completedDivider: {
    flex: 1,
    height: 1,
  },
  completedLabel: {
    marginHorizontal: 8,
    fontSize: 12,
    opacity: 0.7,
  },
});