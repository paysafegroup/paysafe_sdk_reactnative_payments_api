import { useColorScheme } from '../useColorScheme';

// Mock react-native's useColorScheme
jest.mock('react-native', () => ({
  useColorScheme: jest.fn(),
}));

describe('useColorScheme', () => {
  it('should export useColorScheme from react-native', () => {
    expect(useColorScheme).toBeDefined();
    expect(typeof useColorScheme).toBe('function');
  });

  it('should be the same function as react-native useColorScheme', () => {
    const rnUseColorScheme = require('react-native').useColorScheme;
    expect(useColorScheme).toBe(rnUseColorScheme);
  });
});
