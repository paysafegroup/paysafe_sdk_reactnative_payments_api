// Import required polyfills for React Native
import 'react-native-gesture-handler/jestSetup';

// Optional matchers (path differs across @testing-library/react-native major versions)
try {
  require('@testing-library/react-native/extend-expect');
} catch {
  try {
    require('@testing-library/jest-native/extend-expect');
  } catch {
    /* optional */
  }
}

// Mock card payment device events for tests (turbo module emits via RCTDeviceEventEmitter).
const mockCardPaymentEventListeners = new Map();

function mockAddCardPaymentEventListener(event, handler) {
  if (!mockCardPaymentEventListeners.has(event)) {
    mockCardPaymentEventListeners.set(event, new Set());
  }
  mockCardPaymentEventListeners.get(event).add(handler);
  return { remove: () => mockCardPaymentEventListeners.get(event)?.delete(handler) };
}

function mockEmitCardPaymentEvent(event, ...args) {
  const subs = mockCardPaymentEventListeners.get(event);
  if (!subs) {
    return;
  }
  subs.forEach((h) => {
    if (args.length === 0) {
      h();
    } else {
      h(args[0]);
    }
  });
}

class MockNativeEventEmitter {
  addListener(event, handler) {
    return mockAddCardPaymentEventListener(event, handler);
  }
}

global.__mockNativeEventEmitterEmit = mockEmitCardPaymentEvent;
global.__mockNativeEventEmitterClear = () => mockCardPaymentEventListeners.clear();

global.__mockCardPaymentsInitialize = jest.fn();
global.__mockCardPaymentsTokenize = jest.fn();

jest.mock('@paysafe/paysafe-card-payments', () => {
  const R = require('react');
  const { View } = require('react-native');
  return {
    addListener: jest.fn(),
    removeListeners: jest.fn(),
    CvvView: R.forwardRef((props, ref) =>
      R.createElement(View, {
        ref,
        testID: 'cvv-view',
        onLayout: props.onLayout,
      })
    ),
    CardNumberView: View,
    CardholderNameView: View,
    ExpiryDatePickerView: View,
    initialize: (...args) => global.__mockCardPaymentsInitialize(...args),
    tokenize: (...args) => global.__mockCardPaymentsTokenize(...args),
  };
});

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
    },
    PaysafeCardPayments: {},
    PaysafeSavedCardPayments: {
      fetchSavedCards: jest.fn(() => Promise.resolve([])),
    },
  };

  // Always mock NativeEventEmitter – Jest cannot test native RN parts
  RN.NativeEventEmitter = MockNativeEventEmitter;
  RN.DeviceEventEmitter = {
    addListener: mockAddCardPaymentEventListener,
    emit: mockEmitCardPaymentEvent,
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

// Mock hooks that depend on react-native or other env
jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: jest.fn(() => 'light'),
}));

jest.mock('@/hooks/useThemeColor', () => ({
  useThemeColor: jest.fn((_props, colorName) => {
    const Colors = require('@/constants/Colors').Colors;
    return Colors.light[colorName] ?? Colors.dark[colorName];
  }),
}));

// React Native exports `NativeModules` / `NativeEventEmitter` such that replacing `RN.NativeModules` inside
// `jest.mock('react-native')` does not affect `import { NativeModules } from 'react-native'`. Patch the live module.
const _rn = require('react-native');
Object.assign(_rn.NativeModules, {
  PaysafeCardPayments: {
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  },
  PaysafeSavedCardPayments: {
    fetchSavedCards: jest.fn(() => Promise.resolve([])),
  },
});
if (!_rn.NativeModules.StatusBarManager) {
  _rn.NativeModules.StatusBarManager = { getHeight: jest.fn(() => 20) };
}
const _platformConstants = _rn.NativeModules.PlatformConstants;
if (_platformConstants && typeof _platformConstants === 'object') {
  Object.assign(_platformConstants, { forceTouchAvailable: false });
}
Object.defineProperty(_rn, 'NativeEventEmitter', {
  configurable: true,
  enumerable: true,
  value: MockNativeEventEmitter,
});
Object.defineProperty(_rn, 'DeviceEventEmitter', {
  configurable: true,
  enumerable: true,
  value: {
    addListener: mockAddCardPaymentEventListener,
    emit: mockEmitCardPaymentEvent,
  },
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