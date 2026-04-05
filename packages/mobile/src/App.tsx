import React from 'react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {AuthProvider} from './context/AuthContext';
import AppNavigator from './navigation/AppNavigator';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
