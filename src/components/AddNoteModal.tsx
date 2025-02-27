import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Dimensions, Animated, BackHandler, TouchableWithoutFeedback } from 'react-native';
import { Portal, Text, Button, TextInput, useTheme } from 'react-native-paper';
import { PanGestureHandler, State, PanGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';
import { useDispatch } from 'react-redux';
import { addNote } from '../store/noteSlice';
import { nanoid } from '@reduxjs/toolkit';

interface AddNoteModalProps {
  visible: boolean;
  onDismiss: () => void;
}

const { height } = Dimensions.get('window');
const DRAG_THRESHOLD = 50;

export const AddNoteModal: React.FC<AddNoteModalProps> = ({ visible, onDismiss }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [title, setTitle] = useState('');
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

  const handleSubmit = () => {
    if (!title.trim()) return;

    const now = new Date().toISOString();
    
    dispatch(addNote({
      id: nanoid(),
      title: title.trim(),
      content: '',
      createdAt: now,
      updatedAt: now,
    }));

    // Reset form and close modal
    resetForm();
    handleDismiss();
  };

  const resetForm = () => {
    setTitle('');
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
                Create New Note
              </Text>
              
              <TextInput
                label="Note Title"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
                mode="outlined"
              />

              <View style={styles.actions}>
                <Button onPress={handleDismiss}>Cancel</Button>
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  disabled={!title.trim()}
                >
                  Create
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
}); 