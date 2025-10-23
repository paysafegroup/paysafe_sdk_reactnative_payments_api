// Direct test runner script
const { describe, test, expect } = require('@jest/globals');

// Run basic tests directly
describe('Basic Tests', () => {
  test('addition works', () => {
    expect(1 + 1).toBe(2);
  });
  
  test('string concatenation works', () => {
    expect('hello' + ' world').toBe('hello world');
  });
  
  test('arrays work', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr).toContain(2);
  });
  
  test('objects work', () => {
    const obj = { name: 'Test', value: 42 };
    expect(obj.name).toBe('Test');
    expect(obj.value).toBe(42);
  });
});

// Run the tests
require('jest').run(['--testMatch', '**/run-basic-test.js']);