// A simple SDK test runner using our custom test framework
console.log('Running SDK tests...');

// Import the SDK
const sdk = require('./src/sdk/index');

// Simple test framework
function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected} but got ${actual}`);
      }
      return true;
    },
    toBeDefined: () => {
      if (actual === undefined) {
        throw new Error('Expected value to be defined');
      }
      return true;
    },
    toBeInstanceOf: (type) => {
      if (!(actual instanceof type)) {
        throw new Error(`Expected instance of ${type.name}`);
      }
      return true;
    },
    toEqual: (expected) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
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
    name: 'SDK exports expected objects',
    test: () => {
      expect(sdk.PaysafeSDK).toBeDefined();
      expect(sdk.PaysafeCardPayments).toBeDefined();
      expect(sdk.PaysafeEnvironment).toBeDefined();
    }
  },
  {
    name: 'PaysafeSDK has getInstance method',
    test: () => {
      expect(typeof sdk.PaysafeSDK.getInstance).toBe('function');
    }
  },
  {
    name: 'PaysafeCardPayments has validation methods',
    test: () => {
      expect(sdk.PaysafeCardPayments.validation).toBeDefined();
      expect(typeof sdk.PaysafeCardPayments.validation.validateCardNumber).toBe('function');
      expect(typeof sdk.PaysafeCardPayments.validation.validateExpiryDate).toBe('function');
      expect(typeof sdk.PaysafeCardPayments.validation.validateCVV).toBe('function');
    }
  },
  {
    name: 'PaysafeEnvironment has TEST and PROD values',
    test: () => {
      expect(sdk.PaysafeEnvironment.TEST).toBe('TEST');
      expect(sdk.PaysafeEnvironment.PROD).toBe('PROD');
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