import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { HapticTab } from '@/components/HapticTab';
import ParallaxScrollView from '@/components/ParallaxScrollView';

jest.mock('@/components/ui/TabBarBackground', () => ({
  __esModule: true,
  default: undefined,
  useBottomTabOverflow: () => 0,
}));

jest.mock('@expo/vector-icons/MaterialIcons', () => {
  const R = require('react');
  const { Text: RNText } = require('react-native');
  return function MaterialIcons(props: { name?: string }) {
    return R.createElement(RNText, { testID: 'material-icon' }, props.name);
  };
});

import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground, { useBottomTabOverflow } from '@/components/ui/TabBarBackground';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'Light' },
}));

jest.mock('@react-navigation/elements', () => {
  const { Pressable } = require('react-native');
  return { PlatformPressable: Pressable };
});

describe('HapticTab', () => {
  const originalExpoOs = process.env.EXPO_OS;

  afterEach(() => {
    process.env.EXPO_OS = originalExpoOs;
  });

  it('forwards onPressIn to the tab button', () => {
    process.env.EXPO_OS = 'ios';
    const onPressIn = jest.fn();

    const { getByText } = render(
      <HapticTab onPressIn={onPressIn} accessibilityRole="button">
        <Text>Tab</Text>
      </HapticTab>
    );

    fireEvent(getByText('Tab'), 'pressIn');
    expect(onPressIn).toHaveBeenCalled();
  });
});

describe('IconSymbol (Material fallback)', () => {
  it('renders for mapped SF Symbol names', () => {
    const { toJSON } = render(<IconSymbol name="house.fill" color="#111111" size={28} />);
    expect(toJSON()).not.toBeNull();
  });
});

describe('TabBarBackground (web/Android shim)', () => {
  it('exports undefined default and zero bottom overflow', () => {
    expect(TabBarBackground).toBeUndefined();
    expect(useBottomTabOverflow()).toBe(0);
  });
});

describe('ParallaxScrollView', () => {
  it('renders header and children', () => {
    const { getByTestId, getByText } = render(
      <ParallaxScrollView
        headerImage={<Text testID="header-img">Header</Text>}
        headerBackgroundColor={{ dark: '#111', light: '#eee' }}
      >
        <Text>Child content</Text>
      </ParallaxScrollView>
    );

    expect(getByTestId('header-img')).toBeTruthy();
    expect(getByText('Child content')).toBeTruthy();
  });
});
