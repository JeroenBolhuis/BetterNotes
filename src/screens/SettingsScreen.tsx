import React from 'react';
import { View, StyleSheet } from 'react-native';
import { List, RadioButton, useTheme } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setThemeMode, ThemeMode } from '../store/settingsSlice';
import { GestureDetector } from 'react-native-gesture-handler';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';

export const SettingsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const themeMode = useSelector((state: RootState) => state.settings.themeMode);

  // Use the custom swipe navigation hook
  const swipeGesture = useSwipeNavigation({ 
    leftDestination: 'Tasks',
    rightDestination: 'Calculator'
  });

  const handleThemeChange = (value: string) => {
    dispatch(setThemeMode(value as ThemeMode));
  };

  return (
    <GestureDetector gesture={swipeGesture}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <List.Section>
          <List.Subheader style={{ color: theme.colors.onBackground }}>Theme</List.Subheader>
          <RadioButton.Group onValueChange={handleThemeChange} value={themeMode}>
            <List.Item
              title="Light"
              titleStyle={{ color: theme.colors.onBackground }}
              left={props => <RadioButton {...props} value="light" />}
              onPress={() => handleThemeChange('light')}
            />
            <List.Item
              title="Dark"
              titleStyle={{ color: theme.colors.onBackground }}
              left={props => <RadioButton {...props} value="dark" />}
              onPress={() => handleThemeChange('dark')}
            />
          </RadioButton.Group>
        </List.Section>
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 