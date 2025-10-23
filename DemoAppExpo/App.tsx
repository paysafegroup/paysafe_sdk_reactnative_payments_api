import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import ResultScreen from './src/screens/ResultScreen';

// Import context provider
import { AppProvider } from './src/context/PaysafeContext';

// Define the navigation stack parameter list
export type RootStackParamList = {
  Home: undefined;
  Result: {
    success: boolean;
    message: string;
    timestamp: string;
  };
};

// Create the navigation stack
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <AppProvider>
          <NavigationContainer>
            <Stack.Navigator initialRouteName="Home">
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{ title: 'Expo Demo' }}
              />
              <Stack.Screen
                name="Result"
                component={ResultScreen}
                options={{ title: 'Details', headerBackVisible: false }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </AppProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
