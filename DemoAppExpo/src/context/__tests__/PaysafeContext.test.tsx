import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { AppProvider, useAppContext } from '../PaysafeContext';
import { Text, TouchableOpacity } from 'react-native';

const NOT_LOADING = 'Not Loading';

// Test component to consume the context
const TestComponent: React.FC = () => {
  const { isLoading, setIsLoading } = useAppContext();

  return (
    <>
      <Text testID="loading-status">{isLoading ? 'Loading' : NOT_LOADING}</Text>
      <TouchableOpacity testID="toggle-loading" onPress={() => setIsLoading(!isLoading)}>
        <Text>Toggle Loading</Text>
      </TouchableOpacity>
    </>
  );
};

// Test component that uses context outside of provider
const TestComponentOutsideProvider: React.FC = () => {
  useAppContext();
  return <Text>This should not render</Text>;
};

describe('PaysafeContext', () => {
  describe('AppProvider', () => {
    it('should provide context values to children', () => {
      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );

      expect(screen.getByText(NOT_LOADING)).toBeTruthy();
    });

    it('should allow updating loading state', () => {
      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );

      const toggleButton = screen.getByTestId('toggle-loading');

      expect(screen.getByText(NOT_LOADING)).toBeTruthy();

      fireEvent.press(toggleButton);
      expect(screen.getByText('Loading')).toBeTruthy();

      fireEvent.press(toggleButton);
      expect(screen.getByText(NOT_LOADING)).toBeTruthy();
    });

    it('should initialize with isLoading as false', () => {
      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );

      expect(screen.getByText(NOT_LOADING)).toBeTruthy();
    });

    it('should render children correctly', () => {
      const TestChild: React.FC = () => <Text testID="child">Child Component</Text>;

      render(
        <AppProvider>
          <TestChild />
        </AppProvider>
      );

      expect(screen.getByText('Child Component')).toBeTruthy();
    });
  });

  describe('useAppContext', () => {
    it('should throw error when used outside AppProvider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {
        // Suppress console.error for this test
      });

      expect(() => {
        render(<TestComponentOutsideProvider />);
      }).toThrow('useAppContext must be used within an AppProvider');

      consoleError.mockRestore();
    });

    it('should return context when used within AppProvider', () => {
      const TestContextValue: React.FC = () => {
        const context = useAppContext();
        return (
          <>
            <Text testID="has-context">{context ? 'Has Context' : 'No Context'}</Text>
            <Text testID="loading-state">{String(context.isLoading)}</Text>
            <Text testID="has-setter">{typeof context.setIsLoading === 'function' ? 'Has Setter' : 'No Setter'}</Text>
          </>
        );
      };

      render(
        <AppProvider>
          <TestContextValue />
        </AppProvider>
      );

      expect(screen.getByText('Has Context')).toBeTruthy();
      expect(screen.getByText('false')).toBeTruthy();
      expect(screen.getByText('Has Setter')).toBeTruthy();
    });

    it('should provide the same context instance to multiple consumers', () => {
      const FirstConsumer: React.FC = () => {
        const { isLoading, setIsLoading } = useAppContext();
        return (
          <TouchableOpacity testID="first-toggle" onPress={() => setIsLoading(!isLoading)}>
            <Text testID="first-status">{isLoading ? 'Loading' : NOT_LOADING}</Text>
          </TouchableOpacity>
        );
      };

      const SecondConsumer: React.FC = () => {
        const { isLoading } = useAppContext();
        return <Text testID="second-status">{isLoading ? 'Loading' : NOT_LOADING}</Text>;
      };

      render(
        <AppProvider>
          <FirstConsumer />
          <SecondConsumer />
        </AppProvider>
      );

      expect(screen.getAllByText(NOT_LOADING)).toHaveLength(2);

      fireEvent.press(screen.getByTestId('first-toggle'));

      expect(screen.getAllByText('Loading')).toHaveLength(2);
    });
  });
});
