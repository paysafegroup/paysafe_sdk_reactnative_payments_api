// A very simple test runner that doesn't depend on Jest
console.log('Running simple tests...');

// Simple test framework
function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected} but got ${actual}`);
      }
      return true;
    },
    toEqual: (expected) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
      }
      return true;
    },
    toContain: (item) => {
      if (!actual.includes(item)) {
        throw new Error(`Expected ${JSON.stringify(actual)} to contain ${item}`);
      }
      return true;
    }
  };
}

// Run tests
function runTest(name, testFn) {
  try {
    testFn();
    console.log(`✅ PASS: ${name}`);
    return true;
  } catch (error) {
    console.error(`❌ FAIL: ${name}`);
    console.error(`   ${error.message}`);
    return false;
  }
}

// Test suite
const tests = [
  {
    name: 'addition works',
    test: () => expect(1 + 1).toBe(2)
  },
  {
    name: 'string concatenation works',
    test: () => expect('hello' + ' world').toBe('hello world')
  },
  {
    name: 'arrays work',
    test: () => {
      const arr = [1, 2, 3];
      expect(arr.length).toBe(3);
      expect(arr).toContain(2);
    }
  },
  {
    name: 'objects work',
    test: () => {
      const obj = { name: 'Test', value: 42 };
      expect(obj.name).toBe('Test');
      expect(obj.value).toBe(42);
    }
  }
];

// Run all tests
let passed = 0;
let failed = 0;

tests.forEach(test => {
  if (runTest(test.name, test.test)) {
    passed++;
  } else {
    failed++;
  }
});

// Print summary
console.log('\nTest Summary:');
console.log(`Total: ${tests.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

// Exit with appropriate code
process.exit(failed > 0 ? 1 : 0);