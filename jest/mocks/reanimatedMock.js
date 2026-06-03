/**
 * Stub for react-native-reanimated (package may live only under DemoAppExpo/node_modules).
 * Do not use the library `mock` entry — it pulls TurboModuleRegistry and breaks in Jest.
 */
const React = require('react');
const { View, ScrollView } = require('react-native');
const createAnimatedComponent = (Comp) => Comp;
const Animated = {
  View: createAnimatedComponent(View),
  ScrollView: createAnimatedComponent(ScrollView),
  createAnimatedComponent,
};
const scrollOffset = { value: 0 };

module.exports = {
  __esModule: true,
  default: Animated,
  createAnimatedComponent,
  interpolate: (_value, _input, outputRange) =>
    Array.isArray(outputRange) ? outputRange[1] ?? outputRange[0] ?? 0 : 0,
  useAnimatedRef: () => ({ current: null }),
  useAnimatedStyle: (fn) => (typeof fn === 'function' ? fn() : {}),
  useScrollViewOffset: () => scrollOffset,
  useSharedValue: (v) => ({ value: v }),
  withTiming: (v) => v,
  Easing: { linear: () => 0 },
  FadeIn: {},
  FadeOut: {},
  Extrapolation: { CLAMP: 'clamp' },
  runOnJS: (fn) => fn,
};
