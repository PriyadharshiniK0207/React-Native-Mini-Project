import React, { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useDrawer } from '../context/DrawerContext';
import { navigationRef } from '../navigation/AppNavigator';

export const SideDrawer = () => {
  const { user, logout } = useContext(AuthContext);
  const { isOpen, closeDrawer, activeRoute, slideAnim, fadeAnim, drawerWidth } = useDrawer();
  const insets = useSafeAreaInsets();

  if (!isOpen) return null;

  const isSuperAdmin = user?.role === 'SuperAdmin';
  const initial = user?.username ? user.username.charAt(0).toUpperCase() : 'S';

  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0;
  const safeTop = Math.max(insets.top, statusBarHeight);
  const safeBottom = Math.max(insets.bottom, 16);

  const handleNavigate = (screenName) => {
    closeDrawer(() => {
      if (navigationRef.isReady()) {
        navigationRef.navigate(screenName);
      }
    });
  };

  const handleLogout = () => {
    closeDrawer(() => {
      logout();
    });
  };

  const mainNavItems = [
    {
      name: 'Dashboard',
      icon: 'home-outline',
      activeIcon: 'home',
      screen: 'Home',
      iconColor: '#e65100', // Image 2 house color
    },
    {
      name: 'Raise Complaint',
      icon: 'create-outline',
      activeIcon: 'create',
      screen: 'RaiseComplaint',
      iconColor: '#0284c7', // Image 2 pen color
    },
    {
      name: 'Complaints List',
      icon: 'clipboard-outline',
      activeIcon: 'clipboard',
      screen: isSuperAdmin ? 'AllComplaints' : 'MyComplaints',
      iconColor: '#8d6e63', // Image 2 clipboard color
    },
    {
      name: 'Reports',
      icon: 'bar-chart-outline',
      activeIcon: 'bar-chart',
      screen: 'Reports',
      iconColor: '#059669', // Image 2 chart color
    },
  ];

  const masterDataItems = [
    {
      name: 'Departments',
      icon: 'business-outline',
      screen: 'Departments',
      iconColor: '#00897b',
    },
    {
      name: 'Programmes',
      icon: 'school-outline',
      screen: 'Programmes',
      iconColor: '#37474f',
    },
    {
      name: 'Blocks',
      icon: 'cube-outline',
      screen: 'Blocks',
      iconColor: '#546e7a',
    },
    {
      name: 'Rooms',
      icon: 'enter-outline',
      screen: 'Rooms',
      iconColor: '#8d6e63',
    },
    {
      name: 'Complaint Types',
      icon: 'pricetag-outline',
      screen: 'Roles',
      iconColor: '#f59e0b',
    },
    {
      name: 'Roles',
      icon: 'shield-outline',
      screen: 'Roles',
      iconColor: '#e65100',
    },
    {
      name: 'Users',
      icon: 'people-outline',
      screen: 'Users',
      iconColor: '#d81b60',
    },
  ];

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={() => closeDrawer()}
    >
      <View style={styles.modalRoot}>
        {/* Dimmed Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => closeDrawer()}
          />
        </Animated.View>

        {/* Sliding Drawer Container */}
        <Animated.View
          style={[
            styles.drawerContainer,
            {
              width: drawerWidth,
              transform: [{ translateX: slideAnim }],
              paddingBottom: safeBottom,
            },
          ]}
        >
          {/* Solid Blue Header Block (Exact Image 2 Style) */}
          <View style={[styles.header, { paddingTop: safeTop + 14 }]}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => closeDrawer()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Close Drawer"
            >
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>

            {/* Large Circle Avatar with Initial */}
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>

            {/* Username */}
            <Text style={styles.userName} numberOfLines={1}>
              {user?.username || 'SuperAdmin'}
            </Text>

            {/* Role Subtitle */}
            <Text style={styles.userRole}>
              {user?.role || 'SuperAdmin'}
            </Text>
          </View>

          {/* Scrollable Navigation List (Clean white with divider lines matching Image 2) */}
          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Main Navigation Items */}
            {mainNavItems.map((item) => {
              const isActive = activeRoute === item.screen;
              return (
                <TouchableOpacity
                  key={item.name}
                  style={[styles.navItem, isActive && styles.navItemActive]}
                  onPress={() => handleNavigate(item.screen)}
                  activeOpacity={0.65}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name={isActive && item.activeIcon ? item.activeIcon : item.icon}
                      size={21}
                      color={item.iconColor}
                    />
                  </View>
                  <Text style={[styles.navText, isActive && styles.navTextActive]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Master Data Section Header (Matching Image 2) */}
            {isSuperAdmin && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>MASTER DATA</Text>
                </View>

                {masterDataItems.map((item) => {
                  const isActive = activeRoute === item.screen;
                  return (
                    <TouchableOpacity
                      key={item.name}
                      style={[styles.navItem, isActive && styles.navItemActive]}
                      onPress={() => handleNavigate(item.screen)}
                      activeOpacity={0.65}
                    >
                      <View style={styles.iconContainer}>
                        <Ionicons
                          name={item.icon}
                          size={20}
                          color={item.iconColor}
                        />
                      </View>
                      <Text style={[styles.navText, isActive && styles.navTextActive]}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </ScrollView>

          {/* Bottom Red Logout Button (Exact Image 2 Style) */}
          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.8}
              accessibilityLabel="Logout"
            >
              <Ionicons name="exit-outline" size={20} color="#ffffff" style={styles.logoutIcon} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    position: 'relative',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  drawerContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 25,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    backgroundColor: '#1976d2', // Solid Royal Dodger Blue matching Image 2
    alignItems: 'center',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.25)', // Translucent round avatar
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  userRole: {
    fontSize: 13,
    fontWeight: '500',
    color: '#e3f2fd',
    marginTop: 2,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  scrollList: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingVertical: 0,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5', // Image 2 thin light divider below each item
    backgroundColor: '#ffffff',
  },
  navItemActive: {
    backgroundColor: '#f0f7ff',
  },
  iconContainer: {
    width: 28,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginRight: 14,
  },
  navText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#334155',
    flex: 1,
  },
  navTextActive: {
    color: '#1976d2',
    fontWeight: '700',
  },
  sectionHeader: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
    backgroundColor: '#ffffff',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888888',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  bottomSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
  },
  logoutButton: {
    backgroundColor: '#e53935', // Vibrant red matching Image 2
    borderRadius: 8,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#e53935',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  logoutIcon: {
    marginRight: 4,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default SideDrawer;
