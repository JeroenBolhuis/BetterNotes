import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Dimensions, Animated, BackHandler, KeyboardAvoidingView, Platform } from 'react-native';
import { Portal, Text, Button, TextInput, useTheme, IconButton } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { addNote } from '../store/noteSlice';

// Simple ID generator that doesn't rely on crypto
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

interface AddNoteModalProps {
  visible: boolean;
  onDismiss: () => void;
}

const { height, width } = Dimensions.get('window');

export const AddNoteModal: React.FC<AddNoteModalProps> = ({ visible, onDismiss }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [title, setTitle] = useState('');
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(height)).current;
  
  // Reset form when modal is opened
  useEffect(() => {
    if (visible) {
      try {
        setTitle('');
        setIsAnimatingOut(false);
        
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11
        }).start();
      } catch (error) {
        console.error('Error initializing add note form:', error);
      }
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
    try {
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
    } catch (error) {
      console.error('Error dismissing modal:', error);
      onDismiss();
    }
  }, [onDismiss]);
  
  const handleSubmit = () => {
    try {
      if (!title.trim()) return;
      
      dispatch(addNote({
        id: generateId(),
        title: title.trim(),
        content: '', // Start with empty content
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      
      handleDismiss();
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };
  
  const modalBackgroundColor = theme.dark 
    ? theme.colors.elevation.level3
    : theme.colors.surface;
  
  if (!visible && !isAnimatingOut) return null;
  
  return (
    <Portal>
      <Animated.View
        style={[
          styles.overlay,
          {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            opacity: slideAnim.interpolate({
              inputRange: [0, height],
              outputRange: [1, 0],
            }),
          },
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoidingView}
        >
          <Animated.View
            style={[
              styles.container,
              {
                backgroundColor: modalBackgroundColor,
                transform: [
                  {
                    translateY: slideAnim,
                  },
                ],
              },
            ]}
          >
            <View style={styles.header}>
              <IconButton
                icon="close"
                size={24}
                onPress={handleDismiss}
              />
              <Text variant="titleLarge" style={styles.headerTitle}>
                Add Note
              </Text>
              <View style={{ width: 48 }} />
            </View>
            
            <View style={styles.content}>
              <TextInput
                label="Title"
                defaultValue={title}
                onChangeText={setTitle}
                mode="outlined"
                style={styles.input}
                placeholder="Enter note title"
                autoFocus
                key="add-note-title-input"
                autoCapitalize="sentences"
                autoCorrect={true}
                spellCheck={true}
                cursorColor={theme.colors.primary}
              />
              
              <Text style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
                Add a title for your note. You can add content after creating the note.
              </Text>
            </View>
            
            <View style={styles.actions}>
              <Button
                mode="text"
                onPress={handleDismiss}
                style={styles.button}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.button}
                disabled={!title.trim()}
              >
                Create
              </Button>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Portal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  keyboardAvoidingView: {
    width: '100%',
  },
  container: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  input: {
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
  },
  button: {
    marginLeft: 8,
  },
}); 