// Import required polyfills for React Native
import 'react-native-gesture-handler/jestSetup';

// Import built-in Jest matchers from @testing-library/react-native
import '@testing-library/react-native/extend-expect';

// Mock react-native components
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  // Mock native modules that might cause issues
  RN.NativeModules = {
    ...RN.NativeModules,
    StatusBarManager: { 
      getHeight: jest.fn(() => 20) 
    },
    PlatformConstants: {
      ...RN.NativeModules.PlatformConstants,
      forceTouchAvailable: false,
    }
  };
  
  return RN;
});

// Mock react-native-paper components
jest.mock('react-native-paper', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  
  return {
    Button: ({ children, onPress, ...props }) => 
      React.createElement(TouchableOpacity, { onPress, testID: props.testID }, 
        React.createElement(Text, {}, children)),
    Card: Object.assign(
      ({ children, ...props }) => React.createElement(View, props, children),
      {
        Content: ({ children, ...props }) => React.createElement(View, props, children),
        Actions: ({ children, ...props }) => React.createElement(View, props, children),
      }
    ),
    Text: ({ children, ...props }) => React.createElement(Text, props, children),
    ActivityIndicator: (props) => React.createElement(View, props),
    Divider: (props) => React.createElement(View, props),
    PaperProvider: ({ children, ...props }) => React.createElement(View, props, children),
  };
});

// Mock Expo modules
jest.mock('expo-constants', () => ({
  default: {
    statusBarHeight: 20,
  },
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  return {
    SafeAreaProvider: ({ children, ...props }) => React.createElement(View, props, children),
    SafeAreaView: ({ children, ...props }) => React.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// Mock @react-navigation/native properly
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    NavigationContainer: ({ children }) => {
      const React = require('react');
      const { View } = require('react-native');
      return React.createElement(View, {}, children);
    },
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      canGoBack: jest.fn(() => false),
    }),
    useFocusEffect: jest.fn(),
    useRoute: () => ({
      params: {},
    }),
  };
});

// Global test setup
global.__DEV__ = true;