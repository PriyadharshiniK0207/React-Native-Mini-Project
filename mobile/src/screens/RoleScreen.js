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
import { roleService } from '../services/api';
import Header from '../components/Header';
import theme from '../styles/theme';

export const RoleScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Form Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissionsStr, setPermissionsStr] = useState('');
  const [saving, setSaving] = useState(false);

  const loadRoles = useCallback(async () => {
    try {
      setError('');
      const res = await roleService.getAll();
      setRoles(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load roles');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRoles();
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setPermissionsStr('');
    setModalVisible(true);
  };

  const handleOpenEdit = (role) => {
    setEditingId(role._id);
    setName(role.name);
    setDescription(role.description || '');
    setPermissionsStr(role.permissions?.join(', ') || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Validation Error', 'Role name is required');
      return;
    }

    const permissions = permissionsStr
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p);

    setSaving(true);
    try {
      const payload = {
        name: trimmedName,
        description: description.trim(),
        permissions,
      };
      if (editingId) {
        await roleService.update(editingId, payload);
      } else {
        await roleService.create(payload);
      }
      setModalVisible(false);
      loadRoles();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (role) => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete role ${role.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await roleService.delete(role._id);
              loadRoles();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  const isSuperAdmin = user?.role === 'SuperAdmin';

  return (
    <View style={styles.container}>
      <Header
        title="Roles & Permissions"
        subtitle="Manage access roles and authorization"
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
          <Text style={styles.loadingText}>Loading roles...</Text>
        </View>
      ) : (
        <FlatList
          data={roles}
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
              <Ionicons name="shield-outline" size={48} color={theme.colors.textSubtle} />
              <Text style={styles.emptyTitle}>No roles found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  {item.description ? (
                    <Text style={styles.cardDesc}>{item.description}</Text>
                  ) : null}
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

              {/* Permissions list */}
              <View style={styles.permissionsContainer}>
                <Text style={styles.permHeader}>PERMISSIONS:</Text>
                <View style={styles.permPills}>
                  {item.permissions && item.permissions.length > 0 ? (
                    item.permissions.map((p, idx) => (
                      <View key={idx} style={styles.permPill}>
                        <Text style={styles.permText}>{p}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noPermText}>No explicit permissions set</Text>
                  )}
                </View>
              </View>
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
                {editingId ? 'Edit Role' : 'Create Role'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Role Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Electrician, PC Hardware"
                  placeholderTextColor={theme.colors.textSubtle}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Brief role responsibilities"
                  placeholderTextColor={theme.colors.textSubtle}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Permissions (Comma-separated)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="e.g. view_complaints, update_status, resolve_ticket"
                  placeholderTextColor={theme.colors.textSubtle}
                  value={permissionsStr}
                  onChangeText={setPermissionsStr}
                  multiline
                  numberOfLines={3}
                />
              </View>

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
  cardDesc: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  permissionsContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
  },
  permHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSubtle,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  permPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  permPill: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.sm,
  },
  permText: {
    color: theme.colors.secondary,
    fontSize: 11,
    fontWeight: '600',
  },
  noPermText: {
    fontSize: 12,
    color: theme.colors.textSubtle,
    fontStyle: 'italic',
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
    maxHeight: '85%',
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
  textArea: {
    height: 70,
    paddingTop: 10,
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

export default RoleScreen;
