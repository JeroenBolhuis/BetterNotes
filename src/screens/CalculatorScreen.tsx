import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, useTheme, TouchableRipple } from 'react-native-paper';
import { GestureDetector } from 'react-native-gesture-handler';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Calculator button component
const CalcButton: React.FC<{
  label: string | React.ReactNode;
  onPress: () => void;
  size?: 'normal' | 'double';
  type?: 'number' | 'operator' | 'function';
}> = ({ label, onPress, size = 'normal', type = 'number' }) => {
  const theme = useTheme();
  
  // Define button colors based on type and theme
  const getBackgroundColor = () => {
    switch (type) {
      case 'operator':
        return theme.colors.primary;
      case 'function':
        return theme.colors.secondary;
      default:
        return theme.dark ? '#333333' : '#f0f0f0';
    }
  };
  
  const getTextColor = () => {
    switch (type) {
      case 'operator':
      case 'function':
        return theme.colors.onPrimary;
      default:
        return theme.colors.onBackground;
    }
  };
  
  return (
    <TouchableRipple
      onPress={onPress}
      style={[
        styles.button, 
        { 
          backgroundColor: getBackgroundColor(),
          width: size === 'double' ? 160 : 80,
        }
      ]}
    >
      {typeof label === 'string' ? (
        <Text 
          style={[
            styles.buttonText, 
            { color: getTextColor() }
          ]}
        >
          {label}
        </Text>
      ) : (
        label
      )}
    </TouchableRipple>
  );
};

export const CalculatorScreen: React.FC = () => {
  const theme = useTheme();
  const [display, setDisplay] = useState('0');
  const [firstOperand, setFirstOperand] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false);
  
  // Use the custom swipe navigation hook
  const swipeGesture = useSwipeNavigation({ 
    leftDestination: 'Notes',
    rightDestination: 'Settings'
  });
  
  // Input digit handler
  const inputDigit = (digit: string) => {
    if (waitingForSecondOperand) {
      setDisplay(digit);
      setWaitingForSecondOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };
  
  // Decimal point handler
  const inputDecimal = () => {
    if (waitingForSecondOperand) {
      setDisplay('0.');
      setWaitingForSecondOperand(false);
      return;
    }
    
    if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };
  
  // Backspace handler
  const handleBackspace = () => {
    if (waitingForSecondOperand) {
      return;
    }
    
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };
  
  // Operation handler
  const handleOperation = (nextOperator: string) => {
    const inputValue = parseFloat(display);
    
    if (firstOperand === null) {
      setFirstOperand(inputValue);
    } else if (operator) {
      const result = performCalculation();
      setDisplay(String(result));
      setFirstOperand(result);
    }
    
    setWaitingForSecondOperand(true);
    setOperator(nextOperator);
  };
  
  // Calculation logic
  const performCalculation = (): number => {
    const inputValue = parseFloat(display);
    
    if (firstOperand === null || operator === null) return inputValue;
    
    switch (operator) {
      case '+':
        return firstOperand + inputValue;
      case '-':
        return firstOperand - inputValue;
      case '×':
        return firstOperand * inputValue;
      case '÷':
        return firstOperand / inputValue;
      default:
        return inputValue;
    }
  };
  
  // Equal handler
  const handleEqual = () => {
    if (firstOperand === null || operator === null) return;
    
    const result = performCalculation();
    setDisplay(String(result));
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecondOperand(false);
  };
  
  // Clear handler
  const handleClear = () => {
    setDisplay('0');
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecondOperand(false);
  };
  
  // Toggle sign handler
  const toggleSign = () => {
    const newValue = parseFloat(display) * -1;
    setDisplay(String(newValue));
  };
  
  // Percentage handler
  const handlePercentage = () => {
    const currentValue = parseFloat(display);
    const newValue = currentValue / 100;
    setDisplay(String(newValue));
  };
  
  return (
    <GestureDetector gesture={swipeGesture}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.displayContainer}>
          <Text 
            style={[
              styles.display, 
              { 
                color: theme.colors.onBackground,
                backgroundColor: theme.dark ? '#121212' : '#f6f6f6',
              }
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {display}
          </Text>
          {operator && (
            <Text 
              style={[
                styles.operatorIndicator, 
                { color: theme.colors.primary }
              ]}
            >
              {operator}
            </Text>
          )}
        </View>
        
        <View style={styles.buttonContainer}>
          <View style={styles.row}>
            <CalcButton label="C" onPress={handleClear} type="function" />
            <CalcButton label="+/-" onPress={toggleSign} type="function" />
            <CalcButton label="%" onPress={handlePercentage} type="function" />
            <CalcButton label="÷" onPress={() => handleOperation('÷')} type="operator" />
          </View>
          
          <View style={styles.row}>
            <CalcButton label="7" onPress={() => inputDigit('7')} />
            <CalcButton label="8" onPress={() => inputDigit('8')} />
            <CalcButton label="9" onPress={() => inputDigit('9')} />
            <CalcButton label="×" onPress={() => handleOperation('×')} type="operator" />
          </View>
          
          <View style={styles.row}>
            <CalcButton label="4" onPress={() => inputDigit('4')} />
            <CalcButton label="5" onPress={() => inputDigit('5')} />
            <CalcButton label="6" onPress={() => inputDigit('6')} />
            <CalcButton label="-" onPress={() => handleOperation('-')} type="operator" />
          </View>
          
          <View style={styles.row}>
            <CalcButton label="1" onPress={() => inputDigit('1')} />
            <CalcButton label="2" onPress={() => inputDigit('2')} />
            <CalcButton label="3" onPress={() => inputDigit('3')} />
            <CalcButton label="+" onPress={() => handleOperation('+')} type="operator" />
          </View>
          
          <View style={styles.row}>
            <CalcButton label="0" onPress={() => inputDigit('0')} />
            <CalcButton label="." onPress={inputDecimal} />
            <CalcButton 
              label={
                <MaterialCommunityIcons 
                  name="backspace-outline" 
                  size={28} 
                  color={theme.colors.onPrimary}
                />
              } 
              onPress={handleBackspace} 
              type="function" 
            />
            <CalcButton label="=" onPress={handleEqual} type="operator" />
          </View>
        </View>
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  displayContainer: {
    padding: 24,
    alignItems: 'flex-end',
  },
  display: {
    fontSize: 48,
    fontWeight: 'bold',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    textAlign: 'right',
  },
  operatorIndicator: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    paddingRight: 16,
  },
  buttonContainer: {
    padding: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  button: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 40,
    margin: 4,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.2)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
}); 