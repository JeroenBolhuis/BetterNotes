import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Dimensions } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme, FAB, Text, Card, TouchableRipple } from 'react-native-paper';
import { RootState } from '../store';
import { Note } from '../store/noteSlice';
import { AddNoteModal } from '../components/AddNoteModal';
import { NoteDetailModal } from '../components/NoteDetailModal';

export const NotesScreen: React.FC = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const notes = useSelector((state: RootState) => state.notes.notes);
  
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  
  // Sort notes by updated date (most recent first)
  const sortedNotes = [...notes].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  
  const handleNotePress = useCallback((note: Note) => {
    setSelectedNote(note);
  }, []);
  
  const renderNote = useCallback(({ item }: { item: Note }) => (
    <TouchableRipple onPress={() => handleNotePress(item)}>
      <Card style={styles.noteCard} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" numberOfLines={1} ellipsizeMode="tail">
            {item.title}
          </Text>
          <Text variant="bodySmall" style={styles.notePreview} numberOfLines={2} ellipsizeMode="tail">
            {item.content.replace(/\n/g, ' ')}
          </Text>
          <Text variant="labelSmall" style={styles.noteDate}>
            {new Date(item.updatedAt).toLocaleDateString()}
          </Text>
        </Card.Content>
      </Card>
    </TouchableRipple>
  ), []);
  
  const keyExtractor = useCallback((item: Note) => item.id, []);
  
  const renderEmptyList = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
        No notes yet. Add your first note with the + button below.
      </Text>
    </View>
  ), [theme.colors.onSurfaceVariant]);
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={sortedNotes}
        renderItem={renderNote}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.list,
          sortedNotes.length === 0 && styles.emptyList
        ]}
        ListEmptyComponent={renderEmptyList}
      />
      
      <FAB
        icon="plus"
        style={[
          styles.fab,
          {
            backgroundColor: theme.colors.primary,
            elevation: 8,
          }
        ]}
        onPress={() => setIsAddModalVisible(true)}
        color={theme.colors.onPrimary}
        size="large"
      />
      
      <AddNoteModal
        visible={isAddModalVisible}
        onDismiss={() => setIsAddModalVisible(false)}
      />
      
      {selectedNote && (
        <NoteDetailModal
          visible={!!selectedNote}
          note={selectedNote}
          onDismiss={() => setSelectedNote(null)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 8,
    paddingBottom: 100, // Increased padding for larger FAB
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    borderRadius: 35,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteCard: {
    marginVertical: 4,
    marginHorizontal: 8,
  },
  notePreview: {
    marginTop: 4,
    opacity: 0.7,
  },
  noteDate: {
    marginTop: 8,
    opacity: 0.5,
    alignSelf: 'flex-end',
  },
}); 