// Mock React Native for React Native module testing
jest.mock('react-native', () => {
  const React = require('react');
  
  // Create proper component mocks that return actual React elements
  const createMockComponent = (name) => {
    const component = ({ children, ...props }) => {
      return React.createElement(name, props, children);
    };
    component.displayName = name;
    return component;
  };
  
  // Create mock components
  const View = createMockComponent('View');
  const Text = createMockComponent('Text');
  const ScrollView = createMockComponent('ScrollView');
  const TouchableOpacity = createMockComponent('TouchableOpacity');
  const Image = createMockComponent('Image');
  const TextInput = createMockComponent('TextInput');
  
  // Mock NativeEventEmitter – store listeners so tests can emit events
  const eventEmitterListeners = {};
  class MockNativeEventEmitter {
    addListener = jest.fn((eventName, callback) => {
      eventEmitterListeners[eventName] = eventEmitterListeners[eventName] || [];
      eventEmitterListeners[eventName].push(callback);
      return {
        remove: jest.fn(() => {
          const arr = eventEmitterListeners[eventName];
          if (arr) {
            const i = arr.indexOf(callback);
            if (i >= 0) arr.splice(i, 1);
          }
        }),
      };
    });
  }
  global.__mockNativeEventEmitterEmit = (eventName, ...args) => {
    const callbacks = eventEmitterListeners[eventName] || [];
    callbacks.forEach((cb) => cb(...args));
  };
  global.__mockNativeEventEmitterClear = () => {
    Object.keys(eventEmitterListeners).forEach((k) => delete eventEmitterListeners[k]);
  };

  const mockFindNodeHandle = jest.fn();
  const mockRunAfterInteractions = jest.fn((cb) => (typeof cb === 'function' ? cb() : undefined));

  return {
    findNodeHandle: mockFindNodeHandle,
    InteractionManager: { runAfterInteractions: mockRunAfterInteractions },
    NativeEventEmitter: MockNativeEventEmitter,
    NativeModules: {
      PaysafeSDK: {
        setup: jest.fn().mockResolvedValue(undefined),
        isInitialized: jest.fn().mockReturnValue(true),
        getMerchantReferenceNumber: jest.fn().mockReturnValue('merchant-12345'),
      },
      PaysafeVenmo: {
        tokenize: jest.fn().mockResolvedValue({ nonce: 'venmo-nonce-12345' }),
        isVenmoAvailable: jest.fn().mockReturnValue(true),
      },
      PaysafeGooglePay: {
        isReadyToPay: jest.fn().mockResolvedValue(true),
        loadPaymentData: jest.fn().mockResolvedValue({ token: 'google-pay-token-12345' }),
      },
      PaysafeCardPayments: {
        tokenize: jest.fn().mockResolvedValue({ token: 'card-token-12345' }),
        validateCard: jest.fn().mockReturnValue(true),
      },
      PaysafeSavedCardPayments: {
        fetchSavedCards: jest.fn().mockResolvedValue([
          {
            id: '1',
            creditCardType: 'VISA',
            lastDigits: '4242',
            holderName: 'Test User',
            expiryMonth: '12',
            expiryYear: '2030',
          },
        ]),
      },
    },
    Platform: {
      OS: 'ios',
      select: jest.fn((obj) => obj.ios || obj.default),
    },
    StyleSheet: {
      create: jest.fn((styles) => styles),
      flatten: jest.fn((style) => style),
    },
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    Alert: {
      alert: jest.fn(),
    },
    Dimensions: {
      get: jest.fn().mockReturnValue({ width: 375, height: 812 }),
    },
    useColorScheme: jest.fn(() => 'light'),
    // Add any other components used in your tests
    Button: ({ title, children, onPress, ...props }) =>
      React.createElement(TouchableOpacity, { ...props, onPress }, title ? React.createElement(Text, {}, title) : children),
    FlatList: ({ data = [], renderItem, keyExtractor, ...props }) =>
      React.createElement(
        View,
        props,
        Array.isArray(data) && renderItem
          ? data.map((item, index) => {
              const key = keyExtractor ? keyExtractor(item, index) : String(index);
              return React.createElement(
                React.Fragment,
                { key },
                renderItem({
                  item,
                  index,
                  separators: {
                    highlight: () => undefined,
                    unhighlight: () => undefined,
                    updateProps: () => undefined,
                  },
                })
              );
            })
          : null
      ),
    ActivityIndicator: createMockComponent('ActivityIndicator'),
    KeyboardAvoidingView: createMockComponent('KeyboardAvoidingView'),
    Modal: createMockComponent('Modal'),
    Pressable: createMockComponent('Pressable'),
    SafeAreaView: createMockComponent('SafeAreaView'),
    StatusBar: createMockComponent('StatusBar'),
    Switch: createMockComponent('Switch'),
  };
});

// Add module mapping for missing packages
jest.doMock('react-native-safe-area-context', () => {
  const React = require('react');
  const SafeAreaProvider = ({ children, ...props }) => 
    React.createElement('SafeAreaProvider', props, children);
  const SafeAreaView = ({ children, ...props }) => 
    React.createElement('SafeAreaView', props, children);
  
  return {
    SafeAreaProvider,
    SafeAreaView,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
    initialWindowMetrics: {
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: { top: 47, left: 0, right: 0, bottom: 34 }
    }
  };
}, { virtual: true });

jest.doMock('react-native-paper', () => {
  const React = require('react');
  
  const createMockComponent = (name) => {
    const component = ({ children, ...props }) => {
      return React.createElement(name, props, children);
    };
    component.displayName = name;
    return component;
  };
  
  return {
    Provider: createMockComponent('PaperProvider'),
    Button: createMockComponent('PaperButton'),
    Text: createMockComponent('PaperText'),
    Card: createMockComponent('PaperCard'),
    Title: createMockComponent('PaperTitle'),
    Paragraph: createMockComponent('PaperParagraph'),
    TextInput: createMockComponent('PaperTextInput'),
    Appbar: {
      Header: createMockComponent('PaperAppbarHeader'),
      Content: createMockComponent('PaperAppbarContent'),
      Action: createMockComponent('PaperAppbarAction'),
      BackAction: createMockComponent('PaperAppbarBackAction'),
    },
    DefaultTheme: {
      colors: {
        primary: '#6200ee',
        background: '#f6f6f6',
        surface: '#ffffff',
        accent: '#03dac4',
        error: '#b00020',
        text: '#000000',
        onSurface: '#000000',
        disabled: 'rgba(0, 0, 0, 0.26)',
        placeholder: 'rgba(0, 0, 0, 0.54)',
        backdrop: 'rgba(0, 0, 0, 0.5)',
        notification: '#f50057',
      },
      fonts: {
        regular: {
          fontFamily: 'System',
          fontWeight: 'normal',
        },
        medium: {
          fontFamily: 'System',
          fontWeight: 'medium',
        },
        light: {
          fontFamily: 'System',
          fontWeight: 'light',
        },
        thin: {
          fontFamily: 'System',
          fontWeight: 'thin',
        },
      },
    },
  };
}, { virtual: true });

jest.doMock('@react-navigation/native', () => {
  const React = require('react');
  return {
    NavigationContainer: ({ children }) => React.createElement('NavigationContainer', {}, children),
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn(),
      dispatch: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
    createNavigatorFactory: jest.fn(() => jest.fn()),
    useIsFocused: jest.fn(() => true),
    useFocusEffect: jest.fn(),
    DefaultTheme: {
      colors: {
        primary: '#000',
        background: '#fff',
        card: '#fff',
        text: '#000',
        border: '#000',
        notification: '#000',
      },
    },
    DarkTheme: {
      colors: {
        primary: '#fff',
        background: '#000',
        card: '#000',
        text: '#fff',
        border: '#fff',
        notification: '#fff',
      },
    },
  };
}, { virtual: true });

jest.doMock('@react-navigation/native-stack', () => {
  const React = require('react');
  const createNativeStackNavigator = () => {
    const Navigator = ({ children, ...props }) => 
      React.createElement('NativeStackNavigator', props, children);
    const Screen = ({ children, ...props }) => 
      React.createElement('NativeStackScreen', props, children);
    
    return { Navigator, Screen };
  };
  
  return { createNativeStackNavigator };
}, { virtual: true });

// Global test setup
global.__DEV__ = true;
global.fetch = jest.fn();

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};