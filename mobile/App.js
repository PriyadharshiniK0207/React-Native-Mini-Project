import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { DrawerProvider } from './src/context/DrawerContext';
import AppNavigator from './src/navigation/AppNavigator';
import SideDrawer from './src/components/SideDrawer';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DrawerProvider>
          <StatusBar style="dark" />
          <AppNavigator />
          <SideDrawer />
        </DrawerProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
