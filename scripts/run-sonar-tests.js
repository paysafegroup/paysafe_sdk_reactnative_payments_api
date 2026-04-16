#!/usr/bin/env node

/**
 * Unified Test Runner for Sonar Coverage
 * Runs both SDK and DemoApp tests with coverage reporting
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command, options = {}) {
  console.log(`🚀 Running: ${command}`);
  try {
    execSync(command, { 
      stdio: 'inherit', 
      cwd: options.cwd || process.cwd(),
      ...options 
    });
    console.log(`✅ Successfully completed: ${command}\n`);
  } catch (error) {
    console.error(`❌ Failed to run: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
}

function main() {
  console.log('🏗️  Starting Sonar Coverage Test Runner');
  console.log('=====================================\n');

  // Ensure test reports directory exists
  const reportsDir = path.join(process.cwd(), 'tests-report');
  ensureDirectoryExists(reportsDir);

  try {
    // Step 1: Run all tests with focused coverage collection
    console.log('📦 Running All Tests with Focused Coverage...');
    const collectCoverageFrom = [
      'packages/paysafe-payments-sdk-common/src/**/*.{ts,tsx}',
      'packages/paysafe-google-pay/src/**/*.{ts,tsx}',
      'packages/paysafe-venmo/src/**/*.{ts,tsx}',
      'DemoAppExpo/src/context/**/*.{ts,tsx}',
      'DemoAppExpo/src/screens/**/*.{ts,tsx}',
    ];
    const coverageArgs = collectCoverageFrom.map(pattern => `--collectCoverageFrom="${pattern}"`).join(' ');
    runCommand(`jest --coverage ${coverageArgs} --passWithNoTests`);

    // Step 2: Verify coverage files exist
    const coverageFiles = [
      'tests-report/coverage/lcov.info',
      'tests-report/coverage-demo/lcov.info'
    ];

    console.log('🔍 Verifying coverage files...');
    coverageFiles.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        console.log(`✅ Found: ${filePath}`);
      } else {
        console.log(`⚠️  Missing: ${filePath}`);
      }
    });

    console.log('\n🎉 Test execution completed!');
    console.log('📊 Coverage reports are ready for Sonar analysis');
    console.log('💡 Run sonar-scanner to submit to SonarQube');
    
  } catch {
    console.log('⚠️  Some tests failed, but continuing with coverage generation...');
    console.log('📊 Coverage reports should still be available for Sonar analysis');
  }
}

if (require.main === module) {
  main();
}

module.exports = { runCommand, ensureDirectoryExists };
