import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Dimensions, Animated, BackHandler, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Portal, Text, Button, TextInput, useTheme, IconButton, Divider } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { updateNote, deleteNote, Note } from '../store/noteSlice';

interface NoteDetailModalProps {
  visible: boolean;
  note: Note;
  onDismiss: () => void;
}

const { height, width } = Dimensions.get('window');

export const NoteDetailModal: React.FC<NoteDetailModalProps> = ({ visible, note, onDismiss }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [isEdited, setIsEdited] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  // Animation values
  const slideAnim = useRef(new Animated.Value(width)).current;

  // Initialize form when modal is opened
  useEffect(() => {
    if (visible) {
      setTitle(note.title);
      setContent(note.content);
      setIsEdited(false);
      setIsAnimatingOut(false);
      
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11
      }).start();
    }
  }, [visible, note]);

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

  // Track changes
  useEffect(() => {
    if (title !== note.title || content !== note.content) {
      setIsEdited(true);
    } else {
      setIsEdited(false);
    }
  }, [title, content, note]);

  const handleDismiss = useCallback(() => {
    if (isEdited) {
      saveChanges();
    }
    
    setIsAnimatingOut(true);
    Animated.spring(slideAnim, {
      toValue: width,
      useNativeDriver: true,
      tension: 65,
      friction: 11
    }).start(() => {
      setIsAnimatingOut(false);
      onDismiss();
    });
  }, [isEdited, onDismiss]);

  const saveChanges = () => {
    if (!title.trim()) return;

    dispatch(updateNote({
      ...note,
      title: title.trim(),
      content: content,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleDelete = () => {
    dispatch(deleteNote(note.id));
    handleDismiss();
  };

  // Format content with markdown-like features
  const formatContent = (text: string) => {
    // Split by lines
    return text.split('\n').map((line, index) => {
      // Check for headers (# Header)
      if (line.startsWith('# ')) {
        return (
          <Text key={index} variant="headlineMedium" style={styles.headerText}>
            {line.substring(2)}
          </Text>
        );
      }
      // Check for subheaders (## Subheader)
      else if (line.startsWith('## ')) {
        return (
          <Text key={index} variant="titleLarge" style={styles.subheader}>
            {line.substring(3)}
          </Text>
        );
      }
      // Check for unordered list items (- Item)
      else if (line.startsWith('- ')) {
        return (
          <View key={index} style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listItemText}>{line.substring(2)}</Text>
          </View>
        );
      }
      // Check for ordered list items (1. Item)
      else if (/^\d+\.\s/.test(line)) {
        const number = line.match(/^\d+/)?.[0] || '';
        return (
          <View key={index} style={styles.listItem}>
            <Text style={styles.number}>{number}.</Text>
            <Text style={styles.listItemText}>{line.substring(number.length + 2)}</Text>
          </View>
        );
      }
      // Regular paragraph
      else {
        return (
          <Text key={index} style={styles.paragraph}>
            {line}
          </Text>
        );
      }
    });
  };

  const modalBackgroundColor = theme.dark 
    ? theme.colors.elevation.level3
    : theme.colors.surface;

  if (!visible && !isAnimatingOut) return null;

  return (
    <Portal>
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: modalBackgroundColor,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={handleDismiss}
          />
          <View style={styles.titleContainer}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              style={styles.titleInput}
              mode="flat"
              placeholder="Note Title"
              underlineColor="transparent"
              activeUnderlineColor="transparent"
            />
          </View>
          <IconButton
            icon="delete"
            size={24}
            onPress={handleDelete}
          />
        </View>
        
        <Divider />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.contentContainer}
        >
          <ScrollView style={styles.scrollView}>
            <TextInput
              value={content}
              onChangeText={setContent}
              style={styles.contentInput}
              mode="flat"
              placeholder="Start typing your note here..."
              multiline
              underlineColor="transparent"
              activeUnderlineColor="transparent"
            />
          </ScrollView>
        </KeyboardAvoidingView>
        
        {isEdited && (
          <View style={styles.saveButtonContainer}>
            <Button
              mode="contained"
              onPress={saveChanges}
              style={styles.saveButton}
            >
              Save Changes
            </Button>
          </View>
        )}
      </Animated.View>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  titleContainer: {
    flex: 1,
  },
  titleInput: {
    backgroundColor: 'transparent',
    fontSize: 18,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  contentInput: {
    backgroundColor: 'transparent',
    minHeight: height * 0.7,
  },
  saveButtonContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  saveButton: {
    borderRadius: 8,
  },
  // Formatted content styles
  headerText: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subheader: {
    marginTop: 12,
    marginBottom: 6,
    fontWeight: 'bold',
  },
  paragraph: {
    marginBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 8,
  },
  bullet: {
    width: 16,
    marginRight: 8,
  },
  number: {
    width: 24,
    marginRight: 8,
  },
  listItemText: {
    flex: 1,
  },
}); 