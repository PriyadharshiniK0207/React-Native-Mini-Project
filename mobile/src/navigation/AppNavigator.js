import React, { useContext } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthContext } from '../context/AuthContext';
import { useDrawer } from '../context/DrawerContext';
import theme from '../styles/theme';

// Screens
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import RaiseComplaintScreen from '../screens/RaiseComplaintScreen';
import MyComplaintsScreen from '../screens/MyComplaintsScreen';
import ComplaintsDashboardScreen from '../screens/ComplaintsDashboardScreen';
import ReportsScreen from '../screens/ReportsScreen';
import DepartmentScreen from '../screens/DepartmentScreen';
import ProgrammeScreen from '../screens/ProgrammeScreen';
import BlockScreen from '../screens/BlockScreen';
import RoomScreen from '../screens/RoomScreen';
import RoleScreen from '../screens/RoleScreen';
import UserScreen from '../screens/UserScreen';
import SettingsScreen from '../screens/SettingsScreen';

export const navigationRef = createNavigationContainerRef();

const Stack = createNativeStackNavigator();

const commonScreenOptions = {
  headerShown: false,
  animation: 'slide_from_right',
  contentStyle: { backgroundColor: theme.colors.background },
};

export const AppNavigator = () => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  const { setActiveRoute } = useDrawer();

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const handleStateChange = () => {
    if (navigationRef.isReady()) {
      const current = navigationRef.getCurrentRoute();
      if (current?.name) {
        setActiveRoute(current.name);
      }
    }
  };

  return (
    <NavigationContainer ref={navigationRef} onStateChange={handleStateChange}>
      <Stack.Navigator screenOptions={commonScreenOptions}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="MainTabs" component={HomeScreen} />
            <Stack.Screen name="RaiseComplaint" component={RaiseComplaintScreen} />
            <Stack.Screen name="MyComplaints" component={MyComplaintsScreen} />
            <Stack.Screen name="AllComplaints" component={ComplaintsDashboardScreen} />
            <Stack.Screen name="Reports" component={ReportsScreen} />
            <Stack.Screen name="Departments" component={DepartmentScreen} />
            <Stack.Screen name="Programmes" component={ProgrammeScreen} />
            <Stack.Screen name="Blocks" component={BlockScreen} />
            <Stack.Screen name="Rooms" component={RoomScreen} />
            <Stack.Screen name="Roles" component={RoleScreen} />
            <Stack.Screen name="Users" component={UserScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppNavigator;
