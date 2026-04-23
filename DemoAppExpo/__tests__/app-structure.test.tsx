import * as fs from 'fs';
import * as path from 'path';

interface PackageJson {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

describe('App Structure Tests', () => {
  it('should have the correct file structure', () => {
    const appLayoutFile = path.join(__dirname, '..', 'app', '_layout.tsx');
    const tabsLayoutFile = path.join(__dirname, '..', 'app', '(tabs)', '_layout.tsx');
    const tabsIndexFile = path.join(__dirname, '..', 'app', '(tabs)', 'index.tsx');

    expect(fs.existsSync(appLayoutFile)).toBe(true);
    expect(fs.existsSync(tabsLayoutFile)).toBe(true);
    expect(fs.existsSync(tabsIndexFile)).toBe(true);
  });

  it('should have the correct dependencies in package.json', () => {
    const packageJson = require('../package.json') as PackageJson;

    expect(packageJson.dependencies).toHaveProperty('@react-navigation/native');
    expect(packageJson.dependencies).toHaveProperty('react-native-paper');
    expect(packageJson.dependencies).toHaveProperty('expo');

    expect(packageJson.devDependencies).toHaveProperty('jest');
    expect(packageJson.devDependencies).toHaveProperty('typescript');
  });
});
