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
import { programmeService, departmentService } from '../services/api';
import Header from '../components/Header';
import SelectPicker from '../components/SelectPicker';
import theme from '../styles/theme';

export const ProgrammeScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);

  const [programmes, setProgrammes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Form Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError('');
      const [progRes, deptRes] = await Promise.all([
        programmeService.getAll(),
        departmentService.getAll(),
      ]);
      setProgrammes(progRes.data || []);
      setDepartments(deptRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load programmes');
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
    setName('');
    setShortName('');
    setDepartmentId(departments[0]?._id || '');
    setDescription('');
    setModalVisible(true);
  };

  const handleOpenEdit = (prog) => {
    setEditingId(prog._id);
    setName(prog.name);
    setShortName(prog.shortName);
    setDepartmentId(prog.department?._id || prog.department || '');
    setDescription(prog.description || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedShort = shortName.trim().toUpperCase();

    if (!trimmedName) {
      Alert.alert('Validation Error', 'Programme name is required');
      return;
    }
    if (trimmedShort.length < 2 || trimmedShort.length > 8) {
      Alert.alert('Validation Error', 'Short Name must be between 2 and 8 characters');
      return;
    }
    if (!departmentId) {
      Alert.alert('Validation Error', 'Please select a department');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: trimmedName,
        shortName: trimmedShort,
        department: departmentId,
        description: description.trim(),
      };
      if (editingId) {
        await programmeService.update(editingId, payload);
      } else {
        await programmeService.create(payload);
      }
      setModalVisible(false);
      loadData();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save programme');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (prog) => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete ${prog.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await programmeService.delete(prog._id);
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
  const deptOptions = departments.map((d) => ({ label: d.name, value: d._id }));

  return (
    <View style={styles.container}>
      <Header
        title="Programmes"
        subtitle="Manage degree & academic tracks"
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
          <Text style={styles.loadingText}>Loading programmes...</Text>
        </View>
      ) : (
        <FlatList
          data={programmes}
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
              <Ionicons name="school-outline" size={48} color={theme.colors.textSubtle} />
              <Text style={styles.emptyTitle}>No programmes found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <View style={styles.shortNameBadge}>
                    <Text style={styles.shortNameText}>{item.shortName}</Text>
                  </View>
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

              <Text style={styles.deptInfo}>
                Department: {item.department?.name || 'Unassigned'}
              </Text>

              {item.description ? (
                <Text style={styles.cardDesc}>{item.description}</Text>
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
                {editingId ? 'Edit Programme' : 'Create Programme'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Programme Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Bachelor of Science"
                  placeholderTextColor={theme.colors.textSubtle}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Short Name (2-8 Chars) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. BSC"
                  placeholderTextColor={theme.colors.textSubtle}
                  value={shortName}
                  onChangeText={setShortName}
                  autoCapitalize="characters"
                  maxLength={8}
                />
              </View>

              <SelectPicker
                label="Department"
                value={departmentId}
                onValueChange={setDepartmentId}
                options={deptOptions}
                placeholder="-- Select Department --"
                required={true}
              />

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Programme details or notes"
                  placeholderTextColor={theme.colors.textSubtle}
                  value={description}
                  onChangeText={setDescription}
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
    marginBottom: 6,
  },
  shortNameBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.sm,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  shortNameText: {
    color: theme.colors.secondary,
    fontSize: 11,
    fontWeight: '700',
  },
  deptInfo: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: 8,
  },
  cardDesc: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 4,
    lineHeight: 18,
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
    height: 80,
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

export default ProgrammeScreen;
