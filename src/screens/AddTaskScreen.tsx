import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Switch, Text } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { useDispatch } from 'react-redux';
import { addTask } from '../store/taskSlice';
import { nanoid } from '@reduxjs/toolkit';

export const AddTaskScreen: React.FC = () => {
  const dispatch = useDispatch();
  const [title, setTitle] = useState('');
  const [startPriority, setStartPriority] = useState(50);
  const [hasEndPriority, setHasEndPriority] = useState(false);
  const [endPriority, setEndPriority] = useState(80);
  const [escalationDays, setEscalationDays] = useState('14');

  const handleSubmit = () => {
    if (!title.trim()) return;

    dispatch(addTask({
      id: nanoid(),
      title: title.trim(),
      startPriority,
      endPriority: hasEndPriority ? endPriority : null,
      escalationDays: hasEndPriority ? parseInt(escalationDays, 10) : null,
      createdAt: new Date().toISOString(),
      completed: false,
      completedAt: null,
    }));

    // Reset form
    setTitle('');
    setStartPriority(50);
    setHasEndPriority(false);
    setEndPriority(80);
    setEscalationDays('14');
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Task Title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        mode="outlined"
      />

      <Text style={styles.label}>Starting Priority: {startPriority}</Text>
      <Slider
        value={startPriority}
        onValueChange={setStartPriority}
        minimumValue={0}
        maximumValue={100}
        step={1}
        style={styles.slider}
      />

      <View style={styles.switchContainer}>
        <Text>Enable Priority Escalation</Text>
        <Switch value={hasEndPriority} onValueChange={setHasEndPriority} />
      </View>

      {hasEndPriority && (
        <>
          <Text style={styles.label}>End Priority: {endPriority}</Text>
          <Slider
            value={endPriority}
            onValueChange={setEndPriority}
            minimumValue={startPriority}
            maximumValue={100}
            step={1}
            style={styles.slider}
          />

          <TextInput
            label="Days until end priority"
            value={escalationDays}
            onChangeText={setEscalationDays}
            keyboardType="numeric"
            style={styles.input}
            mode="outlined"
          />
        </>
      )}

      <Button
        mode="contained"
        onPress={handleSubmit}
        style={styles.button}
        disabled={!title.trim()}
      >
        Add Task
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  slider: {
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
}); 