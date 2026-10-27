import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useDrawer } from '../context/DrawerContext';
import theme from '../styles/theme';

export const Header = ({ title, subtitle, rightAction, onRightActionPress, navigation }) => {
  const { user, logout } = useContext(AuthContext);
  const { openDrawer } = useDrawer();
  const insets = useSafeAreaInsets();

  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0;
  const safeTop = Math.max(insets.top, statusBarHeight) + theme.spacing.sm;

  const initial = user?.username ? user.username.charAt(0).toUpperCase() : 'U';
  const canGoBack = navigation?.canGoBack && navigation.canGoBack();

  return (
    <View style={[styles.container, { paddingTop: safeTop }]}>
      <View style={styles.topRow}>
        <View style={styles.leftSection}>
          {canGoBack && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[styles.iconButton, styles.backButton]}
              activeOpacity={0.7}
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          )}

          {/* Hamburger Menu Button (opens Image 2 style side drawer navbar) */}
          <TouchableOpacity
            onPress={() => openDrawer()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={[styles.iconButton, styles.menuButton]}
            activeOpacity={0.7}
            accessibilityLabel="Open Navigation Menu"
          >
            <Ionicons name="menu" size={24} color={theme.colors.primary} />
          </TouchableOpacity>

          {/* User Brand Badge & Info */}
          <TouchableOpacity
            style={styles.brandRow}
            onPress={openDrawer}
            activeOpacity={0.8}
            accessibilityLabel="Open Profile Drawer"
          >
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>{initial}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.username || 'Guest'}
              </Text>
              <View style={styles.roleTag}>
                <Text style={styles.roleText}>{user?.role || 'User'}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.actionsRow}>
          {rightAction && (
            <TouchableOpacity
              onPress={onRightActionPress}
              style={styles.iconButton}
              activeOpacity={0.7}
            >
              {rightAction}
            </TouchableOpacity>
          )}

          {user && (
            <TouchableOpacity
              onPress={logout}
              style={[styles.iconButton, styles.logoutButton]}
              activeOpacity={0.7}
              accessibilityLabel="Logout"
            >
              <Ionicons name="log-out-outline" size={20} color={theme.colors.danger} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {(title || subtitle) && (
        <View style={styles.titleSection}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoText: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  roleTag: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  roleText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButton: {
    backgroundColor: '#e0f2fe',
    borderColor: 'rgba(2, 132, 199, 0.35)',
  },
  backButton: {
    backgroundColor: '#f1f5f9',
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  titleSection: {
    marginTop: theme.spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
});

export default Header;
