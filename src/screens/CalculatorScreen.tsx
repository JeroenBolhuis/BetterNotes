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
          width: size === 'double' ? 140 : 70,
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
  const [parenCount, setParenCount] = useState(0); // Track open parentheses
  
  // Use the custom swipe navigation hook
  const swipeGesture = useSwipeNavigation({ 
    leftDestination: 'Settings',
    rightDestination: 'Notes'
  });
  
  // Input digit handler
  const inputDigit = (digit: string) => {
    setDisplay(display === '0' ? digit : display + digit);
  };
  
  // Decimal point handler
  const inputDecimal = () => {
    // Only add decimal if there isn't one in the current number segment
    const segments = display.split(/[\+\-\×\÷\(\)\^]/);
    const lastSegment = segments[segments.length - 1];
    
    if (!lastSegment.includes('.')) {
      setDisplay(display + '.');
    }
  };
  
  // Operation handler
  const handleOperation = (operator: string) => {
    // Don't allow consecutive operators
    const lastChar = display.charAt(display.length - 1);
    if (['+', '-', '×', '÷', '^', '.'].includes(lastChar)) {
      setDisplay(display.slice(0, -1) + operator);
    } else {
      setDisplay(display + operator);
    }
  };
  
  // Parenthesis handler
  const handleParenthesis = (paren: '(' | ')') => {
    if (paren === '(') {
      // Opening parenthesis
      setParenCount(parenCount + 1);
      
      if (display === '0') {
        setDisplay('(');
      } else {
        // Check if we need to add a multiplication operator before the parenthesis
        const lastChar = display.charAt(display.length - 1);
        if (lastChar !== '' && !isNaN(Number(lastChar)) && lastChar !== '(' && lastChar !== '+' && lastChar !== '-' && lastChar !== '×' && lastChar !== '÷' && lastChar !== '^') {
          setDisplay(display + '×(');
        } else {
          setDisplay(display + '(');
        }
      }
    } else {
      // Closing parenthesis - only add if we have open parentheses
      if (parenCount > 0) {
        setParenCount(parenCount - 1);
        setDisplay(display + ')');
      }
    }
  };
  
  // Handle power function
  const handlePower = () => {
    const lastChar = display.charAt(display.length - 1);
    if (lastChar !== '' && !['+', '-', '×', '÷', '(', '^', '.'].includes(lastChar)) {
      setDisplay(display + '^');
    }
  };
  
  // Handle square root
  const handleSquareRoot = () => {
    try {
      const lastNumber = getLastNumber(display);
      if (lastNumber !== null && lastNumber >= 0) {
        const rootResult = Math.sqrt(lastNumber);
        // Replace the last number with its square root
        const newDisplay = replaceLastNumber(display, rootResult);
        setDisplay(newDisplay);
      } else {
        setDisplay('Error');
        setTimeout(() => handleClear(), 1500);
      }
    } catch (error) {
      setDisplay('Error');
      setTimeout(() => handleClear(), 1500);
    }
  };
  
  // Extract the last number from a string
  const getLastNumber = (str: string): number | null => {
    // This is a simplified version - a more robust implementation would need
    // to handle the full expression parsing
    const match = str.match(/(-?\d*\.?\d+)$/);
    return match ? parseFloat(match[0]) : null;
  };
  
  // Replace the last number in the display with a new value
  const replaceLastNumber = (str: string, newValue: number): string => {
    const lastNumberRegex = /(-?\d*\.?\d+)$/;
    return str.replace(lastNumberRegex, String(newValue));
  };
  
  // Check if expression has balanced parentheses
  const hasBalancedParentheses = (expr: string): boolean => {
    let count = 0;
    for (let i = 0; i < expr.length; i++) {
      if (expr[i] === '(') count++;
      if (expr[i] === ')') count--;
      if (count < 0) return false; // More closing than opening
    }
    return count === 0; // Should have equal number of each
  };
  
  // Equal handler - evaluate the full expression
  const handleEqual = () => {
    try {
      // Check for unbalanced parentheses
      if (!hasBalancedParentheses(display)) {
        setDisplay('Error: Unbalanced ( )');
        setTimeout(() => handleClear(), 1500);
        return;
      }
      
      // Replace operators with JavaScript equivalents
      let expression = display
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/\^/g, '**');
        
      // Safely evaluate the expression
      const result = Function('"use strict"; return (' + expression + ')')();
      
      if (isNaN(result) || !isFinite(result)) {
        setDisplay('Error');
        setTimeout(() => handleClear(), 1500);
      } else {
        setDisplay(String(result));
      }
      
      setParenCount(0);
    } catch (error) {
      setDisplay('Error');
      setTimeout(() => handleClear(), 1500);
    }
  };
  
  // Clear handler
  const handleClear = () => {
    setDisplay('0');
    setParenCount(0);
  };
  
  // Backspace handler
  const handleBackspace = () => {
    if (display.length === 1) {
      setDisplay('0');
    } else {
      const lastChar = display.charAt(display.length - 1);
      if (lastChar === '(') {
        setParenCount(parenCount - 1);
      } else if (lastChar === ')') {
        setParenCount(parenCount + 1);
      }
      
      setDisplay(display.slice(0, -1));
    }
  };
  
  // Toggle sign handler - wrap the last number or entire expression with negative
  const toggleSign = () => {
    if (display === '0') return;
    
    try {
      const lastNumber = getLastNumber(display);
      if (lastNumber !== null) {
        // Toggle sign of last number
        const newValue = -lastNumber;
        const newDisplay = replaceLastNumber(display, newValue);
        setDisplay(newDisplay);
      } else {
        // No last number found, prepend -( to the whole expression
        setDisplay(`-${display}`);
      }
    } catch (error) {
      // Just prepend -
      setDisplay(`-${display}`);
    }
  };
  
  // Percentage handler - take last number and divide by 100
  const handlePercentage = () => {
    try {
      const lastNumber = getLastNumber(display);
      if (lastNumber !== null) {
        const percentValue = lastNumber / 100;
        const newDisplay = replaceLastNumber(display, percentValue);
        setDisplay(newDisplay);
      }
    } catch (error) {
      setDisplay('Error');
      setTimeout(() => {
        setDisplay(display);
      }, 1500);
    }
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
          {parenCount > 0 && (
            <Text 
              style={[
                styles.parensIndicator, 
                { color: theme.colors.error }
              ]}
            >
              {`Open: ${parenCount}`}
            </Text>
          )}
        </View>
        
        <View style={styles.buttonContainer}>
          {/* Advanced buttons */}
          <View style={styles.row}>
            <CalcButton label="(" onPress={() => handleParenthesis('(')} type="function" />
            <CalcButton label=")" onPress={() => handleParenthesis(')')} type="function" />
            <CalcButton label="^" onPress={handlePower} type="function" />
            <CalcButton label="√" onPress={handleSquareRoot} type="function" />
          </View>
          
          {/* Regular buttons */}
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
                  size={24} 
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
    padding: 10,
    alignItems: 'flex-end',
  },
  display: {
    fontSize: 40,
    fontWeight: 'bold',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    textAlign: 'right',
  },
  parensIndicator: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
    paddingRight: 16,
  },
  buttonContainer: {
    padding: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  button: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 35,
    margin: 3,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.25)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.85,
        shadowRadius: 2.5,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonText: {
    fontSize: 30,
    fontWeight: 'bold',
  },
}); 