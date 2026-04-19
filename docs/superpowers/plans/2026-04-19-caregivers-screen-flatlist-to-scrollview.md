# CaregiversScreen FlatList → ScrollView Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `FlatList` with `ScrollView + .map()` in `CaregiversScreen.tsx` to fix the `Cannot read property 'getItem' of undefined` crash.

**Architecture:** Single-file change. Remove the `FlatList` component and replace it with a `ScrollView` carrying the `RefreshControl`. Render list items via `filtered.map()`, inline the empty state, and inline item separators. No new dependencies required.

**Tech Stack:** React Native 0.73, TypeScript, @testing-library/react-native 12

---

## Files

| Action | Path |
|--------|------|
| Modify | `packages/mobile/src/screens/caregivers/CaregiversScreen.tsx` |
| Create | `packages/mobile/src/screens/caregivers/__tests__/CaregiversScreen.test.tsx` |

---

### Task 1: Write failing smoke-render test

**Files:**
- Create: `packages/mobile/src/screens/caregivers/__tests__/CaregiversScreen.test.tsx`

- [ ] **Step 1: Create the test file**

```tsx
// packages/mobile/src/screens/caregivers/__tests__/CaregiversScreen.test.tsx
import React from 'react';
import {render} from '@testing-library/react-native';
import CaregiversScreen from '../CaregiversScreen';

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({navigate: jest.fn()}),
}));

// Mock auth context
jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({user: {id: 'founder-1'}}),
}));

// Mock the data hook — return empty list (no caregivers)
jest.mock('../../../hooks/useFounders', () => ({
  useEmployedCaregivers: () => ({
    data: [],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
    isFetching: false,
  }),
}));

describe('CaregiversScreen', () => {
  it('renders without crashing', () => {
    const {getByPlaceholderText} = render(<CaregiversScreen />);
    expect(getByPlaceholderText('Search caregivers…')).toBeTruthy();
  });

  it('shows empty state when there are no caregivers', () => {
    const {getByText} = render(<CaregiversScreen />);
    expect(getByText('No caregivers employed yet.')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test — expect it to fail**

```bash
cd packages/mobile && npx jest src/screens/caregivers/__tests__/CaregiversScreen.test.tsx --no-coverage
```

Expected: FAIL (FlatList crash or import error — confirms test is wired up correctly)

---

### Task 2: Replace FlatList with ScrollView

**Files:**
- Modify: `packages/mobile/src/screens/caregivers/CaregiversScreen.tsx`

- [ ] **Step 1: Update imports — remove `FlatList`, add `ScrollView`**

Replace the import block at lines 1–13. Change:
```tsx
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
```
To:
```tsx
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
```

- [ ] **Step 2: Replace the FlatList JSX block**

Replace lines 119–151 (the entire `<FlatList ... />` block) with:

```tsx
      <ScrollView
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={!!isFetching} onRefresh={refetch} />
        }
        contentContainerStyle={
          filtered.length === 0 ? styles.listEmpty : styles.listContent
        }
        showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.bigIcon}>👤</Text>
            <Text style={styles.emptyTitle}>
              {search ? 'No caregivers match your search.' : 'No caregivers employed yet.'}
            </Text>
            {!search && (
              <Text style={styles.emptySub}>
                Tap the button below to employ your first caregiver.
              </Text>
            )}
          </View>
        ) : (
          filtered.map((item, idx) => (
            <React.Fragment key={item.id}>
              <CaregiverRow
                caregiver={item}
                onPress={() =>
                  navigation.navigate('CaregiverDetail', {caregiverId: item.id})
                }
              />
              {idx < filtered.length - 1 && (
                <View style={styles.separator} />
              )}
            </React.Fragment>
          ))
        )}
      </ScrollView>
```

- [ ] **Step 3: Run TypeScript type-check**

```bash
cd packages/mobile && npx tsc --noEmit
```

Expected: No errors.

---

### Task 3: Verify tests pass and commit

- [ ] **Step 1: Run the tests**

```bash
cd packages/mobile && npx jest src/screens/caregivers/__tests__/CaregiversScreen.test.tsx --no-coverage
```

Expected: PASS — both `renders without crashing` and `shows empty state` tests green.

- [ ] **Step 2: Run type-check one final time**

```bash
cd packages/mobile && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add packages/mobile/src/screens/caregivers/CaregiversScreen.tsx \
        packages/mobile/src/screens/caregivers/__tests__/CaregiversScreen.test.tsx
git commit -m "fix(mobile): replace FlatList with ScrollView in CaregiversScreen to fix getItem crash"
```
