import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { complaintService, userService } from '../services/api';
import { resolveFileUrl, getBaseUrl } from '../config/apiConfig';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import SelectPicker from '../components/SelectPicker';
import theme from '../styles/theme';

export const ComplaintsDashboardScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);

  const [complaints, setComplaints] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, assigned: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeApiUrl, setActiveApiUrl] = useState('');

  // Assign Modal State
  const [assignTarget, setAssignTarget] = useState(null); // complaint object
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Status Modal State
  const [statusTarget, setStatusTarget] = useState(null); // complaint object
  const [newStatus, setNewStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError('');
      const [complaintsRes, statsRes, currentUrl] = await Promise.all([
        complaintService.getAll(),
        complaintService.getStats().catch(() => ({ data: null })),
        getBaseUrl(),
      ]);

      setComplaints(complaintsRes.data || []);
      setActiveApiUrl(currentUrl);

      if (statsRes.data) {
        setStats(statsRes.data);
      } else {
        // Fallback compute stats from complaints
        const list = complaintsRes.data || [];
        setStats({
          total: list.length,
          pending: list.filter((c) => c.status === 'Pending').length,
          assigned: list.filter((c) => c.status === 'Assigned').length,
          closed: list.filter((c) => c.status === 'Closed').length,
        });
      }

      // If SuperAdmin, fetch staff list for assignment (only staff/technicians, exclude SuperAdmin and regular Users)
      if (user?.role === 'SuperAdmin') {
        const usersRes = await userService.getAll().catch(() => ({ data: [] }));
        const staffOnly = (usersRes.data || []).filter(
          (u) => u.role && u.role.toLowerCase() !== 'superadmin' && u.role.toLowerCase() !== 'user'
        );
        setStaffUsers(staffOnly);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAssignSubmit = async () => {
    if (!selectedStaffId || !assignTarget) {
      Alert.alert('Selection Required', 'Please select a staff member to assign.');
      return;
    }

    setAssigning(true);
    try {
      await complaintService.assign(assignTarget._id, selectedStaffId);
      Alert.alert('Assigned', 'Complaint assigned successfully.');
      setAssignTarget(null);
      setSelectedStaffId('');
      loadData();
    } catch (err) {
      Alert.alert('Assignment Failed', err.response?.data?.message || 'Error assigning staff');
    } finally {
      setAssigning(false);
    }
  };

  const handleStatusSubmit = async () => {
    if (!newStatus || !statusTarget) {
      Alert.alert('Selection Required', 'Please select a status.');
      return;
    }

    setUpdatingStatus(true);
    try {
      await complaintService.updateStatus(statusTarget._id, newStatus);
      Alert.alert('Status Updated', `Complaint marked as ${newStatus}.`);
      setStatusTarget(null);
      setNewStatus('');
      loadData();
    } catch (err) {
      Alert.alert('Update Failed', err.response?.data?.message || 'Error updating status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleMarkCompleted = async (complaintId) => {
    try {
      await complaintService.updateStatus(complaintId, 'Closed');
      Alert.alert('Success', 'Complaint marked as Completed/Closed.');
      loadData();
    } catch (err) {
      Alert.alert('Failed', err.response?.data?.message || 'Error closing complaint');
    }
  };

  const currentUserId = user?.id || user?._id;
  const isSuperAdmin = user?.role === 'SuperAdmin';

  const staffOptions = staffUsers.map((u) => ({
    label: `${u.username} (${u.role})`,
    value: u._id,
  }));

  const statusOptions = [
    { label: 'Pending', value: 'Pending' },
    { label: 'Assigned', value: 'Assigned' },
    { label: 'In-Progress', value: 'In-Progress' },
    { label: 'Onhold', value: 'Onhold' },
    { label: 'Closed (Completed)', value: 'Closed' },
  ];

  return (
    <View style={styles.container}>
      <Header
        title="All Complaints"
        subtitle="Manage, assign, and resolve campus tickets"
        navigation={navigation}
      />

      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color={theme.colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Stats Grid */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <StatCard label="Total" value={stats.total} color={theme.colors.primary} />
          <StatCard label="Pending" value={stats.pending} color={theme.colors.warning} />
          <StatCard label="Assigned" value={stats.assigned} color={theme.colors.info} />
          <StatCard label="Closed" value={stats.closed} color={theme.colors.success} />
        </View>
      </View>

      {/* Complaints List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading complaints dashboard...</Text>
        </View>
      ) : (
        <FlatList
          data={complaints}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={48} color={theme.colors.textSubtle} />
              <Text style={styles.emptyTitle}>No complaints available</Text>
              <Text style={styles.emptySubtitle}>There are no tickets logged in the system.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isAssignee =
              item.assignedTo &&
              String(item.assignedTo._id || item.assignedTo) === String(currentUserId);
            const canUpdateStatus = isSuperAdmin || isAssignee;

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardLocation}>
                    <Ionicons name="business-outline" size={16} color={theme.colors.primary} />
                    <Text style={styles.cardBlockText}>
                      {item.blockName} • Room {item.roomNumber}
                    </Text>
                  </View>
                  <Badge label={item.status} />
                </View>

                <Text style={styles.cardType}>{item.complaintType}</Text>

                {item.remarks ? (
                  <Text style={styles.cardRemarks}>{item.remarks}</Text>
                ) : null}

                {/* Sub info */}
                <View style={styles.subInfoRow}>
                  <Text style={styles.subInfoLabel}>Created by: </Text>
                  <Text style={styles.subInfoValue}>
                    {item.createdBy?.username || item.createdBy?.email || '-'}
                  </Text>
                </View>

                <View style={styles.subInfoRow}>
                  <Text style={styles.subInfoLabel}>Assigned to: </Text>
                  <Text style={styles.subInfoValue}>
                    {item.assignedTo?.username || item.assignedTo?.email || 'Unassigned'}
                  </Text>
                </View>

                <View style={styles.subInfoRow}>
                  <Text style={styles.subInfoLabel}>Date: </Text>
                  <Text style={styles.subInfoValue}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>

                {/* Attachment Link */}
                {item.attachment && (
                  <TouchableOpacity
                    style={styles.attachmentPill}
                    onPress={() => {
                      const fileUrl = resolveFileUrl(item.attachment, activeApiUrl);
                      Linking.openURL(fileUrl).catch(() => {
                        Alert.alert('Cannot Open', fileUrl);
                      });
                    }}
                  >
                    <Ionicons name="attach" size={14} color={theme.colors.primary} />
                    <Text style={styles.attachmentPillText}>View Attachment</Text>
                  </TouchableOpacity>
                )}

                {/* Actions */}
                <View style={styles.actionsRow}>
                  {canUpdateStatus && item.status !== 'Closed' && (
                    <TouchableOpacity
                      style={styles.completeBtn}
                      onPress={() => handleMarkCompleted(item._id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="checkmark-done" size={16} color="#ffffff" />
                      <Text style={styles.completeBtnText}>Mark Completed</Text>
                    </TouchableOpacity>
                  )}

                  {isSuperAdmin && (
                    <TouchableOpacity
                      style={styles.assignBtn}
                      onPress={() => {
                        setAssignTarget(item);
                        setSelectedStaffId(item.assignedTo?._id || '');
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="person-add-outline" size={14} color={theme.colors.primary} />
                      <Text style={styles.assignBtnText}>Assign</Text>
                    </TouchableOpacity>
                  )}

                  {canUpdateStatus && (
                    <TouchableOpacity
                      style={styles.statusBtn}
                      onPress={() => {
                        setStatusTarget(item);
                        setNewStatus(item.status || '');
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="create-outline" size={14} color={theme.colors.textMuted} />
                      <Text style={styles.statusBtnText}>Status</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* SuperAdmin Assign Modal */}
      <Modal
        visible={!!assignTarget}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAssignTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Complaint</Text>
              <TouchableOpacity onPress={() => setAssignTarget(null)}>
                <Ionicons name="close" size={22} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Assign ticket at {assignTarget?.blockName} - Room {assignTarget?.roomNumber} to a staff member:
            </Text>

            <SelectPicker
              label="Select Staff / Technician"
              value={selectedStaffId}
              onValueChange={setSelectedStaffId}
              options={staffOptions}
              placeholder="-- Choose Staff Member --"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setAssignTarget(null)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, assigning ? styles.disabledBtn : null]}
                onPress={handleAssignSubmit}
                disabled={assigning}
              >
                {assigning ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveBtnText}>Confirm Assign</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Status Update Modal */}
      <Modal
        visible={!!statusTarget}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setStatusTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Status</Text>
              <TouchableOpacity onPress={() => setStatusTarget(null)}>
                <Ionicons name="close" size={22} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Current status is {statusTarget?.status}. Select new status:
            </Text>

            <SelectPicker
              label="New Status"
              value={newStatus}
              onValueChange={setNewStatus}
              options={statusOptions}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setStatusTarget(null)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, updatingStatus ? styles.disabledBtn : null]}
                onPress={handleStatusSubmit}
                disabled={updatingStatus}
              >
                {updatingStatus ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveBtnText}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  statsContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: theme.spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardBlockText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  cardType: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 6,
  },
  cardRemarks: {
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 18,
    marginBottom: 10,
  },
  subInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  subInfoLabel: {
    fontSize: 12,
    color: theme.colors.textSubtle,
    fontWeight: '600',
  },
  subInfoValue: {
    fontSize: 12,
    color: theme.colors.text,
  },
  attachmentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    marginTop: 8,
  },
  attachmentPillText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.success,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
  },
  completeBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  assignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
  },
  assignBtnText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  statusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
  },
  statusBtnText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  emptyContainer: {
    padding: theme.spacing.xxxl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.dangerBg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    margin: theme.spacing.lg,
    gap: 8,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 13,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: theme.spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginBottom: 16,
    lineHeight: 18,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  cancelBtnText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.6,
  },
});

export default ComplaintsDashboardScreen;
