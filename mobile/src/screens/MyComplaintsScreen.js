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
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { complaintService } from '../services/api';
import { resolveFileUrl, getBaseUrl } from '../config/apiConfig';
import Header from '../components/Header';
import Badge from '../components/Badge';
import SelectPicker from '../components/SelectPicker';
import theme from '../styles/theme';

export const MyComplaintsScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Selected complaint detail modal state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [updateStatusVal, setUpdateStatusVal] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [activeApiUrl, setActiveApiUrl] = useState('');

  const loadData = useCallback(async () => {
    try {
      setError('');
      const [res, currentApiUrl] = await Promise.all([
        complaintService.getAll(),
        getBaseUrl(),
      ]);
      setActiveApiUrl(currentApiUrl);

      const all = res.data || [];
      const currentUserId = user?.id || user?._id;

      // Filter complaints for current user: created by them or assigned to them
      const userComplaints = all.filter((c) => {
        const createdById = c.createdBy?._id || c.createdBy;
        const assignedToId = c.assignedTo?._id || c.assignedTo;
        return (
          String(createdById) === String(currentUserId) ||
          String(assignedToId) === String(currentUserId)
        );
      });

      setComplaints(userComplaints);
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

  const handleUpdateStatus = async () => {
    if (!updateStatusVal || !selectedComplaint) return;
    setUpdatingStatus(true);
    try {
      await complaintService.updateStatus(selectedComplaint._id, updateStatusVal);
      Alert.alert('Status Updated', `Complaint status changed to ${updateStatusVal}`);
      await loadData();

      // Refresh selected complaint modal view
      const updatedItem = complaints.find((c) => c._id === selectedComplaint._id);
      if (updatedItem) {
        setSelectedComplaint({ ...updatedItem, status: updateStatusVal });
      } else {
        setSelectedComplaint(null);
      }
    } catch (err) {
      Alert.alert('Update Failed', err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const currentUserId = user?.id || user?._id;
  const isAssignee =
    selectedComplaint?.assignedTo &&
    String(selectedComplaint.assignedTo._id || selectedComplaint.assignedTo) === String(currentUserId);
  const isCreator =
    selectedComplaint?.createdBy &&
    String(selectedComplaint.createdBy._id || selectedComplaint.createdBy) === String(currentUserId);

  // Available status transitions based on backend rules
  const availableStatuses = [];
  if (user?.role === 'SuperAdmin') {
    availableStatuses.push(
      { label: 'Pending', value: 'Pending' },
      { label: 'Assigned', value: 'Assigned' },
      { label: 'In-Progress', value: 'In-Progress' },
      { label: 'Onhold', value: 'Onhold' },
      { label: 'Closed', value: 'Closed' }
    );
  } else if (isAssignee) {
    availableStatuses.push(
      { label: 'In-Progress', value: 'In-Progress' },
      { label: 'Onhold', value: 'Onhold' },
      { label: 'Completed / Closed', value: 'Closed' }
    );
  } else if (isCreator) {
    availableStatuses.push(
      { label: 'Pending', value: 'Pending' },
      { label: 'Closed', value: 'Closed' }
    );
  }

  // Filter list
  const filtered = filterStatus === 'All'
    ? complaints
    : complaints.filter((c) => c.status === filterStatus);

  const statuses = ['All', 'Pending', 'Assigned', 'In-Progress', 'Onhold', 'Closed'];

  return (
    <View style={styles.container}>
      <Header
        title="My Complaints"
        subtitle="Track tickets submitted by or assigned to you"
        navigation={navigation}
      />

      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color={theme.colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Filter Tabs / Pills */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPills}>
          {statuses.map((s) => {
            const isActive = filterStatus === s;
            const count = s === 'All' ? complaints.length : complaints.filter((c) => c.status === s).length;
            return (
              <TouchableOpacity
                key={s}
                style={[styles.filterPill, isActive ? styles.filterPillActive : null]}
                onPress={() => setFilterStatus(s)}
              >
                <Text style={[styles.filterPillText, isActive ? styles.filterPillTextActive : null]}>
                  {s} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Complaints List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading complaints...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
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
              <Text style={styles.emptyTitle}>No complaints found</Text>
              <Text style={styles.emptySubtitle}>
                {filterStatus === 'All'
                  ? "You don't have any tickets raised or assigned yet."
                  : `No complaints with status "${filterStatus}".`}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => {
                setSelectedComplaint(item);
                setUpdateStatusVal(item.status || '');
              }}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardLocation}>
                  <Ionicons name="location-outline" size={16} color={theme.colors.primary} />
                  <Text style={styles.cardBlockText}>
                    {item.blockName} • Room {item.roomNumber}
                  </Text>
                </View>
                <Badge label={item.status} />
              </View>

              <Text style={styles.cardType}>{item.complaintType}</Text>

              {item.remarks ? (
                <Text style={styles.cardRemarks} numberOfLines={2}>
                  {item.remarks}
                </Text>
              ) : null}

              <View style={styles.cardFooter}>
                <Text style={styles.cardDate}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
                {item.attachment && (
                  <View style={styles.attachmentTag}>
                    <Ionicons name="attach" size={14} color={theme.colors.primary} />
                    <Text style={styles.attachmentTagText}>Attachment</Text>
                  </View>
                )}
                <View style={styles.viewDetailsRow}>
                  <Text style={styles.viewDetailsText}>View Details</Text>
                  <Ionicons name="chevron-forward" size={14} color={theme.colors.primary} />
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Complaint Detail Modal */}
      <Modal
        visible={!!selectedComplaint}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedComplaint(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailSheet}>
            <View style={styles.detailHeader}>
              <View>
                <Text style={styles.detailTitle}>Complaint Details</Text>
                <Text style={styles.detailDate}>
                  Created: {selectedComplaint ? new Date(selectedComplaint.createdAt).toLocaleString() : ''}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedComplaint(null)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={24} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            {selectedComplaint && (
              <ScrollView contentContainerStyle={styles.detailContent}>
                {/* Status Banner */}
                <View style={styles.statusRow}>
                  <Text style={styles.detailFieldLabel}>CURRENT STATUS</Text>
                  <Badge label={selectedComplaint.status} />
                </View>

                {/* Details Grid */}
                <View style={styles.metaGrid}>
                  <View style={styles.metaItem}>
                    <Text style={styles.detailFieldLabel}>BLOCK</Text>
                    <Text style={styles.detailFieldValue}>{selectedComplaint.blockName || '-'}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.detailFieldLabel}>ROOM</Text>
                    <Text style={styles.detailFieldValue}>{selectedComplaint.roomNumber || '-'}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.detailFieldLabel}>COMPLAINT TYPE</Text>
                    <Text style={styles.detailFieldValue}>{selectedComplaint.complaintType || '-'}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.detailFieldLabel}>ASSIGNED TO</Text>
                    <Text style={styles.detailFieldValue}>
                      {selectedComplaint.assignedTo?.username ||
                        selectedComplaint.assignedTo?.email ||
                        'Unassigned'}
                    </Text>
                  </View>
                </View>

                {/* Description / Remarks */}
                <Text style={[styles.detailFieldLabel, { marginTop: 16 }]}>REMARKS / DESCRIPTION</Text>
                <View style={styles.remarksBox}>
                  <Text style={styles.remarksText}>
                    {selectedComplaint.remarks || 'No remarks provided.'}
                  </Text>
                </View>

                {/* Attachment Link */}
                {selectedComplaint.attachment && (
                  <View style={styles.attachmentSection}>
                    <Text style={styles.detailFieldLabel}>ATTACHMENT</Text>
                    <TouchableOpacity
                      style={styles.attachmentButton}
                      onPress={() => {
                        const fileUrl = resolveFileUrl(selectedComplaint.attachment, activeApiUrl);
                        Linking.openURL(fileUrl).catch(() => {
                          Alert.alert('Cannot Open URL', fileUrl);
                        });
                      }}
                    >
                      <Ionicons name="document-attach" size={20} color={theme.colors.primary} />
                      <Text style={styles.attachmentButtonText}>View Attachment</Text>
                      <Ionicons name="open-outline" size={16} color={theme.colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Update Status Controls */}
                {availableStatuses.length > 0 && (
                  <View style={styles.updateStatusSection}>
                    <Text style={styles.detailFieldLabel}>CHANGE STATUS</Text>
                    <SelectPicker
                      value={updateStatusVal}
                      onValueChange={setUpdateStatusVal}
                      options={availableStatuses}
                      placeholder="Select new status"
                    />

                    <TouchableOpacity
                      style={[styles.saveStatusBtn, updatingStatus ? styles.disabledBtn : null]}
                      onPress={handleUpdateStatus}
                      disabled={updatingStatus}
                    >
                      {updatingStatus ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.saveStatusBtnText}>Save Status Update</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
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
  filterBar: {
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
    paddingVertical: 10,
  },
  filterPills: {
    paddingHorizontal: theme.spacing.lg,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  filterPillActive: {
    backgroundColor: '#e0f2fe',
    borderColor: theme.colors.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  filterPillTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
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
    marginBottom: 8,
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
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 6,
  },
  cardRemarks: {
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
    paddingTop: 10,
    marginTop: 4,
  },
  cardDate: {
    fontSize: 12,
    color: theme.colors.textSubtle,
  },
  attachmentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.pill,
  },
  attachmentTagText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
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
    justifyContent: 'center',
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
    textAlign: 'center',
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
    justifyContent: 'flex-end',
  },
  detailSheet: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    borderTopWidth: 1,
    borderColor: theme.colors.cardBorder,
    maxHeight: '85%',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
  },
  detailDate: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  detailContent: {
    padding: theme.spacing.xl,
    paddingBottom: 40,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  detailFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    width: '47%',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  detailFieldValue: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  remarksBox: {
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    marginTop: 4,
  },
  remarksText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  attachmentSection: {
    marginTop: 16,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderRadius: theme.radius.md,
    padding: 12,
    marginTop: 6,
  },
  attachmentButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  updateStatusSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
  },
  saveStatusBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  saveStatusBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default MyComplaintsScreen;
