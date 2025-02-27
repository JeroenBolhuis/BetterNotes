import { useNavigation } from '@react-navigation/native';
import { Gesture, Directions } from 'react-native-gesture-handler';
import { useContext } from 'react';
import { NavigationStateContext } from '../../App';

type SwipeNavigationProps = {
  leftDestination?: string;
  rightDestination?: string;
};

/**
 * A custom hook that returns a gesture for screen navigation based on swipe direction
 * This hook also updates the NavigationStateContext when navigation occurs
 */
export const useSwipeNavigation = ({ 
  leftDestination, 
  rightDestination 
}: SwipeNavigationProps) => {
  const navigation = useNavigation();
  const { setCurrentTab } = useContext(NavigationStateContext);

  // Create swipe left gesture if leftDestination is provided
  const swipeLeftGesture = leftDestination 
    ? Gesture.Fling()
        .direction(Directions.LEFT)
        .onEnd(() => {
          // Update context first to avoid visual lag
          if (leftDestination) {
            setCurrentTab(leftDestination);
          }
          // Then actually navigate
          navigation.navigate(leftDestination as never);
        })
    : undefined;

  // Create swipe right gesture if rightDestination is provided
  const swipeRightGesture = rightDestination
    ? Gesture.Fling()
        .direction(Directions.RIGHT)
        .onEnd(() => {
          // Update context first to avoid visual lag
          if (rightDestination) {
            setCurrentTab(rightDestination);
          }
          // Then actually navigate
          navigation.navigate(rightDestination as never);
        })
    : undefined;

  // Combine gestures if both are defined
  if (swipeLeftGesture && swipeRightGesture) {
    return Gesture.Simultaneous(swipeLeftGesture, swipeRightGesture);
  }
  
  // Return individual gesture or undefined if neither is provided
  return swipeLeftGesture || swipeRightGesture || Gesture.Fling();
}; 