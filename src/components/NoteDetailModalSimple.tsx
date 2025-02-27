import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Dimensions, Animated, BackHandler, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Portal, Text, Button, TextInput, useTheme, IconButton, Divider } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { updateNote, deleteNote, Note } from '../store/noteSlice';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface NoteDetailModalSimpleProps {
  visible: boolean;
  note: Note;
  onDismiss: () => void;
}

const { height, width } = Dimensions.get('window');

export const NoteDetailModalSimple: React.FC<NoteDetailModalSimpleProps> = ({ visible, note, onDismiss }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isEdited, setIsEdited] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const textInputRef = useRef<any>(null);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);

  // Animation values
  const slideAnim = useRef(new Animated.Value(width)).current;

  // Initialize form when modal is opened
  useEffect(() => {
    if (visible) {
      try {
        setTitle(note.title || '');
        setContent(note.content || '');
        setIsEdited(false);
        setIsAnimatingOut(false);
        setIsEditMode(false);
        
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11
        }).start();
      } catch (error) {
        console.error('Error initializing note form:', error);
        // Fallback to empty values if there's an error
        setTitle('');
        setContent('');
      }
    }
  }, [visible, note]);

  // Handle back button press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible) {
        if (isEditMode && isEdited) {
          // If in edit mode with changes, just exit edit mode without saving
          setIsEditMode(false);
          // Revert content to original
          setContent(note.content || '');
          setTitle(note.title || '');
          setIsEdited(false);
          return true;
        } else {
          handleDismiss();
          return true;
        }
      }
      return false;
    });

    return () => backHandler.remove();
  }, [visible, isEditMode, isEdited]);

  // Track changes
  useEffect(() => {
    try {
      if (title !== (note.title || '') || content !== (note.content || '')) {
        setIsEdited(true);
      } else {
        setIsEdited(false);
      }
    } catch (error) {
      console.error('Error tracking changes:', error);
    }
  }, [title, content, note]);

  const handleDismiss = useCallback(() => {
    try {
      if (isEdited && !isEditMode) {
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
    } catch (error) {
      console.error('Error dismissing modal:', error);
      onDismiss();
    }
  }, [isEdited, onDismiss, isEditMode]);

  const saveChanges = () => {
    try {
      if (!title.trim()) return;

      dispatch(updateNote({
        ...note,
        title: title.trim(),
        content: content,
        updatedAt: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };

  const handleDelete = () => {
    try {
      dispatch(deleteNote(note.id));
      handleDismiss();
    } catch (error) {
      console.error('Error deleting note:', error);
      onDismiss();
    }
  };

  const toggleEditMode = () => {
    if (isEditMode && isEdited) {
      // Save changes when exiting edit mode
      saveChanges();
    }
    setIsEditMode(!isEditMode);
  };

  // Handle selection change in the text input
  const handleSelectionChange = (event: any) => {
    try {
      setSelectionStart(event.nativeEvent.selection.start);
      setSelectionEnd(event.nativeEvent.selection.end);
    } catch (error) {
      console.error('Error handling selection change:', error);
    }
  };

  // Formatting functions
  const insertAtCursor = (prefix: string, suffix: string = '') => {
    try {
      const newContent = 
        content.substring(0, selectionStart) + 
        prefix + 
        content.substring(selectionStart, selectionEnd) + 
        suffix + 
        content.substring(selectionEnd);
      
      setContent(newContent);
      
      // Focus back on the text input after a short delay
      setTimeout(() => {
        if (textInputRef.current) {
          textInputRef.current.focus();
        }
      }, 100);
    } catch (error) {
      console.error('Error inserting at cursor:', error);
    }
  };

  const insertHeader = () => insertAtCursor('\n# ');
  const insertSubheader = () => insertAtCursor('\n## ');
  const insertBulletList = () => insertAtCursor('\n- ');
  const insertNumberedList = () => insertAtCursor('\n1. ');
  const insertBold = () => insertAtCursor('**', '**');
  const insertItalic = () => insertAtCursor('_', '_');

  // Function to render markdown-like content
  const renderFormattedContent = (text: string) => {
    if (!text) return null;
    
    // Split the text into lines
    const lines = text.split('\n');
    
    return (
      <View>
        {lines.map((line, index) => {
          // Header 1
          if (line.startsWith('# ')) {
            return (
              <Text key={index} style={styles.header1}>
                {line.substring(2)}
              </Text>
            );
          }
          // Header 2
          else if (line.startsWith('## ')) {
            return (
              <Text key={index} style={styles.header2}>
                {line.substring(3)}
              </Text>
            );
          }
          // Bullet list
          else if (line.startsWith('- ')) {
            return (
              <View key={index} style={styles.bulletItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listItemText}>{line.substring(2)}</Text>
              </View>
            );
          }
          // Numbered list
          else if (/^\d+\.\s/.test(line)) {
            const number = line.split('.')[0];
            return (
              <View key={index} style={styles.numberedItem}>
                <Text style={styles.number}>{number}.</Text>
                <Text style={styles.listItemText}>{line.substring(number.length + 2)}</Text>
              </View>
            );
          }
          // Regular text - process bold and italic
          else {
            let processedText = line;
            
            // Process text for bold and italic formatting
            const parts = [];
            let lastIndex = 0;
            
            // Find bold text
            const boldRegex = /\*\*(.*?)\*\*/g;
            let boldMatch;
            while ((boldMatch = boldRegex.exec(processedText)) !== null) {
              if (lastIndex < boldMatch.index) {
                parts.push({
                  text: processedText.substring(lastIndex, boldMatch.index),
                  style: 'normal'
                });
              }
              parts.push({
                text: boldMatch[1],
                style: 'bold'
              });
              lastIndex = boldMatch.index + boldMatch[0].length;
            }
            
            // Add remaining text
            if (lastIndex < processedText.length) {
              parts.push({
                text: processedText.substring(lastIndex),
                style: 'normal'
              });
            }
            
            // If no bold formatting was found, check for italic
            if (parts.length === 0) {
              const italicRegex = /_(.*?)_/g;
              let italicMatch;
              while ((italicMatch = italicRegex.exec(processedText)) !== null) {
                if (lastIndex < italicMatch.index) {
                  parts.push({
                    text: processedText.substring(lastIndex, italicMatch.index),
                    style: 'normal'
                  });
                }
                parts.push({
                  text: italicMatch[1],
                  style: 'italic'
                });
                lastIndex = italicMatch.index + italicMatch[0].length;
              }
              
              // Add remaining text
              if (lastIndex < processedText.length) {
                parts.push({
                  text: processedText.substring(lastIndex),
                  style: 'normal'
                });
              }
            }
            
            // If no formatting was found, just add the whole line
            if (parts.length === 0) {
              parts.push({
                text: processedText,
                style: 'normal'
              });
            }
            
            return (
              <Text key={index} style={styles.paragraph}>
                {parts.map((part, partIndex) => (
                  <Text
                    key={partIndex}
                    style={
                      part.style === 'bold'
                        ? styles.boldText
                        : part.style === 'italic'
                        ? styles.italicText
                        : null
                    }
                  >
                    {part.text}
                  </Text>
                ))}
              </Text>
            );
          }
        })}
      </View>
    );
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
            {isEditMode ? (
              <TextInput
                value={title}
                onChangeText={setTitle}
                style={styles.titleInput}
                mode="flat"
                placeholder="Note Title"
                underlineColor="transparent"
                activeUnderlineColor="transparent"
              />
            ) : (
              <Text style={styles.titleText}>{title}</Text>
            )}
          </View>
          <IconButton
            icon={isEditMode ? "content-save" : "pencil"}
            size={24}
            onPress={toggleEditMode}
          />
          <IconButton
            icon="delete"
            size={24}
            onPress={handleDelete}
          />
        </View>
        
        <Divider />
        
        {/* Formatting Toolbar - only visible in edit mode */}
        {isEditMode && (
          <View style={[styles.toolbar, { backgroundColor: theme.colors.surfaceVariant }]}>
            <TouchableOpacity style={styles.toolbarButton} onPress={insertHeader}>
              <MaterialCommunityIcons name="format-header-1" size={22} color={theme.colors.onSurface} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarButton} onPress={insertSubheader}>
              <MaterialCommunityIcons name="format-header-2" size={22} color={theme.colors.onSurface} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarButton} onPress={insertBold}>
              <MaterialCommunityIcons name="format-bold" size={22} color={theme.colors.onSurface} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarButton} onPress={insertItalic}>
              <MaterialCommunityIcons name="format-italic" size={22} color={theme.colors.onSurface} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarButton} onPress={insertBulletList}>
              <MaterialCommunityIcons name="format-list-bulleted" size={22} color={theme.colors.onSurface} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarButton} onPress={insertNumberedList}>
              <MaterialCommunityIcons name="format-list-numbered" size={22} color={theme.colors.onSurface} />
            </TouchableOpacity>
          </View>
        )}
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.contentContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        >
          <ScrollView style={styles.scrollView}>
            {isEditMode ? (
              <TextInput
                ref={textInputRef}
                value={content}
                onChangeText={setContent}
                onSelectionChange={handleSelectionChange}
                style={styles.contentInput}
                mode="flat"
                placeholder="Start typing your note here..."
                multiline
                underlineColor="transparent"
                activeUnderlineColor="transparent"
              />
            ) : (
              renderFormattedContent(content)
            )}
          </ScrollView>
        </KeyboardAvoidingView>
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
    justifyContent: 'center',
  },
  titleInput: {
    backgroundColor: 'transparent',
    fontSize: 18,
    fontWeight: 'bold',
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 12,
  },
  toolbar: {
    flexDirection: 'row',
    padding: 8,
    borderRadius: 8,
    margin: 8,
    justifyContent: 'space-around',
  },
  toolbarButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
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
    minHeight: height * 0.6,
  },
  // Formatted content styles
  header1: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
  },
  header2: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 12,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 8,
  },
  numberedItem: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 8,
  },
  bullet: {
    width: 20,
    fontSize: 16,
  },
  number: {
    width: 24,
    fontSize: 16,
  },
  listItemText: {
    flex: 1,
    fontSize: 16,
  },
  boldText: {
    fontWeight: 'bold',
  },
  italicText: {
    fontStyle: 'italic',
  },
}); 