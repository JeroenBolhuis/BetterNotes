import { differenceInDays } from 'date-fns';
import { Task } from '../store/taskSlice';

export const calculateCurrentPriority = (task: Task): number => {
  if (!task.endPriority || !task.escalationDays) {
    return task.startPriority;
  }

  const daysSinceCreation = differenceInDays(
    new Date(),
    new Date(task.createdAt)
  );

  if (daysSinceCreation >= task.escalationDays) {
    return task.endPriority;
  }

  const progress = daysSinceCreation / task.escalationDays;
  const priorityDiff = task.endPriority - task.startPriority;
  
  return Math.round(task.startPriority + (priorityDiff * progress));
}; 