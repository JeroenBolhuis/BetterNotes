import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Dimensions, Animated, BackHandler, TouchableWithoutFeedback } from 'react-native';
import { Portal, Text, Button, TextInput, Switch, useTheme } from 'react-native-paper';
import { PanGestureHandler, State, PanGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';
import Slider from '@react-native-community/slider';
import { useDispatch } from 'react-redux';
import { addTask } from '../store/taskSlice';
import { nanoid } from '@reduxjs/toolkit';

interface AddTaskModalProps {
  visible: boolean;
  onDismiss: () => void;
}

const { height } = Dimensions.get('window');
const DRAG_THRESHOLD = 50;

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ visible, onDismiss }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [title, setTitle] = useState('');
  const [startPriority, setStartPriority] = useState(50);
  const [hasEndPriority, setHasEndPriority] = useState(false);
  const [endPriority, setEndPriority] = useState(80);
  const [escalationDays, setEscalationDays] = useState('14');
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  // Animation values
  const slideAnim = useRef(new Animated.Value(height)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  // Reset form when modal is opened
  useEffect(() => {
    if (visible) {
      // No need to reset the form here, just handle animation
      setIsAnimatingOut(false);
      translateY.setValue(0);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11
      }).start();
    }
  }, [visible]);

  // Handle back button press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible) {
        handleDismiss();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [visible]);

  const handleDismiss = useCallback(() => {
    setIsAnimatingOut(true);
    Animated.spring(slideAnim, {
      toValue: height,
      useNativeDriver: true,
      tension: 65,
      friction: 11
    }).start(() => {
      setIsAnimatingOut(false);
      onDismiss();
    });
  }, [onDismiss]);

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { useNativeDriver: true }
  );

  const handleStateChange = ({ nativeEvent }: PanGestureHandlerStateChangeEvent) => {
    if (nativeEvent.state === State.END) {
      if (nativeEvent.translationY > DRAG_THRESHOLD) {
        handleDismiss();
      } else {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11
        }).start();
      }
    }
  };

  // Improved slider handling
  const handleStartPriorityChange = useCallback((value: number) => {
    setStartPriority(value);
    // Ensure end priority is never less than start priority
    if (hasEndPriority && value > endPriority) {
      setEndPriority(value);
    }
  }, [hasEndPriority, endPriority]);

  const handleEscalationDaysChange = useCallback((text: string) => {
    // Only allow positive numbers
    const numericValue = text.replace(/[^0-9]/g, '');
    setEscalationDays(numericValue);
  }, []);

  const handleSubmit = () => {
    if (!title.trim()) return;

    dispatch(addTask({
      id: nanoid(),
      title: title.trim(),
      startPriority,
      endPriority: hasEndPriority ? endPriority : null,
      escalationDays: hasEndPriority ? parseInt(escalationDays, 10) || 1 : null,
      createdAt: new Date().toISOString(),
      completed: false,
      completedAt: null,
    }));

    // Reset form and close modal
    resetForm();
    handleDismiss();
  };

  const resetForm = () => {
    setTitle('');
    setStartPriority(50);
    setHasEndPriority(false);
    setEndPriority(80);
    setEscalationDays('14');
  };

  const modalBackgroundColor = theme.dark 
    ? theme.colors.elevation.level3
    : theme.colors.surface;

  if (!visible && !isAnimatingOut) return null;

  return (
    <Portal>
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: slideAnim.interpolate({
                inputRange: [0, height],
                outputRange: [1, 0],
              }),
            },
          ]}
          pointerEvents={visible ? 'auto' : 'none'}
        />
      </TouchableWithoutFeedback>
      <PanGestureHandler
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleStateChange}
      >
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{
                translateY: Animated.add(
                  slideAnim,
                  translateY
                ),
              }],
            },
          ]}
        >
          <TouchableWithoutFeedback>
            <View 
              style={[styles.modal, { backgroundColor: modalBackgroundColor }]}
            >
              <View style={styles.handle} />
              <Text
                variant="headlineSmall"
                style={[styles.title, { color: theme.colors.onSurface }]}
              >
                Add New Task
              </Text>
              
              <TextInput
                label="Task Title"
                defaultValue={title}
                onChangeText={setTitle}
                style={styles.input}
                mode="outlined"
                key="task-title-input"
                autoCapitalize="sentences"
                autoCorrect={true}
                spellCheck={true}
                cursorColor={theme.colors.primary}
              />

              <Text style={[styles.label, { color: theme.colors.onSurface }]}>
                Starting Priority: {startPriority}
              </Text>
              <Slider
                value={startPriority}
                onValueChange={handleStartPriorityChange}
                minimumValue={0}
                maximumValue={100}
                step={1}
                style={styles.slider}
                minimumTrackTintColor={theme.colors.primary}
                thumbTintColor={theme.colors.primary}
              />

              <View style={styles.switchContainer}>
                <Text style={{ color: theme.colors.onSurface }}>
                  Enable Priority Escalation
                </Text>
                <Switch
                  value={hasEndPriority}
                  onValueChange={setHasEndPriority}
                />
              </View>

              {hasEndPriority && (
                <>
                  <Text style={[styles.label, { color: theme.colors.onSurface }]}>
                    End Priority: {endPriority}
                  </Text>
                  <Slider
                    value={endPriority}
                    onValueChange={setEndPriority}
                    minimumValue={startPriority}
                    maximumValue={100}
                    step={1}
                    style={styles.slider}
                    minimumTrackTintColor={theme.colors.primary}
                    thumbTintColor={theme.colors.primary}
                  />

                  <TextInput
                    label="Days until end priority"
                    defaultValue={escalationDays}
                    onChangeText={handleEscalationDaysChange}
                    keyboardType="numeric"
                    style={styles.input}
                    mode="outlined"
                    key="escalation-days-input"
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    cursorColor={theme.colors.primary}
                  />
                </>
              )}

              <View style={styles.actions}>
                <Button onPress={handleDismiss}>Cancel</Button>
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  disabled={!title.trim()}
                >
                  Add Task
                </Button>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </PanGestureHandler>
    </Portal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  modal: {
    padding: 20,
    paddingTop: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.9,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(128, 128, 128, 0.5)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  slider: {
    marginBottom: 16,
    zIndex: 1, // Ensure slider is above other elements
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
});