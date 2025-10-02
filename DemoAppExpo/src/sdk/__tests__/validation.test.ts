import { PaysafeCardPayments } from '../index';

const DATE = '2024-06-15';

describe('PaysafeCardPayments Validation Edge Cases', () => {
  // Mock current date for consistent testing
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(DATE)); // Mid-month to test edge cases
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('validateCardNumber edge cases', () => {
    it('should handle whitespace variations', () => {
      expect(PaysafeCardPayments.validation.validateCardNumber('  4111111111111111  ')).toBe(false); // leading/trailing spaces
      expect(PaysafeCardPayments.validation.validateCardNumber('4111 1111 1111 1111')).toBe(false); // spaces between
      expect(PaysafeCardPayments.validation.validateCardNumber('\t4111111111111111\n')).toBe(false); // tabs and newlines
    });

    it('should handle different card types', () => {
      // Visa
      expect(PaysafeCardPayments.validation.validateCardNumber('4000000000000002')).toBe(true);
      expect(PaysafeCardPayments.validation.validateCardNumber('4999999999999995')).toBe(true);

      // Mastercard
      expect(PaysafeCardPayments.validation.validateCardNumber('5555555555554444')).toBe(true);
      expect(PaysafeCardPayments.validation.validateCardNumber('5105105105105100')).toBe(true);

      // American Express (15 digits - should fail with current validation)
      expect(PaysafeCardPayments.validation.validateCardNumber('378282246310005')).toBe(false);
      expect(PaysafeCardPayments.validation.validateCardNumber('371449635398431')).toBe(false);
    });

    it('should handle mixed characters', () => {
      expect(PaysafeCardPayments.validation.validateCardNumber('411111111a111111')).toBe(false); // letter in middle
      expect(PaysafeCardPayments.validation.validateCardNumber('4111111111111.11')).toBe(false); // decimal point
      expect(PaysafeCardPayments.validation.validateCardNumber('4111111111111-11')).toBe(false); // dash
      expect(PaysafeCardPayments.validation.validateCardNumber('4111111111111#11')).toBe(false); // special char
    });

    it('should handle edge lengths', () => {
      expect(PaysafeCardPayments.validation.validateCardNumber('4')).toBe(false); // single digit
      expect(PaysafeCardPayments.validation.validateCardNumber('41111111111111111')).toBe(false); // 17 digits
      expect(PaysafeCardPayments.validation.validateCardNumber('411111111111111111111')).toBe(false); // 21 digits
    });
  });

  describe('validateExpiryDate comprehensive edge cases', () => {
    it('should handle current month edge cases', () => {
      // Current date is 2024-06-15
      expect(PaysafeCardPayments.validation.validateExpiryDate('06', '2024')).toBe(true); // current month
      expect(PaysafeCardPayments.validation.validateExpiryDate('6', '2024')).toBe(true); // single digit current month
      expect(PaysafeCardPayments.validation.validateExpiryDate('05', '2024')).toBe(false); // previous month
      expect(PaysafeCardPayments.validation.validateExpiryDate('07', '2024')).toBe(true); // next month
    });

    it('should handle year boundaries', () => {
      expect(PaysafeCardPayments.validation.validateExpiryDate('12', '2023')).toBe(false); // last month of previous year
      expect(PaysafeCardPayments.validation.validateExpiryDate('01', '2025')).toBe(true); // first month of next year
      expect(PaysafeCardPayments.validation.validateExpiryDate('12', '2044')).toBe(true); // last valid year
      expect(PaysafeCardPayments.validation.validateExpiryDate('01', '2045')).toBe(false); // first invalid year
    });

    it('should handle leap year February', () => {
      jest.setSystemTime(new Date('2024-01-01')); // 2024 is a leap year
      expect(PaysafeCardPayments.validation.validateExpiryDate('02', '2024')).toBe(true);
      expect(PaysafeCardPayments.validation.validateExpiryDate('02', '2025')).toBe(true);
      expect(PaysafeCardPayments.validation.validateExpiryDate('02', '2028')).toBe(true); // Next leap year
    });

    it('should handle string padding variations', () => {
      expect(PaysafeCardPayments.validation.validateExpiryDate('01', '2025')).toBe(true); // normal
      expect(PaysafeCardPayments.validation.validateExpiryDate('1', '2025')).toBe(true); // no leading zero
      expect(PaysafeCardPayments.validation.validateExpiryDate('01', '25')).toBe(false); // 2-digit year should fail
      expect(PaysafeCardPayments.validation.validateExpiryDate('01', '025')).toBe(false); // 3-digit year should fail
    });

    it('should handle month boundary cases', () => {
      expect(PaysafeCardPayments.validation.validateExpiryDate('01', '2025')).toBe(true); // January
      expect(PaysafeCardPayments.validation.validateExpiryDate('12', '2025')).toBe(true); // December
      expect(PaysafeCardPayments.validation.validateExpiryDate('13', '2025')).toBe(false); // Invalid month
      expect(PaysafeCardPayments.validation.validateExpiryDate('00', '2025')).toBe(false); // Invalid month
    });

    it('should handle various invalid formats', () => {
      expect(PaysafeCardPayments.validation.validateExpiryDate('ab', '2025')).toBe(false);
      expect(PaysafeCardPayments.validation.validateExpiryDate('1a', '2025')).toBe(false);
      expect(PaysafeCardPayments.validation.validateExpiryDate('01', 'abcd')).toBe(false);
      expect(PaysafeCardPayments.validation.validateExpiryDate('01', '202a')).toBe(false);
      expect(PaysafeCardPayments.validation.validateExpiryDate('', '2025')).toBe(false);
      expect(PaysafeCardPayments.validation.validateExpiryDate('01', '')).toBe(false);
      expect(PaysafeCardPayments.validation.validateExpiryDate(null as any, '2025')).toBe(false);
      expect(PaysafeCardPayments.validation.validateExpiryDate('01', null as any)).toBe(false);
    });

    it('should handle extreme future dates', () => {
      expect(PaysafeCardPayments.validation.validateExpiryDate('12', '2044')).toBe(true); // Max valid
      expect(PaysafeCardPayments.validation.validateExpiryDate('12', '2100')).toBe(false); // Too far
      expect(PaysafeCardPayments.validation.validateExpiryDate('12', '9999')).toBe(false); // Extreme future
    });

    it('should handle past dates in detail', () => {
      jest.setSystemTime(new Date(DATE));
      expect(PaysafeCardPayments.validation.validateExpiryDate('01', '2024')).toBe(false); // Past month current year
      expect(PaysafeCardPayments.validation.validateExpiryDate('05', '2024')).toBe(false); // Last month
      expect(PaysafeCardPayments.validation.validateExpiryDate('12', '2023')).toBe(false); // Past year
      expect(PaysafeCardPayments.validation.validateExpiryDate('01', '2020')).toBe(false); // Way past
    });
  });

  describe('validateCVV comprehensive edge cases', () => {
    it('should handle all valid 3-digit CVVs', () => {
      expect(PaysafeCardPayments.validation.validateCVV('000')).toBe(true);
      expect(PaysafeCardPayments.validation.validateCVV('123')).toBe(true);
      expect(PaysafeCardPayments.validation.validateCVV('456')).toBe(true);
      expect(PaysafeCardPayments.validation.validateCVV('789')).toBe(true);
      expect(PaysafeCardPayments.validation.validateCVV('999')).toBe(true);
    });

    it('should handle all valid 4-digit CVVs', () => {
      expect(PaysafeCardPayments.validation.validateCVV('0000')).toBe(true);
      expect(PaysafeCardPayments.validation.validateCVV('1234')).toBe(true);
      expect(PaysafeCardPayments.validation.validateCVV('5678')).toBe(true);
      expect(PaysafeCardPayments.validation.validateCVV('9999')).toBe(true);
    });

    it('should handle invalid lengths thoroughly', () => {
      expect(PaysafeCardPayments.validation.validateCVV('')).toBe(false); // empty
      expect(PaysafeCardPayments.validation.validateCVV('1')).toBe(false); // 1 digit
      expect(PaysafeCardPayments.validation.validateCVV('12')).toBe(false); // 2 digits
      expect(PaysafeCardPayments.validation.validateCVV('12345')).toBe(false); // 5 digits
      expect(PaysafeCardPayments.validation.validateCVV('123456')).toBe(false); // 6 digits
      expect(PaysafeCardPayments.validation.validateCVV('1234567890')).toBe(false); // 10 digits
    });

    it('should handle non-numeric characters', () => {
      // Letters
      expect(PaysafeCardPayments.validation.validateCVV('abc')).toBe(false);
      expect(PaysafeCardPayments.validation.validateCVV('12a')).toBe(false);
      expect(PaysafeCardPayments.validation.validateCVV('1a3')).toBe(false);
      expect(PaysafeCardPayments.validation.validateCVV('a23')).toBe(false);

      // Special characters
      expect(PaysafeCardPayments.validation.validateCVV('12@')).toBe(false);
      expect(PaysafeCardPayments.validation.validateCVV('1#3')).toBe(false);
      expect(PaysafeCardPayments.validation.validateCVV('!@#')).toBe(false);
      expect(PaysafeCardPayments.validation.validateCVV('12.')).toBe(false);
      expect(PaysafeCardPayments.validation.validateCVV('12,')).toBe(false);

      // Whitespace
      expect(PaysafeCardPayments.validation.validateCVV('1 2')).toBe(false);
      expect(PaysafeCardPayments.validation.validateCVV(' 123')).toBe(false);
      expect(PaysafeCardPayments.validation.validateCVV('123 ')).toBe(false);
      expect(PaysafeCardPayments.validation.validateCVV('1\t2\n3')).toBe(false);
    });

    it('should handle null and undefined', () => {
      expect(PaysafeCardPayments.validation.validateCVV(null as any)).toBe(false);
      expect(PaysafeCardPayments.validation.validateCVV(undefined as any)).toBe(false);
    });

    it('should handle edge numeric strings', () => {
      expect(PaysafeCardPayments.validation.validateCVV('001')).toBe(true); // leading zeros
      expect(PaysafeCardPayments.validation.validateCVV('010')).toBe(true);
      expect(PaysafeCardPayments.validation.validateCVV('100')).toBe(true);
      expect(PaysafeCardPayments.validation.validateCVV('0001')).toBe(true); // 4-digit with leading zeros
    });
  });

  describe('Integration validation tests', () => {
    it('should validate complete card data set', () => {
      // Valid complete set
      expect(PaysafeCardPayments.validation.validateCardNumber('4111111111111111')).toBe(true);
      expect(PaysafeCardPayments.validation.validateExpiryDate('12', '2025')).toBe(true);
      expect(PaysafeCardPayments.validation.validateCVV('123')).toBe(true);
    });

    it('should detect invalid complete card data set', () => {
      // Invalid card number
      expect(PaysafeCardPayments.validation.validateCardNumber('4111111111111112')).toBe(false); // Invalid last digit
      expect(PaysafeCardPayments.validation.validateExpiryDate('05', '2024')).toBe(false); // Expired
      expect(PaysafeCardPayments.validation.validateCVV('12')).toBe(false); // Too short
    });

    it('should handle mixed valid/invalid scenarios', () => {
      // Valid card, invalid expiry
      expect(PaysafeCardPayments.validation.validateCardNumber('4111111111111111')).toBe(true);
      expect(PaysafeCardPayments.validation.validateExpiryDate('13', '2025')).toBe(false);

      // Invalid card, valid expiry
      expect(PaysafeCardPayments.validation.validateCardNumber('411111111111111a')).toBe(false);
      expect(PaysafeCardPayments.validation.validateExpiryDate('12', '2025')).toBe(true);
    });
  });
});

describe('PaysafeCardPayments Validation Edge Cases', () => {
  // Mock current date for consistent testing
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(DATE)); // Mid-month to test edge cases
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('validateCardNumber edge cases', () => {
    it('should handle whitespace variations', () => {
      expect(PaysafeCardPayments.validation.validateCardNumber('  4111111111111111  ')).toBe(false); // leading/trailing spaces
      expect(PaysafeCardPayments.validation.validateCardNumber('4111 1111 1111 1111')).toBe(false); // spaces between
      expect(PaysafeCardPayments.validation.validateCardNumber('\t4111111111111111\n')).toBe(false); // tabs and newlines
    });

    it('should handle different card types', () => {
      // Visa
      expect(PaysafeCardPayments.validation.validateCardNumber('4000000000000002')).toBe(true);
      expect(PaysafeCardPayments.validation.validateCardNumber('4999999999999995')).toBe(true);

      // Mastercard
      expect(PaysafeCardPayments.validation.validateCardNumber('5555555555554444')).toBe(true);
      expect(PaysafeCardPayments.validation.validateCardNumber('5105105105105100')).toBe(true);

      // American Express (15 digits - should fail with current validation)
      expect(PaysafeCardPayments.validation.validateCardNumber('378282246310005')).toBe(false);
      expect(PaysafeCardPayments.validation.validateCardNumber('371449635398431')).toBe(false);
    });

    it('should handle mixed characters', () => {
      expect(PaysafeCardPayments.validation.validateCardNumber('411111111a111111')).toBe(false); // letter in middle
      expect(PaysafeCardPayments.validation.validateCardNumber('4111111111111.11')).toBe(false); // decimal point
      expect(PaysafeCardPayments.validation.validateCardNumber('4111111111111-11')).toBe(false); // dash
      expect(PaysafeCardPayments.validation.validateCardNumber('4111111111111#11')).toBe(false); // special char
    });

    it('should handle edge lengths', () => {
      expect(PaysafeCardPayments.validation.validateCardNumber('4')).toBe(false); // single digit
      expect(PaysafeCardPayments.validation.validateCardNumber('41111111111111111')).toBe(false); // 17 digits
      expect(PaysafeCardPayments.validation.validateCardNumber('411111111111111111111')).toBe(false); // 21 digits
    });
  });

  describe('validateExpiryDate comprehensive edge cases', () => {
    it('should handle current month edge cases', () => {
      // Current date is 2024-06-15
      expect(PaysafeCardPayments.validation.validateExpiryDate('06', '2024')).toBe(true); // current month
      expect(PaysafeCardPayments.validation.validateExpiryDate('6', '2024')).toBe(true); // single digit current month
      expect(PaysafeCardPayments.validation.validateExpiryDate('05', '2024')).toBe(false); // previous month
      expect(PaysafeCardPayments.validation.validateExpiryDate('07', '2024')).toBe(true); // next month
    });

    it('should handle year boundaries', () => {
      expect(PaysafeCardPayments.validation.validateExpiryDate('12', '2023')).toBe(false); // last month of previous year
      expect(PaysafeCardPayments.validation.validateExpiryDate('01', '2025')).toBe(true); // first month of next year
      expect(PaysafeCardPayments.validation.validateExpiryDate('12', '2044')).toBe(true); // last valid year
      expect(PaysafeCardPayments.validation.validateExpiryDate('01', '2045')).toBe(false); // first invalid year
    });

    it('should handle leap year February', () => {
      jest.setSystemTime(new Date('2024-01-01')); // 2024 is a leap year
      expect(PaysafeCardPayments.validation.validateExpiryDate('02', '2024')).toBe(true);
      expect(PaysafeCardPayments.validation.validateExpiryDate('02', '2025')).toBe(true);
      expect(PaysafeCardPayments.validation.validateExpiryDate('02', '2028')).toBe(true); // Next leap year
    });

    it('should handle string padding variations', () => {
      expect(PaysafeCardPayments.validation.validateExpiryDate('01', '2025')).toBe(true); // normal
      expect(PaysafeCardPayments.validation.validateExpiryDate('1', '2025')).toBe(true); // no leading zero
      expect(PaysafeCardPayments.validation.validateExpiryDate('01', '25')).toBe(false); // 2-digit year should fail
      expect(PaysafeCardPayments.validation.validateExpiryDate('01', '025')).toBe(false); // 3-digit year should fail
    });

    it('should handle month boundary cases', () => {
      expect(PaysafeCardPayments.validation.validateExpiryDate('01', '2025')).toBe(true); // January
      expect(PaysafeCardPayments.validation.validateExpiryDate('12', '2025')).toBe(true); // December
      expect(PaysafeCardPayments.validation.validateExpiryDate('13', '2025')).toBe(false); // Invalid month
      expect(PaysafeCardPayments.validation.validateExpiryDate('00', '2025')).toBe(false); // Invalid month
    });

    it('should handle various invalid formats', () => {
      expect(PaysafeCardPayments.validation.validateExpiryDate('ab', '2025')).toBe(false);
      expect(PaysafeCardPayments.validation.validateExpiryDate('1a', '2025')).toBe(false);
      expect(PaysafeCardPayments.validation.validateExpiryDate('01', 'abcd')).toBe(false);
      expect(PaysafeCardPayments.validation.validateExpiryDate('01', '202a')).toBe(false);
      expect(PaysafeCardPayments.validation.validateExpiryDate('', '2025')).toBe(false);
      expect(PaysafeCardPayments.validation.validateExpiryDate('01', '')).toBe(false);
      expect(PaysafeCardPayments.validation.validateExpiryDate(null as any, '2025')).toBe(false);
      expect(PaysafeCardPayments.validation.validateExpiryDate('01', null as any)).toBe(false);
    });

    it('should handle extreme future dates', () => {
      expect(PaysafeCardPayments.validation.validateExpiryDate('12', '2044')).toBe(true); // Max valid
      expect(PaysafeCardPayments.validation.validateExpiryDate('12', '2100')).toBe(false); // Too far
      expect(PaysafeCardPayments.validation.validateExpiryDate('12', '9999')).toBe(false); // Extreme future
    });

    it('should handle past dates in detail', () => {
      jest.setSystemTime(new Date(DATE));
      expect(PaysafeCardPayments.validation.validateExpiryDate('01', '2024')).toBe(false); // Past month current year
      expect(PaysafeCardPayments.validation.validateExpiryDate('05', '2024')).toBe(false); // Last month
      expect(PaysafeCardPayments.validation.validateExpiryDate('12', '2023')).toBe(false); // Past year
      expect(PaysafeCardPayments.validation.validateExpiryDate('01', '2020')).toBe(false); // Way past
    });
  });

  describe('validateCVV comprehensive edge cases', () => {
    it('should handle all valid 3-digit CVVs', () => {
      expect(PaysafeCardPayments.validation.validateCVV('000')).toBe(true);
      expect(PaysafeCardPayments.validation.validateCVV('123')).toBe(true);
      expect(PaysafeCardPayments.validation.validateCVV('456')).toBe(true);
      expect(PaysafeCardPayments.validation.validateCVV('789')).toBe(true);
      expect(PaysafeCardPayments.validation.validateCVV('999')).toBe(true);
    });

    it('should handle all valid 4-digit CVVs', () => {
      expect(PaysafeCardPayments.validation.validateCVV('0000')).toBe(true);
      expect(PaysafeCardPayments.validation.validateCVV('1234')).toBe(true);
      expect(PaysafeCardPayments.validation.validateCVV('5678')).toBe(true);
      expect(PaysafeCardPayments.validation.validateCVV('9999')).toBe(true);
    });

    it('should handle invalid lengths thoroughly', () => {
      expect(PaysafeCardPayments.validation.validateCVV('')).toBe(false); // empty
      expect(PaysafeCardPayments.validation.validateCVV('1')).toBe(false); // 1 digit
      expect(PaysafeCardPayments.validation.validateCVV('12')).toBe(false); // 2 digits
      expect(PaysafeCardPayments.validation.validateCVV('12345')).toBe(false); // 5 digits
      expect(PaysafeCardPayments.validation.validateCVV('123456')).toBe(false); // 6 digits
      expect(PaysafeCardPayments.validation.validateCVV('1234567890')).toBe(false); // 10 digits
    });

    it('should handle non-numeric characters', () => {
      // Letters
      expect(PaysafeCardPayments.validation.validateCVV('abc')).toBe(false);
      expect(PaysafeCardPayments.validation.validateCVV('12a')).toBe(false);
      expect(PaysafeCardPayments.validation.validateCVV('1a3')).toBe(false);
      expect(PaysafeCardPayments.validation.validateCVV('a23')).toBe(false);

      // Special characters
      expect(PaysafeCardPayments.validation.validateCVV('12@')).toBe(false);
      expect(PaysafeCardPayments.validation.validateCVV('1#3')).toBe(false);
      expect(PaysafeCardPayments.validation.validateCVV('!@#')).toBe(false);
      expect(PaysafeCardPayments.validation.validateCVV('12.')).toBe(false);
      expect(PaysafeCardPayments.validation.validateCVV('12,')).toBe(false);

      // Whitespace
      expect(PaysafeCardPayments.validation.validateCVV('1 2')).toBe(false);
      expect(PaysafeCardPayments.validation.validateCVV(' 123')).toBe(false);
      expect(PaysafeCardPayments.validation.validateCVV('123 ')).toBe(false);
      expect(PaysafeCardPayments.validation.validateCVV('1\t2\n3')).toBe(false);
    });

    it('should handle null and undefined', () => {
      expect(PaysafeCardPayments.validation.validateCVV(null as any)).toBe(false);
      expect(PaysafeCardPayments.validation.validateCVV(undefined as any)).toBe(false);
    });

    it('should handle edge numeric strings', () => {
      expect(PaysafeCardPayments.validation.validateCVV('001')).toBe(true); // leading zeros
      expect(PaysafeCardPayments.validation.validateCVV('010')).toBe(true);
      expect(PaysafeCardPayments.validation.validateCVV('100')).toBe(true);
      expect(PaysafeCardPayments.validation.validateCVV('0001')).toBe(true); // 4-digit with leading zeros
    });
  });

  describe('Integration validation tests', () => {
    it('should validate complete card data set', () => {
      // Valid complete set
      expect(PaysafeCardPayments.validation.validateCardNumber('4111111111111111')).toBe(true);
      expect(PaysafeCardPayments.validation.validateExpiryDate('12', '2025')).toBe(true);
      expect(PaysafeCardPayments.validation.validateCVV('123')).toBe(true);
    });

    it('should detect invalid complete card data set', () => {
      // Invalid card number
      expect(PaysafeCardPayments.validation.validateCardNumber('4111111111111112')).toBe(false); // Invalid last digit
      expect(PaysafeCardPayments.validation.validateExpiryDate('05', '2024')).toBe(false); // Expired
      expect(PaysafeCardPayments.validation.validateCVV('12')).toBe(false); // Too short
    });

    it('should handle mixed valid/invalid scenarios', () => {
      // Valid card, invalid expiry
      expect(PaysafeCardPayments.validation.validateCardNumber('4111111111111111')).toBe(true);
      expect(PaysafeCardPayments.validation.validateExpiryDate('13', '2025')).toBe(false);

      // Invalid card, valid expiry
      expect(PaysafeCardPayments.validation.validateCardNumber('411111111111111a')).toBe(false);
      expect(PaysafeCardPayments.validation.validateExpiryDate('12', '2025')).toBe(true);
    });
  });
});
