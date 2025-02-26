import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, Button, useTheme } from 'react-native-paper';
import { Task } from '../store/taskSlice';
import { calculateCurrentPriority } from '../utils/priorityCalculator';

interface TaskItemProps {
  task: Task;
  onComplete: (id: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onComplete }) => {
  const theme = useTheme();
  const currentPriority = useMemo(() => calculateCurrentPriority(task), [task]);

  const priorityColor = useMemo(() => {
    // Using a more sophisticated color gradient:
    // Low priority (0-33): Green to Yellow
    // Medium priority (34-66): Yellow to Orange
    // High priority (67-100): Orange to Red
    let hue;
    if (currentPriority <= 33) {
      // Green (120) to Yellow (60)
      hue = 120 - (currentPriority * 1.82); // 1.82 = (120-60)/33
    } else if (currentPriority <= 66) {
      // Yellow (60) to Orange (30)
      hue = 60 - ((currentPriority - 33) * 0.91); // 0.91 = (60-30)/33
    } else {
      // Orange (30) to Red (0)
      hue = 30 - ((currentPriority - 66) * 0.88); // 0.88 = 30/34
    }
    return `hsl(${hue}, 80%, 40%)`;
  }, [currentPriority]);

  return (
    <Card 
      style={[styles.card, { backgroundColor: theme.colors.surface }]} 
      mode="outlined"
    >
      <View style={[styles.priorityBar, { backgroundColor: priorityColor }]} />
      <Card.Content>
        <View style={styles.header}>
          <Text 
            variant="titleMedium" 
            style={[styles.title, { color: theme.colors.onSurface }]}
          >
            {task.title}
          </Text>
        </View>
        {task.endPriority && task.escalationDays && (
          <Text 
            variant="bodySmall" 
            style={[styles.escalation, { color: theme.colors.onSurfaceVariant }]}
          >
            Escalating over {task.escalationDays} days
          </Text>
        )}
      </Card.Content>
      <Card.Actions>
        <Button
          mode="contained"
          onPress={() => onComplete(task.id)}
          disabled={task.completed}
          style={task.completed ? { opacity: 0.6 } : undefined}
        >
          {task.completed ? 'Completed' : 'Complete'}
        </Button>
      </Card.Actions>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    marginRight: 8,
  },
  priorityBar: {
    height: 4,
    width: '100%',
  },
  escalation: {
    opacity: 0.7,
  },
}); 