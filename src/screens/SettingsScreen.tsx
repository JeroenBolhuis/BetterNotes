import React from 'react';
import { View, StyleSheet } from 'react-native';
import { List, RadioButton, useTheme } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setThemeMode, ThemeMode } from '../store/settingsSlice';

export const SettingsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const themeMode = useSelector((state: RootState) => state.settings.themeMode);

  const handleThemeChange = (value: string) => {
    dispatch(setThemeMode(value as ThemeMode));
  };

  return (
    <View style={styles.container}>
      <List.Section>
        <List.Subheader>Theme</List.Subheader>
        <RadioButton.Group onValueChange={handleThemeChange} value={themeMode}>
          <List.Item
            title="Light"
            left={props => <RadioButton {...props} value="light" />}
            onPress={() => handleThemeChange('light')}
          />
          <List.Item
            title="Dark"
            left={props => <RadioButton {...props} value="dark" />}
            onPress={() => handleThemeChange('dark')}
          />
          <List.Item
            title="System"
            left={props => <RadioButton {...props} value="auto" />}
            onPress={() => handleThemeChange('auto')}
          />
        </RadioButton.Group>
      </List.Section>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 