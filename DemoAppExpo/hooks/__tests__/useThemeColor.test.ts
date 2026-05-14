import { renderHook } from '@testing-library/react-native';

// Mock the useColorScheme hook
const mockUseColorScheme = jest.fn();
jest.mock('../useColorScheme', () => ({
  useColorScheme: mockUseColorScheme,
}));

import { useThemeColor } from '../useThemeColor';

// Mock the Colors constant
jest.mock('../../constants/Colors', () => ({
  Colors: {
    light: {
      text: '#11181C',
      background: '#fff',
      tint: '#0a7ea4',
      icon: '#687076',
      tabIconDefault: '#687076',
      tabIconSelected: '#0a7ea4',
    },
    dark: {
      text: '#ECEDEE',
      background: '#151718',
      tint: '#fff',
      icon: '#9BA1A6',
      tabIconDefault: '#9BA1A6',
      tabIconSelected: '#fff',
    },
  },
}));

describe('useThemeColor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return light theme color when color scheme is light', () => {
    mockUseColorScheme.mockReturnValue('light');

    const { result } = renderHook(() =>
      useThemeColor({}, 'text')
    );

    expect(result.current).toBe('#11181C');
  });

  it('should return dark theme color when color scheme is dark', () => {
    mockUseColorScheme.mockReturnValue('dark');

    const { result } = renderHook(() =>
      useThemeColor({}, 'text')
    );

    expect(result.current).toBe('#ECEDEE');
  });

  it('should return light theme color when no color scheme is provided', () => {
    mockUseColorScheme.mockReturnValue(null);

    const { result } = renderHook(() =>
      useThemeColor({}, 'text')
    );

    expect(result.current).toBe('#11181C');
  });

  it('should prioritize prop colors over default colors', () => {
    mockUseColorScheme.mockReturnValue('light');

    const { result } = renderHook(() =>
      useThemeColor({ light: '#override' }, 'text')
    );

    expect(result.current).toBe('#override');
  });

  it('should prioritize dark prop colors when in dark mode', () => {
    mockUseColorScheme.mockReturnValue('dark');

    const { result } = renderHook(() =>
      useThemeColor({ dark: '#dark-override' }, 'text')
    );

    expect(result.current).toBe('#dark-override');
  });
});
