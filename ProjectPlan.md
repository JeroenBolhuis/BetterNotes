### Project Overview
BetterNotes will be a React Native app built with Expo that allows users to:
- Add tasks with a starting priority (0-100 scale), optional ending priority, and a time duration for priority escalation.
- Gradually increase priority over time for tasks with an ending priority, then hold steady.
- Mark tasks as completed at any time.
- Sort tasks by current priority (highest first).
- Operate fully offline with local storage.
- Lay groundwork for future AI features and Google Calendar integration.

### Tech Stack
- **Framework**: React Native with Expo (for Android compatibility and easy setup).
- **Language**: TypeScript (for type safety and better development with Cursor AI).
- **Local Storage**: AsyncStorage (Expo’s built-in key-value storage, sufficient for offline, no-database needs).
- **State Management**: Redux Toolkit (for predictable state handling and easy task updates).
- **UI Library**: React Native Paper (for clean, Material Design components like sliders and buttons).
- **Time Handling**: date-fns (lightweight library for date calculations and priority interpolation).
- **Future AI**: Placeholder for on-device ML (e.g., TensorFlow.js later).
- **Future Calendar**: Expo’s Calendar API (for Google Calendar integration).

### Data Model
Since there’s no database, tasks will be stored as JSON objects in AsyncStorage. A task might look like this:
```json
{
  "id": "unique-string",
  "title": "Send invoice",
  "startPriority": 20,
  "endPriority": 80, // Optional
  "escalationDays": 14, // Optional, days until endPriority is reached
  "createdAt": "2025-02-26T10:00:00Z",
  "completed": false,
  "completedAt": null
}
```
- For tasks like "buy shoes" with static priority, `endPriority` and `escalationDays` will be null.
- Current priority will be calculated dynamically based on time elapsed since `createdAt`.

### Architecture Plan

#### Phase 1: Core Functionality (Task Creation, Priority, and Sorting)
**Goal**: Build the basic app with task input, priority sliders, and offline storage.
- **Setup**:
  - Initialize Expo project: `expo init BetterNotes --template blank-typescript`.
  - Install dependencies: `npm install @react-native-async-storage/async-storage @reduxjs/toolkit react-redux react-native-paper date-fns`.
- **Components**:
  - `TaskListScreen`: Displays tasks sorted by current priority.
  - `AddTaskScreen`: Form with title input, sliders for `startPriority` (0-100) and optional `endPriority`, and a number input for `escalationDays`.
  - `TaskItem`: Displays a task with its current priority and a "Complete" button.
- **Redux Store**:
  - Slice: `tasksSlice` with reducers for adding, completing, and loading tasks.
  - State: `{ tasks: Task[] }`.
- **Storage**:
  - Save tasks to AsyncStorage on every update: `AsyncStorage.setItem('tasks', JSON.stringify(tasks))`.
  - Load tasks on app start: `AsyncStorage.getItem('tasks')`.
- **Priority Calculation**:
  - Function: `calculateCurrentPriority(task, currentDate)`:
    - If no `endPriority`, return `startPriority`.
    - Else, interpolate linearly from `startPriority` to `endPriority` over `escalationDays` using time elapsed since `createdAt`. Cap at `endPriority`.
  - Update priority in real-time (recalculate every minute or on app focus).

#### Phase 2: Dynamic Priority Updates and UX Polish
**Goal**: Ensure priorities update smoothly and improve usability.
- **Priority Updates**:
  - Use a `setInterval` (e.g., every 60 seconds) to recalculate priorities and update the Redux store.
  - Trigger re-render of `TaskListScreen` with sorted tasks.
- **UI Enhancements**:
  - Add a visual indicator (e.g., color gradient) to show priority escalation on `TaskItem`.
  - Implement swipe-to-complete on `TaskItem`.
  - Add a "Completed Tasks" section (toggleable).
- **Persistence**:
  - Ensure AsyncStorage syncs correctly after each completion or addition.

#### Phase 3: Offline AI Integration
**Goal**: Add on-device AI for typo correction and task merging without internet.
- **Library**: Integrate TensorFlow.js (`@tensorflow/tfjs`) or a lightweight NLP model.
- **Features**:
  - **Typo Correction**: Pre-trained model to suggest fixes for task titles (e.g., "Sned invoice" → "Send invoice").
  - **Task Merging**: Compare task titles with simple similarity scoring (e.g., Levenshtein distance) and suggest merging (e.g., "Buy shoes" and "Get shoes").
- **Implementation**:
  - Run AI on task creation/edit in `AddTaskScreen`.
  - Store models locally in the app bundle (Expo supports this via asset bundling).
- **Note**: Keep this lightweight to avoid bloating the app size.

#### Phase 4: Google Calendar Integration
**Goal**: Add specific-date tasks that sync to Google Calendar.
- **Setup**: Install `@expo/react-native-permissions` and configure Expo’s Calendar API.
- **Data Model Update**:
  - Add optional `dueDate` field to tasks (e.g., "2025-05-24" for Steff’s birthday).
- **Logic**:
  - If `dueDate` is set, skip priority escalation and treat as a calendar event.
  - On task creation, request calendar permissions and add to Google Calendar via `Expo.Calendar.createEventAsync`.
  - Display these tasks separately (e.g., "Calendar Tasks" section).
- **UX**:
  - Add a "Schedule" toggle in `AddTaskScreen` to input `dueDate`.

### Development Phases Timeline
1. **Phase 1 (1-2 weeks)**:
   - Setup Expo, Redux, and AsyncStorage.
   - Build core UI and task management.
   - Test priority sorting and offline persistence.
2. **Phase 2 (1 week)**:
   - Add dynamic priority updates and polish UI.
   - Test escalation for tasks like "Send invoice".
3. **Phase 3 (2-3 weeks)**:
   - Research and integrate lightweight AI model.
   - Test typo correction and merging offline.
4. **Phase 4 (1-2 weeks)**:
   - Implement Calendar API and test Google Calendar sync.
   - Finalize UI for scheduled tasks.

### Implementation Notes for Cursor AI
- Use Cursor AI to scaffold components and Redux slices (e.g., "Create a Redux slice for tasks with add and complete actions").
- Generate UI boilerplate: "Build a React Native screen with a slider from 0-100 and a text input."
- Debug priority logic: "Help me write a function to interpolate priority from 20 to 80 over 14 days."

### Sample Priority Calculation
For "Send invoice":
- `startPriority: 20`, `endPriority: 80`, `escalationDays: 14`, `createdAt: Feb 26, 2025`.
- On March 2 (6 days later):
  - Progress = 6/14 = 0.428.
  - Priority = 20 + (80 - 20) * 0.428 = 20 + 25.68 = 45.68 (round to 46).
- On March 12 (14 days): Priority = 80 (caps there).

### Next Steps
Start with Phase 1 by setting up your Expo project and building the core task list. Let me know if you’d like detailed code snippets for any part (e.g., Redux setup or priority logic) or help integrating this with Cursor AI!