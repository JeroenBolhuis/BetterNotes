import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Dimensions, Animated, BackHandler, ScrollView, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { Portal, Text, Button, TextInput, useTheme, IconButton, Divider } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { updateNote, deleteNote, Note } from '../store/noteSlice';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';

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
  
  // Rich editor reference
  const richText = useRef<RichEditor>(null);

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

  const handleEditorChange = (html: string) => {
    setContent(html);
  };

  const modalBackgroundColor = theme.dark 
    ? theme.colors.elevation.level3
    : theme.colors.surface;

  if (!visible && !isAnimatingOut) return null;

  // Define editor actions to include
  const editorActions = [
    actions.setBold,
    actions.setItalic,
    actions.setUnderline,
    actions.heading1,
    actions.heading2,
    actions.insertBulletsList,
    actions.insertOrderedList,
    actions.alignLeft,
    actions.alignCenter,
    actions.alignRight,
    actions.undo,
    actions.redo,
  ];

  // Custom CSS for the editor
  const editorInitialStyle = {
    backgroundColor: 'transparent',
    color: theme.colors.onSurface,
    placeholderColor: theme.colors.onSurfaceVariant,
    contentCSSText: `
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Ubuntu, sans-serif;
      font-size: 16px;
      padding: 12px;
      min-height: ${height * 0.6}px;
    `
  };

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
              defaultValue={title}
              onChangeText={setTitle}
              style={styles.titleInput}
              mode="flat"
              placeholder="Note Title"
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              key={`title-input-${note.id}`}
              autoCapitalize="sentences"
              autoCorrect={true}
              spellCheck={true}
              cursorColor={theme.colors.primary}
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
          keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        >
          <RichToolbar
            editor={richText}
            actions={editorActions}
            iconTint={theme.colors.onSurface}
            selectedIconTint={theme.colors.primary}
            style={[styles.toolbar, { backgroundColor: theme.colors.surfaceVariant }]}
          />
          
          <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
            {visible && (
              <RichEditor
                ref={richText}
                initialContentHTML={content}
                onChange={handleEditorChange}
                placeholder="Start typing your note here..."
                style={styles.richEditor}
                initialHeight={height * 0.6}
                useContainer={true}
                editorStyle={editorInitialStyle}
                pasteAsPlainText={true}
                disabled={false}
              />
            )}
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
  },
  richEditor: {
    flex: 1,
    minHeight: height * 0.6,
  },
  toolbar: {
    borderRadius: 8,
    margin: 8,
  },
  saveButtonContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  saveButton: {
    borderRadius: 8,
  },
}); 