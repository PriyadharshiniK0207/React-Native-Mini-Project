import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useDrawer } from '../context/DrawerContext';
import { complaintService } from '../services/api';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import theme from '../styles/theme';

export const HomeScreen = ({ navigation }) => {
  const { user, refreshProfile } = useContext(AuthContext);
  const { openDrawer } = useDrawer();
  const [stats, setStats] = useState({ total: 0, pending: 0, assigned: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const res = await complaintService.getStats();
      if (res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.warn('Failed to load home stats:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const onRefresh = () => {
    setRefreshing(true);
    refreshProfile();
    loadStats();
  };

  const isSuperAdmin = user?.role === 'SuperAdmin';
  const isRegularUser = user?.role === 'User';

  return (
    <View style={styles.container}>
      <Header
        title="TMS Dashboard"
        subtitle="Ticket & Complaint Management System"
        navigation={navigation}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Welcome Banner */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeHeader}>
            <View>
              <Text style={styles.greeting}>Hello, {user?.username || 'User'}! 👋</Text>
              <View style={styles.roleBadge}>
                <Ionicons name="shield-checkmark" size={13} color={theme.colors.primary} />
                <Text style={styles.roleBadgeText}>Role: {user?.role || 'User'}</Text>
              </View>
            </View>
          </View>
          {user?.department?.name && (
            <Text style={styles.deptText}>
              Department: <Text style={{ color: theme.colors.text }}>{user.department.name}</Text>
            </Text>
          )}
        </View>

        {/* Overview Statistics Grid (Matching Image 2 Colors) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Overview Statistics</Text>
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              icon="hourglass-outline"
              label="Pending"
              value={stats.pending}
              color="#f59e0b" // Image 2 Orange
              onPress={() => navigation.navigate(isSuperAdmin ? 'AllComplaints' : 'MyComplaints')}
            />
            <StatCard
              icon="construct-outline"
              label="In-Progress"
              value={stats.assigned}
              color="#8b5cf6" // Image 2 Purple
              onPress={() => navigation.navigate(isSuperAdmin ? 'AllComplaints' : 'MyComplaints')}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              icon="checkmark-circle-outline"
              label="Completed"
              value={stats.closed}
              color="#10b981" // Image 2 Green
              onPress={() => navigation.navigate(isSuperAdmin ? 'AllComplaints' : 'MyComplaints')}
            />
            <StatCard
              icon="file-tray-full-outline"
              label="Total Complaints"
              value={stats.total}
              color="#0284c7" // Image 2 Blue
              onPress={() => navigation.navigate(isSuperAdmin ? 'AllComplaints' : 'MyComplaints')}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {(isSuperAdmin || isRegularUser) && (
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('RaiseComplaint')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBadge, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
                <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.actionTitle}>Raise Complaint</Text>
              <Text style={styles.actionDesc}>Submit a new maintenance or service issue</Text>
            </TouchableOpacity>
          )}

          {!isSuperAdmin && (
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('MyComplaints')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBadge, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                <Ionicons name="list" size={24} color={theme.colors.secondary} />
              </View>
              <Text style={styles.actionTitle}>My Complaints</Text>
              <Text style={styles.actionDesc}>Track status and view details of your tickets</Text>
            </TouchableOpacity>
          )}

          {isSuperAdmin && (
            <>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('AllComplaints')}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                  <Ionicons name="file-tray-full" size={24} color={theme.colors.info} />
                </View>
                <Text style={styles.actionTitle}>Manage Complaints</Text>
                <Text style={styles.actionDesc}>View, assign staff, and update ticket states</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('Reports')}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Ionicons name="stats-chart" size={24} color={theme.colors.success} />
                </View>
                <Text style={styles.actionTitle}>System Reports</Text>
                <Text style={styles.actionDesc}>Generate and export filtered complaint data</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Side Navbar Banner (Matching Image 2 Request) */}
        <TouchableOpacity
          style={styles.drawerBannerCard}
          onPress={() => openDrawer()}
          activeOpacity={0.8}
          accessibilityLabel="Open Side Menu"
        >
          <View style={styles.drawerBannerContent}>
            <View style={styles.drawerBannerIconWrap}>
              <Ionicons name="menu" size={24} color="#ffffff" />
            </View>
            <View style={styles.drawerBannerTextWrap}>
              <Text style={styles.drawerBannerTitle}>Open Side Navigation Menu</Text>
              <Text style={styles.drawerBannerSubtitle}>
                Master Data: Departments, Blocks, Rooms & more
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#1976d2" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 32,
  },
  welcomeCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.25)',
  },
  roleBadgeText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  deptText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.xs,
    letterSpacing: 0.3,
  },
  statsGrid: {
    marginBottom: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  actionsGrid: {
    gap: 10,
    marginBottom: theme.spacing.md,
  },
  actionCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: theme.spacing.md,
  },
  actionIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 12,
    color: theme.colors.textMuted,
    lineHeight: 16,
  },
  drawerBannerCard: {
    backgroundColor: '#ffffff',
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: '#e0e7ff',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  drawerBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  drawerBannerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1976d2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerBannerTextWrap: {
    flex: 1,
  },
  drawerBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  drawerBannerSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
});

export default HomeScreen;
