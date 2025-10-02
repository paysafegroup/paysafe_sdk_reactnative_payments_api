import * as fs from 'fs';
import * as path from 'path';

describe('App Functionality Tests', () => {
  it('should have a valid navigation structure', () => {
    const appFilePath = path.join(__dirname, '..', 'App.tsx');
    const appContent = fs.readFileSync(appFilePath, 'utf8');

    expect(appContent).toContain('NavigationContainer');
    expect(appContent).toContain('Stack.Navigator');
    expect(appContent).toContain('Stack.Screen');

    expect(appContent).toContain('name="Home"');
    expect(appContent).toContain('name="Result"');
  });

  it('should have a context provider', () => {
    const contextFilePath = path.join(__dirname, '..', 'src', 'context', 'PaysafeContext.tsx');
    const contextContent = fs.readFileSync(contextFilePath, 'utf8');

    expect(contextContent).toContain('createContext');
    expect(contextContent).toContain('useContext');
    expect(contextContent).toContain('AppContext');
    expect(contextContent).toContain('AppProvider');
  });

  it('should have screens with proper UI components', () => {
    const homeScreenPath = path.join(__dirname, '..', 'src', 'screens', 'HomeScreen.tsx');
    const homeContent = fs.readFileSync(homeScreenPath, 'utf8');

    expect(homeContent).toContain('Button');
    expect(homeContent).toContain('Card');
    expect(homeContent).toContain('Text');
    expect(homeContent).toContain('navigation.navigate');

    const resultScreenPath = path.join(__dirname, '..', 'src', 'screens', 'ResultScreen.tsx');
    const resultContent = fs.readFileSync(resultScreenPath, 'utf8');

    expect(resultContent).toContain('Button');
    expect(resultContent).toContain('Card');
    expect(resultContent).toContain('Text');
    expect(resultContent).toContain('navigation.navigate');
  });
});
