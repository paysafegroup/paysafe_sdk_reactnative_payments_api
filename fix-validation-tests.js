const fs = require('fs');
const path = require('path');

const validationTestPath = path.join(__dirname, 'DemoAppExpo/src/sdk/__tests__/validation.test.ts');

// Read the file
let content = fs.readFileSync(validationTestPath, 'utf8');

// Fix the null parameter TypeScript errors
content = content.replace(/validateExpiryDate\(null,/g, 'validateExpiryDate(null as any,');
content = content.replace(/validateExpiryDate\('01', null\)/g, "validateExpiryDate('01', null as any)");
content = content.replace(/validateCVV\(null\)/g, 'validateCVV(null as any)');
content = content.replace(/validateCVV\(undefined\)/g, 'validateCVV(undefined as any)');

// Write the file back
fs.writeFileSync(validationTestPath, content);

console.log('Fixed validation test TypeScript errors');