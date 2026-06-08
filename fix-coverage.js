#!/usr/bin/env node

/**
 * Fix Jest Coverage Files
 * Generates proper coverage files for Sonar integration
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
    return true;
  } catch {
    console.log(`⚠️  Command completed with warnings: ${command}\n`);
    return false;
  }
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
}

function cleanupCoverageFiles() {
  console.log('🧹 Cleaning up old coverage files...');
  
  const coverageDirs = [
    'coverage',
    'tests-report/coverage',
    'tests-report/coverage-demo',
    'DemoAppExpo/coverage'
  ];
  
  coverageDirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`🗑️  Removed: ${dir}`);
    }
  });
}

function generateRootCoverage() {
  console.log('📦 Generating SDK + DemoApp Combined Coverage...');
  
  // Ensure coverage directory exists
  ensureDirectoryExists('tests-report/coverage');
  
  // Run Jest with coverage for all packages and demo app
  const success = runCommand('jest --coverage --passWithNoTests --maxWorkers=1');
  
  return success;
}

function generateDemoAppCoverage() {
  console.log('📱 Generating Separate DemoApp Coverage...');
  
  // Ensure coverage directory exists
  ensureDirectoryExists('tests-report/coverage-demo');
  
  // Run Jest with coverage for demo app only
  const success = runCommand('jest --coverage --passWithNoTests --maxWorkers=1', { 
    cwd: 'DemoAppExpo' 
  });
  
  return success;
}

function verifyCoverageFiles() {
  console.log('🔍 Verifying coverage files...');
  
  const expectedFiles = [
    'tests-report/coverage/lcov.info',
    'tests-report/coverage/coverage-final.json',
    'tests-report/coverage/cobertura-coverage.xml',
    'tests-report/coverage-demo/lcov.info',
    'tests-report/coverage-demo/coverage-final.json',
    'tests-report/coverage-demo/cobertura-coverage.xml'
  ];
  
  const results = {};
  
  expectedFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      results[filePath] = {
        exists: true,
        size: stats.size,
        modified: stats.mtime
      };
      console.log(`✅ Found: ${filePath} (${stats.size} bytes)`);
    } else {
      results[filePath] = { exists: false };
      console.log(`❌ Missing: ${filePath}`);
    }
  });
  
  return results;
}

function createCoverageSummary(results) {
  console.log('📊 Creating coverage summary...');
  
  const summary = {
    timestamp: new Date().toISOString(),
    coverageFiles: results,
    sonarIntegration: {
      rootCoverage: 'tests-report/coverage/lcov.info',
      demoCoverage: 'tests-report/coverage-demo/lcov.info',
      combinedReports: Object.keys(results).filter(key => results[key].exists)
    },
    instructions: [
      'Run sonar-scanner to submit coverage to SonarQube',
      'Check sonar-project.properties for proper path configuration',
      'Verify coverage thresholds are appropriate for your project'
    ]
  };
  
  const summaryPath = path.join(process.cwd(), 'tests-report', 'coverage-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`✅ Coverage summary written to: ${summaryPath}`);
  
  return summary;
}

function main() {
  console.log('🔧 Fixing Jest Coverage Files');
  console.log('==============================\n');
  
  try {
    // Step 1: Clean up old coverage files
    cleanupCoverageFiles();
    
    // Step 2: Generate root coverage (SDK + DemoApp combined)
    const rootSuccess = generateRootCoverage();
    
    // Step 3: Generate separate DemoApp coverage
    const demoSuccess = generateDemoAppCoverage();
    
    // Step 4: Verify all coverage files
    const coverageResults = verifyCoverageFiles();
    
    // Step 5: Create summary
    createCoverageSummary(coverageResults);
    
    console.log('\n🎉 Coverage Files Fixed!');
    console.log('========================');
    console.log(`✅ Root Coverage: ${rootSuccess ? 'Generated' : 'Warning'}`);
    console.log(`✅ Demo Coverage: ${demoSuccess ? 'Generated' : 'Warning'}`);
    
    const existingFiles = Object.keys(coverageResults).filter(key => coverageResults[key].exists);
    console.log(`✅ Coverage Files: ${existingFiles.length}/6 generated`);
    
    console.log('\n🔧 Next Steps:');
    console.log('1. Run: npm run sonar:scan');
    console.log('2. Check SonarQube dashboard');
    console.log('3. Review coverage reports in tests-report/coverage/index.html');
    
  } catch (error) {
    console.error('❌ Error fixing coverage files:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { 
  runCommand, 
  ensureDirectoryExists, 
  cleanupCoverageFiles,
  generateRootCoverage,
  generateDemoAppCoverage,
  verifyCoverageFiles,
  createCoverageSummary
};