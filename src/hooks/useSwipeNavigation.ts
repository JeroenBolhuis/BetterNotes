import { useNavigation } from '@react-navigation/native';
import { Gesture } from 'react-native-gesture-handler';
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

  // Create a pan gesture that handles both left and right swipes
  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .onEnd((event) => {
      // Detect horizontal direction of the swipe
      if (event.translationX < -50 && leftDestination) {
        // Swiped left - go to left destination
        setCurrentTab(leftDestination);
        navigation.navigate(leftDestination as never);
      } else if (event.translationX > 50 && rightDestination) {
        // Swiped right - go to right destination
        setCurrentTab(rightDestination);
        navigation.navigate(rightDestination as never);
      }
    });

  return panGesture;
}; 