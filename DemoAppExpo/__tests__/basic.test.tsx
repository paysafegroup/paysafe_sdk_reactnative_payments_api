describe('Basic Tests', () => {
  test('addition works', () => {
    expect(1 + 1).toBe(2);
  });

  test('string concatenation works', () => {
    expect('hello' + ' world').toBe('hello world');
  });

  test('arrays work', () => {
    const arr: number[] = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr).toContain(2);
  });

  test('objects work', () => {
    interface TestObject {
      name: string;
      value: number;
    }

    const obj: TestObject = { name: 'Test', value: 42 };
    expect(obj.name).toBe('Test');
    expect(obj.value).toBe(42);
  });
});
