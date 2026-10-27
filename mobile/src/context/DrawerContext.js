import React, { createContext, useContext, useState, useRef } from 'react';
import { Animated, useWindowDimensions, Dimensions } from 'react-native';

const DrawerContext = createContext(null);

export const DrawerProvider = ({ children }) => {
  const { width: windowWidth } = useWindowDimensions();
  const screenWidth = windowWidth || Dimensions.get('window').width || 360;
  const drawerWidth = Math.min(Math.round(screenWidth * 0.78), 320);

  const [isOpen, setIsOpen] = useState(false);
  const [activeRoute, setActiveRoute] = useState('Home');
  const slideAnim = useRef(new Animated.Value(-320)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const openDrawer = () => {
    slideAnim.setValue(-drawerWidth);
    fadeAnim.setValue(0);
    setIsOpen(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDrawer = (callback) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -drawerWidth,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsOpen(false);
      if (typeof callback === 'function') {
        callback();
      }
    });
  };

  const toggleDrawer = () => {
    if (isOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  };

  return (
    <DrawerContext.Provider
      value={{
        isOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        activeRoute,
        setActiveRoute,
        slideAnim,
        fadeAnim,
        drawerWidth,
      }}
    >
      {children}
    </DrawerContext.Provider>
  );
};

export const useDrawer = () => {
  const context = useContext(DrawerContext);
  return (
    context || {
      isOpen: false,
      activeRoute: 'Home',
      openDrawer: () => {},
      closeDrawer: () => {},
      toggleDrawer: () => {},
      setActiveRoute: () => {},
      drawerWidth: 300,
    }
  );
};

export default DrawerContext;
