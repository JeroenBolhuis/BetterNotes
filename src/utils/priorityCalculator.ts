import { differenceInDays, differenceInMinutes } from 'date-fns';
import { Task } from '../store/taskSlice';

// Cache to avoid recalculating priorities too frequently
const priorityCache = new Map<string, { priority: number, timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute in milliseconds

export const calculateCurrentPriority = (task: Task): number => {
  // If completed, return the starting priority (no escalation for completed tasks)
  if (task.completed) {
    return task.startPriority;
  }

  // Check cache first
  const now = Date.now();
  const cached = priorityCache.get(task.id);
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.priority;
  }

  // Simple case: no escalation
  if (!task.endPriority || !task.escalationDays) {
    const result = task.startPriority;
    priorityCache.set(task.id, { priority: result, timestamp: now });
    return result;
  }

  // Calculate days and minutes since creation for more precision
  const creationDate = new Date(task.createdAt);
  const daysSinceCreation = differenceInDays(new Date(), creationDate);
  
  // Full escalation reached
  if (daysSinceCreation >= task.escalationDays) {
    const result = task.endPriority;
    priorityCache.set(task.id, { priority: result, timestamp: now });
    return result;
  }

  // For more precise calculation, include partial days
  const totalMinutesSinceCreation = differenceInMinutes(new Date(), creationDate);
  const totalMinutesInEscalationPeriod = task.escalationDays * 24 * 60;
  
  const progress = Math.min(totalMinutesSinceCreation / totalMinutesInEscalationPeriod, 1);
  const priorityDiff = task.endPriority - task.startPriority;
  
  const result = Math.round(task.startPriority + (priorityDiff * progress));
  priorityCache.set(task.id, { priority: result, timestamp: now });
  return result;
};

// Function to clear cache (useful when app goes to background)
export const clearPriorityCache = () => {
  priorityCache.clear();
};