import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, IconButton, useTheme, Dialog, Button, Portal } from 'react-native-paper';
import { Task } from '../store/taskSlice';
import { calculateCurrentPriority } from '../utils/priorityCalculator';
import { differenceInDays } from 'date-fns';

interface TaskItemProps {
  task: Task;
  onComplete: (id: string) => void;
  isCompleted?: boolean;
  onReopen?: (id: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onComplete, 
  isCompleted = false,
  onReopen 
}) => {
  const theme = useTheme();
  const [reopenDialogVisible, setReopenDialogVisible] = useState(false);
  const currentPriority = useMemo(() => calculateCurrentPriority(task), [task]);

  // Calculate escalation progress
  const escalationProgress = useMemo(() => {
    if (!task.endPriority || !task.escalationDays) return null;
    
    const daysSinceCreation = differenceInDays(
      new Date(),
      new Date(task.createdAt)
    );
    
    return Math.min(daysSinceCreation / task.escalationDays, 1);
  }, [task]);

  // Enhanced priority color with better visibility
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

  // Calculate completion date display
  const completionDateDisplay = useMemo(() => {
    if (!task.completedAt) return null;
    
    const completedDate = new Date(task.completedAt);
    const now = new Date();
    const daysSinceCompletion = differenceInDays(now, completedDate);
    
    if (daysSinceCompletion === 0) return 'Completed today';
    if (daysSinceCompletion === 1) return 'Completed yesterday';
    if (daysSinceCompletion < 7) return `Completed ${daysSinceCompletion} days ago`;
    return `Completed on ${completedDate.toLocaleDateString()}`;
  }, [task.completedAt]);

  // Handle reopen confirmation
  const showReopenDialog = () => {
    setReopenDialogVisible(true);
  };

  const hideReopenDialog = () => {
    setReopenDialogVisible(false);
  };

  const handleReopen = () => {
    if (onReopen) {
      onReopen(task.id);
    }
    hideReopenDialog();
  };

  return (
    <>
      <Card 
        style={[
          styles.card, 
          { 
            backgroundColor: theme.colors.surface,
            opacity: isCompleted ? 0.7 : 1,
          }
        ]} 
        mode="elevated"
      >
        <View style={styles.cardContent}>
          {/* Left color indicator */}
          <View 
            style={[
              styles.priorityIndicator, 
              { 
                backgroundColor: isCompleted ? theme.colors.surfaceVariant : priorityColor 
              }
            ]} 
          />
          
          {/* Task content */}
          <View style={styles.taskContent}>
            <Text 
              variant="titleMedium" 
              style={[
                styles.title, 
                { 
                  color: theme.colors.onSurface,
                  textDecorationLine: isCompleted ? 'line-through' : 'none',
                }
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {task.title}
            </Text>
            
            {isCompleted && completionDateDisplay ? (
              <Text 
                variant="bodySmall" 
                style={[styles.completionDate, { color: theme.colors.onSurfaceVariant }]}
              >
                {completionDateDisplay}
              </Text>
            ) : (
              task.endPriority && task.escalationDays && escalationProgress !== null && (
                <View style={styles.escalationContainer}>
                  <Text 
                    variant="bodySmall" 
                    style={[styles.escalation, { color: theme.colors.onSurfaceVariant }]}
                    numberOfLines={1}
                  >
                    {escalationProgress === 1 
                      ? 'Fully escalated'
                      : `Escalating: ${Math.round(escalationProgress * 100)}%`
                    }
                  </Text>
                  <View style={styles.progressBarContainer}>
                    <View 
                      style={[
                        styles.progressBar, 
                        { 
                          backgroundColor: priorityColor,
                          width: `${escalationProgress * 100}%` 
                        }
                      ]} 
                    />
                  </View>
                </View>
              )
            )}
          </View>
          
          {/* Action buttons */}
          {!isCompleted ? (
            <IconButton
              icon="check-circle-outline"
              iconColor={priorityColor}
              size={24}
              onPress={() => onComplete(task.id)}
              style={styles.actionButton}
            />
          ) : (
            <IconButton
              icon="refresh"
              iconColor={theme.colors.primary}
              size={24}
              onPress={showReopenDialog}
              style={styles.actionButton}
            />
          )}
        </View>
      </Card>

      {/* Reopen Confirmation Dialog */}
      <Portal>
        <Dialog visible={reopenDialogVisible} onDismiss={hideReopenDialog}>
          <Dialog.Title>Reopen Task</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">Are you sure you want to reopen this task?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideReopenDialog}>Cancel</Button>
            <Button onPress={handleReopen}>Reopen</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  priorityIndicator: {
    width: 6,
    height: '100%',
    alignSelf: 'stretch',
  },
  taskContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingRight: 4,
    justifyContent: 'center',
  },
  title: {
    marginBottom: 2,
  },
  escalationContainer: {
    width: '100%',
  },
  escalation: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 1.5,
    overflow: 'hidden',
    width: '100%',
  },
  progressBar: {
    height: '100%',
  },
  actionButton: {
    margin: 0,
  },
  completionDate: {
    fontSize: 12,
    opacity: 0.7,
  },
});