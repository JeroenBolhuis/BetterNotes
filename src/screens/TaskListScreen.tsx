import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Dimensions } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { TabView, TabBar } from 'react-native-tab-view';
import { useTheme, FAB } from 'react-native-paper';
import { RootState } from '../store';
import { Task, completeTask } from '../store/taskSlice';
import { TaskItem } from '../components/TaskItem';
import { AddTaskModal } from '../components/AddTaskModal';
import { calculateCurrentPriority } from '../utils/priorityCalculator';

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

  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);

  const handleComplete = useCallback((id: string) => {
    dispatch(completeTask(id));
  }, [dispatch]);

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
  }, [tasks]);

  const renderScene = ({ route }: { route: Route }) => {
    const data = route.key === 'active' ? activeTasks : completedTasks;

    return (
      <View style={[styles.scene, { backgroundColor: theme.colors.background }]}>
        <FlatList
          data={data}
          renderItem={({ item }) => (
            <TaskItem task={item} onComplete={handleComplete} />
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
        />
      </View>
    );
  };

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: theme.colors.primary }}
      style={{ backgroundColor: theme.colors.surface }}
      activeColor={theme.colors.primary}
      inactiveColor={theme.colors.onSurface}
      labelStyle={{ fontWeight: 'bold' }}
    />
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
            backgroundColor: theme.colors.primary,
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