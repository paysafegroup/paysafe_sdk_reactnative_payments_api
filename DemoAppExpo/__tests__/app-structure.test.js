describe('App Structure Tests', () => {
  it('should have the correct file structure', () => {
    const fs = require('fs');
    const path = require('path');

    const appFile = path.join(__dirname, '..', 'App.tsx');
    const homeScreenFile = path.join(__dirname, '..', 'src', 'screens', 'HomeScreen.tsx');
    const resultScreenFile = path.join(__dirname, '..', 'src', 'screens', 'ResultScreen.tsx');
    const contextFile = path.join(__dirname, '..', 'src', 'context', 'PaysafeContext.tsx');

    expect(fs.existsSync(appFile)).toBe(true);
    expect(fs.existsSync(homeScreenFile)).toBe(true);
    expect(fs.existsSync(resultScreenFile)).toBe(true);
    expect(fs.existsSync(contextFile)).toBe(true);
  });

  it('should have the correct dependencies in package.json', () => {
    const packageJson = require('../package.json');

    expect(packageJson.dependencies).toHaveProperty('@react-navigation/native');
    expect(packageJson.dependencies).toHaveProperty('react-native-paper');
    expect(packageJson.dependencies).toHaveProperty('expo');

    expect(packageJson.devDependencies).toHaveProperty('jest');
    expect(packageJson.devDependencies).toHaveProperty('typescript');
  });
});
