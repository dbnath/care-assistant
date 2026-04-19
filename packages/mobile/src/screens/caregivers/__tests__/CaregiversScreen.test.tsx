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
  useAuth: () => ({user: {id: 'founder-1'} as any}),
}));

// Mock the data hook — return empty list (no caregivers)
// path from __tests__/ dir: up 3 levels (caregivers/screens/src) → hooks/useFounders
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
