# Design: Replace FlatList with ScrollView in CaregiversScreen

**Date:** 2026-04-19
**Status:** Approved

## Problem

`CaregiversScreen.tsx` crashes at runtime with:

> Cannot read property 'getItem' of undefined — FlatList.js:497:14 `_checkProps`

This is a known FlatList failure mode when the `data` prop resolves to an unexpected value during an intermediate React Query render cycle.

## Scope

- **Change:** `packages/mobile/src/screens/caregivers/CaregiversScreen.tsx`
- **No change:** `CaregiverDetailScreen.tsx` — already uses `ScrollView` correctly.

## Approach

Replace `FlatList` with `ScrollView + .map()`. The caregiver list is bounded in size and does not require virtualization.

## Design

### Imports

Remove `FlatList` from the React Native import list. `ScrollView` is already available in RN core — no new package needed.

### Component Structure

```
SafeAreaView
  StatusBar
  View (searchWrap)
    View (searchBox)
      Text (searchIcon)
      TextInput
  ScrollView                          ← replaces FlatList
    refreshControl={RefreshControl}   ← moves from FlatList, same props
    contentContainerStyle             ← listEmpty or listContent, same logic
    [if filtered.length === 0]
      View (emptyWrap)                ← was ListEmptyComponent
        Text (bigIcon)
        Text (emptyTitle)
        Text (emptySub, conditional)
    [else]
      filtered.map((item, idx) =>
        CaregiverRow key={item.id}
        [if not last item] View (separator)  ← was ItemSeparatorComponent
  TouchableOpacity (fab)
```

### RefreshControl

Moves unchanged from `FlatList` to `ScrollView`:
```tsx
<ScrollView
  refreshControl={
    <RefreshControl refreshing={!!isFetching} onRefresh={refetch} />
  }
  ...
>
```

### Empty State

Rendered inline as a conditional instead of `ListEmptyComponent`:
```tsx
{filtered.length === 0 ? (
  <View style={styles.emptyWrap}>
    ...
  </View>
) : (
  filtered.map((item, idx) => (
    <>
      <CaregiverRow ... />
      {idx < filtered.length - 1 && <View style={styles.separator} />}
    </>
  ))
)}
```

### Styles

No style changes required. `listEmpty` and `listContent` are applied to `contentContainerStyle` on `ScrollView` using the same conditional logic as before.

## What Does Not Change

- `CaregiverRow` component — untouched
- Search filter logic (`useMemo`) — untouched
- Loading and error states — untouched
- FAB — untouched
- All styles — untouched
- `CaregiverDetailScreen.tsx` — no changes

## Trade-offs

| | ScrollView + .map() | FlatList |
|---|---|---|
| Crash risk | None | Yes (data undefined) |
| Virtualization | No | Yes |
| Appropriate for caregiver list size | Yes | Yes |
| Implementation simplicity | High | Medium |

Virtualization is not needed here — a hospital or care facility's employed caregiver list is bounded and small.
