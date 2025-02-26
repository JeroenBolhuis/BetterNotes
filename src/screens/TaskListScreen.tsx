import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { Task, completeTask } from '../store/taskSlice';
import { TaskItem } from '../components/TaskItem';
import { calculateCurrentPriority } from '../utils/priorityCalculator';

export const TaskListScreen: React.FC = () => {
  const dispatch = useDispatch();
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const [sortedTasks, setSortedTasks] = useState<Task[]>([]);

  const handleComplete = useCallback((id: string) => {
    dispatch(completeTask(id));
  }, [dispatch]);

  useEffect(() => {
    // Sort tasks by current priority
    const sorted = [...tasks].sort((a, b) => {
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      return calculateCurrentPriority(b) - calculateCurrentPriority(a);
    });
    setSortedTasks(sorted);
  }, [tasks]);

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedTasks}
        renderItem={({ item }) => (
          <TaskItem task={item} onComplete={handleComplete} />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
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
  },
}); 