import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Dimensions, 
  Animated, 
  BackHandler, 
  ScrollView, 
  Platform, 
  TouchableOpacity, 
  SafeAreaView,
  NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
  Keyboard
} from 'react-native';
import { 
  Portal, 
  Text, 
  TextInput, 
  useTheme, 
  IconButton, 
  Divider, 
  Surface 
} from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { updateNote, deleteNote, Note } from '../store/noteSlice';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';

interface NoteDetailModalSimpleProps {
  visible: boolean;
  note: Note;
  onDismiss: () => void;
}

interface TextSelection {
  start: number;
  end: number;
}

const { height, width } = Dimensions.get('window');
const HEADER_PADDING = Platform.OS === 'ios' ? 8 : 0;

/**
 * A simplified note detail modal with markdown editing capabilities
 * Supports headings and lists with a simple toolbar
 */
export const NoteDetailModalSimple: React.FC<NoteDetailModalSimpleProps> = ({ 
  visible, 
  note, 
  onDismiss 
}) => {
  // Theme and state management
  const theme = useTheme();
  const dispatch = useDispatch();
  
  // UI state
  const [isEdited, setIsEdited] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Content state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selection, setSelection] = useState<TextSelection>({ start: 0, end: 0 });
  const [textInputKey, setTextInputKey] = useState(Date.now()); // Key for TextInput refresh
  
  // Refs
  const textInputRef = useRef<any>(null);
  const slideAnim = useRef(new Animated.Value(width)).current;

  // Initialize form when modal is opened
  useEffect(() => {
    if (visible) {
      initializeModal();
    }
  }, [visible, note]);

  // Initialize the modal state
  const initializeModal = useCallback(() => {
        setTitle(note.title || '');
        setContent(note.content || '');
        setIsEdited(false);
        setIsAnimatingOut(false);
        setIsEditMode(false);
    setTextInputKey(Date.now()); // Reset key to force TextInput refresh
        
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11
        }).start();
  }, [note, slideAnim]);

  // Handle back button press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible) {
        if (isEditMode) {
          setIsEditMode(false);
          return true;
        } else {
          handleDismiss();
          return true;
        }
      }
      return false;
    });

    return () => backHandler.remove();
  }, [visible, isEditMode]);

  /**
   * Handle dismissing the modal with animation
   */
  const handleDismiss = () => {
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
  };

  /**
   * Save changes to the note
   */
  const saveChanges = useCallback(() => {
      if (!title.trim()) return;

      dispatch(updateNote({
        ...note,
        title: title.trim(),
        content: content,
        updatedAt: new Date().toISOString(),
      }));
  }, [title, content, note, dispatch]);

  /**
   * Delete the current note
   */
  const handleDelete = () => {
      dispatch(deleteNote(note.id));
      handleDismiss();
  };

  /**
   * Toggle between view and edit mode
   */
  const toggleEditMode = () => {
    if (isEditMode && isEdited) {
      saveChanges();
    }
    setIsEditMode(!isEditMode);
    
    // Force TextInput refresh when entering edit mode
    if (!isEditMode) {
      setTextInputKey(Date.now());
      
      // Focus the input after a short delay to ensure keyboard appears
      setTimeout(() => {
        if (textInputRef.current) {
          textInputRef.current.focus();
        }
      }, 100);
    }
  };

  /**
   * Handle text selection change
   */
  const handleSelectionChange = (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
    setSelection(e.nativeEvent.selection);
  };

  /**
   * Find the start position of the current line
   */
  const findLineStart = (text: string, cursorPosition: number): number => {
    if (cursorPosition === 0) return 0;
    
    let pos = cursorPosition - 1;
    while (pos > 0 && text[pos] !== '\n') {
      pos--;
    }
    
    return pos === 0 ? 0 : pos + 1;
  };

  /**
   * Get the content of the current line
   */
  const getCurrentLine = (text: string, cursorPosition: number): string => {
    const lineStart = findLineStart(text, cursorPosition);
    const lineEnd = text.indexOf('\n', cursorPosition);
    return text.substring(
      lineStart, 
      lineEnd === -1 ? text.length : lineEnd
    );
  };

  /**
   * Apply heading formatting to the current line
   */
  const handleHeading = (level: 1 | 2) => {
    if (!textInputRef.current) return;
    
    // Ensure input remains focused
    textInputRef.current.focus();
    
    const curText = content;
    const lineStart = findLineStart(curText, selection.start);
    const currentLine = getCurrentLine(curText, selection.start);
    
    // Check if the line already starts with the same heading level
    const prefix = level === 1 ? '# ' : '## ';
    const existingH1 = currentLine.startsWith('# ');
    const existingH2 = currentLine.startsWith('## ');
    
    let newText;
    let newCursorPosition;
    
    if ((level === 1 && existingH1) || (level === 2 && existingH2)) {
      // Remove the heading
      newText = curText.substring(0, lineStart) + 
                currentLine.substring(prefix.length) + 
                curText.substring(lineStart + currentLine.length);
      newCursorPosition = selection.start - prefix.length;
    } else if (existingH1 || existingH2) {
      // Replace with different heading level
      const oldPrefix = existingH1 ? '# ' : '## ';
      newText = curText.substring(0, lineStart) + 
                prefix + currentLine.substring(oldPrefix.length) + 
                curText.substring(lineStart + currentLine.length);
      newCursorPosition = selection.start - oldPrefix.length + prefix.length;
    } else {
      // Add new heading
      newText = curText.substring(0, lineStart) + 
                prefix + currentLine + 
                curText.substring(lineStart + currentLine.length);
      newCursorPosition = selection.start + prefix.length;
    }
    
    // Update content state
    setContent(newText);
    setIsEdited(true);
    
    // Force refresh the TextInput with new content
    refreshTextInput(newCursorPosition);
  };

  /**
   * Apply list formatting to the current line
   */
  const handleList = (type: 'bullet' | 'numbered') => {
    if (!textInputRef.current) return;
    
    // Ensure input remains focused
    textInputRef.current.focus();
    
    const curText = content;
    const lineStart = findLineStart(curText, selection.start);
    const currentLine = getCurrentLine(curText, selection.start);
    
    // Check if the line already starts with list formatting
    const bulletPrefix = '- ';
    const numberedPrefix = '1. ';
    const prefix = type === 'bullet' ? bulletPrefix : numberedPrefix;
    
    const isBullet = currentLine.startsWith(bulletPrefix);
    const isNumbered = currentLine.startsWith(numberedPrefix);
    
    let newText;
    let newCursorPosition;
    
    if ((type === 'bullet' && isBullet) || (type === 'numbered' && isNumbered)) {
      // Remove the list formatting
      newText = curText.substring(0, lineStart) + 
                currentLine.substring(prefix.length) + 
                curText.substring(lineStart + currentLine.length);
      newCursorPosition = selection.start - prefix.length;
    } else if (isBullet || isNumbered) {
      // Replace with different list type
      const oldPrefix = isBullet ? bulletPrefix : numberedPrefix;
      newText = curText.substring(0, lineStart) + 
                prefix + currentLine.substring(oldPrefix.length) + 
                curText.substring(lineStart + currentLine.length);
      newCursorPosition = selection.start - oldPrefix.length + prefix.length;
    } else {
      // Add new list formatting
      newText = curText.substring(0, lineStart) + 
                prefix + currentLine + 
                curText.substring(lineStart + currentLine.length);
      newCursorPosition = selection.start + prefix.length;
    }
    
    // Update content state
    setContent(newText);
    setIsEdited(true);
    
    // Force refresh the TextInput with new content
    refreshTextInput(newCursorPosition);
  };

  /**
   * Apply blockquote formatting to the current line
   */
  const handleBlockquote = () => {
    if (!textInputRef.current) return;
    
    // Ensure input remains focused
    textInputRef.current.focus();
    
    const curText = content;
    const lineStart = findLineStart(curText, selection.start);
    const currentLine = getCurrentLine(curText, selection.start);
    
    // Check if the line already starts with blockquote
    const prefix = '> ';
    const isBlockquote = currentLine.startsWith(prefix);
    
    let newText;
    let newCursorPosition;
    
    if (isBlockquote) {
      // Remove the blockquote
      newText = curText.substring(0, lineStart) + 
                currentLine.substring(prefix.length) + 
                curText.substring(lineStart + currentLine.length);
      newCursorPosition = selection.start - prefix.length;
    } else {
      // Add blockquote
      newText = curText.substring(0, lineStart) + 
                prefix + currentLine + 
                curText.substring(lineStart + currentLine.length);
      newCursorPosition = selection.start + prefix.length;
    }
    
    // Update content state
    setContent(newText);
    setIsEdited(true);
    
    // Force refresh the TextInput with new content
    refreshTextInput(newCursorPosition);
  };

  /**
   * Apply code block formatting (triple backticks)
   */
  const handleCodeBlock = () => {
    if (!textInputRef.current) return;
    
    // Ensure input remains focused
    textInputRef.current.focus();
    
    const curText = content;
    const selStart = selection.start;
    const selEnd = selection.end;
    
    // Check if there's selected text
    if (selStart === selEnd) {
      // No selection, insert empty code block with newlines
      const newText = curText.substring(0, selStart) + 
                     '```\n\n```' + 
                     curText.substring(selEnd);
      
      setContent(newText);
      setIsEdited(true);
      refreshTextInput(selStart + 4); // Position cursor after first set of backticks and newline
      return;
    }
    
    // Get selected text
    const selectedText = curText.substring(selStart, selEnd);
    
    // Check if already wrapped in code block
    const textBefore = curText.substring(0, selStart);
    const textAfter = curText.substring(selEnd);
    const hasBackticksBeforeNewline = textBefore.lastIndexOf('```') > textBefore.lastIndexOf('\n');
    const hasBackticksAfterNewline = textAfter.indexOf('```') < textAfter.indexOf('\n') || textAfter.indexOf('\n') === -1;
    
    let newText;
    let newCursorPosition;
    
    if (hasBackticksBeforeNewline && hasBackticksAfterNewline) {
      // Remove code block marks
      const startPos = textBefore.lastIndexOf('```');
      const endPos = textAfter.indexOf('```') + selEnd + 3;
      
      newText = curText.substring(0, startPos) + 
                selectedText + 
                curText.substring(endPos);
      newCursorPosition = startPos;
    } else {
      // Add code block marks
      newText = curText.substring(0, selStart) + 
                '```\n' + selectedText + '\n```' + 
                curText.substring(selEnd);
      newCursorPosition = selEnd + 8; // +8 for the backticks and newlines
    }
    
    // Update content state
    setContent(newText);
    setIsEdited(true);
    
    // Force refresh the TextInput with new content
    refreshTextInput(newCursorPosition);
  };

  /**
   * Force refresh the TextInput and set cursor position
   */
  const refreshTextInput = (cursorPosition: number) => {
    setTextInputKey(Date.now());
    
    // Update cursor position after refresh and ensure keyboard stays open
    setTimeout(() => {
      if (textInputRef.current) {
        textInputRef.current.focus();
        textInputRef.current.setNativeProps({
          selection: {
            start: cursorPosition,
            end: cursorPosition
          }
        });
      }
    }, 50);
  };

  // Background color based on theme
  const modalBackgroundColor = theme.dark 
    ? theme.colors.elevation.level3
    : theme.colors.surface;

  // Create dynamic markdown styles based on the current theme
  const dynamicMarkdownStyles = {
    body: {
      fontSize: 16,
      lineHeight: 24,
      color: theme.dark ? theme.colors.onSurface : undefined,
    },
    heading1: {
      fontSize: 24,
      fontWeight: 'bold',
      marginTop: 16,
      marginBottom: 8,
      color: theme.dark ? theme.colors.onSurface : undefined,
    },
    heading2: {
      fontSize: 20,
      fontWeight: 'bold',
      marginTop: 16,
      marginBottom: 8,
      color: theme.dark ? theme.colors.onSurface : undefined,
    },
    bullet_list: {
      marginLeft: 16,
    },
    ordered_list: {
      marginLeft: 16,
    },
    bullet_list_icon: {
      color: theme.dark ? theme.colors.onSurface : undefined,
    },
    ordered_list_icon: {
      color: theme.dark ? theme.colors.onSurface : undefined,
    },
    paragraph: {
      color: theme.dark ? theme.colors.onSurface : undefined,
    },
    blockquote: {
      backgroundColor: theme.dark ? theme.colors.elevation.level2 : '#f0f0f0',
      borderLeftColor: theme.colors.primary,
      borderLeftWidth: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginVertical: 8,
    },
    code_inline: {
      backgroundColor: theme.dark ? theme.colors.elevation.level3 : '#f5f5f5',
      color: theme.dark ? theme.colors.onSurface : undefined,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    code_block: {
      backgroundColor: theme.dark ? theme.colors.elevation.level3 : '#f5f5f5',
      color: theme.dark ? theme.colors.onSurface : undefined,
      padding: 12,
      borderRadius: 4,
      marginVertical: 8,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    fence: {
      backgroundColor: theme.dark ? theme.colors.elevation.level3 : '#f5f5f5',
      color: theme.dark ? theme.colors.onSurface : undefined,
      padding: 12,
      borderRadius: 4,
      marginVertical: 8,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
  };

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
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={handleDismiss}
            />
            <View style={styles.titleContainer}>
              {isEditMode ? (
                <TextInput
                  defaultValue={title}
                  onChangeText={(text) => {
                    setTitle(text);
                    setIsEdited(true);
                  }}
                  style={styles.titleInput}
                  mode="flat"
                  placeholder="Note Title"
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  autoCapitalize="sentences"
                  autoCorrect={true}
                  spellCheck={true}
                  cursorColor={theme.colors.primary}
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
          
          {/* Formatting Toolbar - Kept at the top */}
          {isEditMode && (
            <Surface style={styles.toolbar} elevation={2}>
              <ToolbarButton 
                icon="format-header-1" 
                onPress={() => handleHeading(1)} 
                color={theme.colors.onSurface}
              />
              <ToolbarButton 
                icon="format-header-2" 
                onPress={() => handleHeading(2)} 
                color={theme.colors.onSurface}
              />
              <ToolbarButton 
                icon="format-list-bulleted" 
                onPress={() => handleList('bullet')} 
                color={theme.colors.onSurface}
              />
              <ToolbarButton 
                icon="format-list-numbered" 
                onPress={() => handleList('numbered')} 
                color={theme.colors.onSurface}
              />
              <ToolbarButton 
                icon="format-quote-close" 
                onPress={handleBlockquote} 
                color={theme.colors.onSurface}
              />
              <ToolbarButton 
                icon="code-braces-box" 
                onPress={handleCodeBlock} 
                color={theme.colors.onSurface}
              />
            </Surface>
          )}
          
          {/* Content Area */}
          <View 
            style={styles.contentContainer}
            pointerEvents="box-none"
          >
              {isEditMode ? (
              // Edit Mode - Using defaultValue with key prop for refresh
                <TextInput
                  key={textInputKey}
                  ref={textInputRef}
                  defaultValue={content}
                  onChangeText={(text) => {
                    setContent(text);
                    setIsEdited(true);
                  }}
                  onSelectionChange={handleSelectionChange}
                  style={[
                    styles.contentInput,
                    { color: theme.colors.onSurface }
                  ]}
                  multiline
                  placeholder="Start typing your note here..."
                  placeholderTextColor={theme.colors.onSurfaceDisabled}
                  mode="flat"
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                  cursorColor={theme.colors.primary}
                  blurOnSubmit={false}
                  keyboardType="default"
                />
              ) : (
              // View Mode - Renders markdown
              <ScrollView style={styles.scrollView}>
                <Markdown style={dynamicMarkdownStyles}>
                  {content || "No content"}
                </Markdown>
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </Animated.View>
    </Portal>
  );
};

/**
 * Toolbar button component for formatting actions
 */
interface ToolbarButtonProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  color: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ icon, onPress, color }) => (
  <TouchableOpacity 
    style={styles.toolbarButton} 
    onPress={(e) => {
      // Prevent default behavior that might dismiss keyboard
      e.preventDefault?.();
      // Use setTimeout to ensure the keyboard doesn't dismiss
      setTimeout(() => {
        onPress();
      }, 10);
    }}
    activeOpacity={0.6}
  >
    <MaterialCommunityIcons 
      name={icon} 
      size={24} 
      color={color} 
    />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingTop: HEADER_PADDING,
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
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  toolbarButton: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 21,
    margin: 4,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  contentInput: {
    backgroundColor: 'transparent',
    flex: 1,
    fontSize: 16,
    padding: 0,
    textAlignVertical: 'top',
  },
  scrollView: {
    flex: 1,
  },
}); 