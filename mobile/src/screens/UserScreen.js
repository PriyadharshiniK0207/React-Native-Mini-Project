import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { userService, departmentService, programmeService } from '../services/api';
import Header from '../components/Header';
import Badge from '../components/Badge';
import SelectPicker from '../components/SelectPicker';
import theme from '../styles/theme';

const ROLES = [
  'SuperAdmin',
  'User',
  'Networking Staff',
  'Plumber',
  'Electrician',
  'Software Developer',
  'Application',
  'PC Hardware',
];

export const UserScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Form Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('User');
  const [departmentId, setDepartmentId] = useState('');
  const [programmeId, setProgrammeId] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError('');
      const [userRes, deptRes, progRes] = await Promise.all([
        userService.getAll(),
        departmentService.getAll(),
        programmeService.getAll(),
      ]);
      setUsers(userRes.data || []);
      setDepartments(deptRes.data || []);
      setProgrammes(progRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setUsername('');
    setEmail('');
    setPhone('');
    setPassword('');
    setRole('User');
    setDepartmentId('');
    setProgrammeId('');
    setModalVisible(true);
  };

  const handleOpenEdit = (targetUser) => {
    setEditingId(targetUser._id);
    setUsername(targetUser.username);
    setEmail(targetUser.email);
    setPhone(targetUser.phone);
    setPassword('');
    setRole(targetUser.role);
    setDepartmentId(targetUser.department?._id || targetUser.department || '');
    setProgrammeId(targetUser.programme?._id || targetUser.programme || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    const trimmedUser = username.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedUser || !trimmedEmail || !trimmedPhone) {
      Alert.alert('Validation Error', 'Username, email, and phone number are required');
      return;
    }

    if (!editingId && !password) {
      Alert.alert('Validation Error', 'Password is required for new users');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        username: trimmedUser,
        email: trimmedEmail,
        phone: trimmedPhone,
        role,
      };

      if (password) payload.password = password;
      if (departmentId) payload.department = departmentId;
      if (programmeId) payload.programme = programmeId;

      if (editingId) {
        await userService.update(editingId, payload);
      } else {
        await userService.create(payload);
      }

      setModalVisible(false);
      loadData();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (targetUser) => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete user ${targetUser.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await userService.delete(targetUser._id);
              loadData();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  const isSuperAdmin = user?.role === 'SuperAdmin';
  const roleOptions = ROLES.map((r) => ({ label: r, value: r }));
  const deptOptions = [
    { label: 'None / General', value: '' },
    ...departments.map((d) => ({ label: d.name, value: d._id })),
  ];
  const progOptions = [
    { label: 'None', value: '' },
    ...programmes.map((p) => ({ label: p.name, value: p._id })),
  ];

  return (
    <View style={styles.container}>
      <Header
        title="User Management"
        subtitle="Manage user accounts, roles & department links"
        navigation={navigation}
        rightAction={
          isSuperAdmin ? (
            <Ionicons name="add" size={22} color={theme.colors.primary} />
          ) : null
        }
        onRightActionPress={handleOpenCreate}
      />

      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color={theme.colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : (
        <FlatList
          data={users}
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
              <Ionicons name="people-outline" size={48} color={theme.colors.textSubtle} />
              <Text style={styles.emptyTitle}>No users found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.username}</Text>
                  <Text style={styles.cardEmail}>{item.email}</Text>
                </View>

                {isSuperAdmin && (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      onPress={() => handleOpenEdit(item)}
                      style={styles.actionBtn}
                    >
                      <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(item)}
                      style={[styles.actionBtn, styles.deleteBtn]}
                    >
                      <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.metaRow}>
                <Badge label={item.role} type="role" />
                {item.phone && (
                  <View style={styles.phoneTag}>
                    <Ionicons name="call-outline" size={12} color={theme.colors.textMuted} />
                    <Text style={styles.phoneText}>{item.phone}</Text>
                  </View>
                )}
              </View>

              {item.department?.name ? (
                <Text style={styles.deptMeta}>Dept: {item.department.name}</Text>
              ) : null}
            </View>
          )}
        />
      )}

      {/* Add / Edit Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? 'Edit User' : 'Create User'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Username *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. johndoe"
                  placeholderTextColor={theme.colors.textSubtle}
                  value={username}
                  onChangeText={setUsername}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email Address *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. john@example.com"
                  placeholderTextColor={theme.colors.textSubtle}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. +1234567890"
                  placeholderTextColor={theme.colors.textSubtle}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <SelectPicker
                label="Role"
                value={role}
                onValueChange={setRole}
                options={roleOptions}
                required={true}
              />

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Password {editingId && '(Leave blank to keep unchanged)'}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={editingId ? '••••••••' : 'Enter password'}
                  placeholderTextColor={theme.colors.textSubtle}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <SelectPicker
                label="Department (Optional)"
                value={departmentId}
                onValueChange={setDepartmentId}
                options={deptOptions}
                placeholder="-- Select Department --"
              />

              <SelectPicker
                label="Programme (Optional)"
                value={programmeId}
                onValueChange={setProgrammeId}
                options={progOptions}
                placeholder="-- Select Programme --"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveBtn, saving ? styles.disabledBtn : null]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.saveBtnText}>{editingId ? 'Update' : 'Create'}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
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
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  cardEmail: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  phoneTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  deptMeta: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 6,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: theme.colors.textMuted,
  },
  emptyContainer: {
    padding: theme.spacing.xxxl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginTop: 12,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.dangerBg,
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
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: theme.spacing.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  formGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: theme.colors.inputBg,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.radius.md,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.md,
    height: 46,
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
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

export default UserScreen;
