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
import { blockService, departmentService, programmeService } from '../services/api';
import Header from '../components/Header';
import SelectPicker from '../components/SelectPicker';
import theme from '../styles/theme';

export const BlockScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);

  const [blocks, setBlocks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Form Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [programmeId, setProgrammeId] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError('');
      const [blockRes, deptRes, progRes] = await Promise.all([
        blockService.getAll(),
        departmentService.getAll(),
        programmeService.getAll(),
      ]);
      setBlocks(blockRes.data || []);
      setDepartments(deptRes.data || []);
      setProgrammes(progRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load blocks');
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
    setDepartmentId(departments[0]?._id || '');
    setProgrammeId(programmes[0]?._id || '');
    setDescription('');
    setModalVisible(true);
  };

  const handleOpenEdit = (block) => {
    setEditingId(block._id);
    setName(block.name);
    setDepartmentId(block.department?._id || block.department || '');
    setProgrammeId(block.programme?._id || block.programme || '');
    setDescription(block.description || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Validation Error', 'Block name is required');
      return;
    }
    if (!departmentId) {
      Alert.alert('Validation Error', 'Department is required');
      return;
    }
    if (!programmeId) {
      Alert.alert('Validation Error', 'Programme is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: trimmedName,
        department: departmentId,
        programme: programmeId,
        description: description.trim(),
      };
      if (editingId) {
        await blockService.update(editingId, payload);
      } else {
        await blockService.create(payload);
      }
      setModalVisible(false);
      loadData();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save block');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (block) => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete ${block.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockService.delete(block._id);
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
  const progOptions = programmes.map((p) => ({ label: p.name, value: p._id }));

  return (
    <View style={styles.container}>
      <Header
        title="Blocks"
        subtitle="Manage campus buildings & complexes"
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
          <Text style={styles.loadingText}>Loading blocks...</Text>
        </View>
      ) : (
        <FlatList
          data={blocks}
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
              <Ionicons name="cube-outline" size={48} color={theme.colors.textSubtle} />
              <Text style={styles.emptyTitle}>No blocks found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.deptMeta}>
                    {item.department?.name || 'No Dept'} • {item.programme?.name || 'No Programme'}
                  </Text>
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
                {editingId ? 'Edit Block' : 'Create Block'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Block Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Block A"
                  placeholderTextColor={theme.colors.textSubtle}
                  value={name}
                  onChangeText={setName}
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

              <SelectPicker
                label="Programme"
                value={programmeId}
                onValueChange={setProgrammeId}
                options={progOptions}
                placeholder="-- Select Programme --"
                required={true}
              />

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Block notes or details"
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
    marginBottom: 4,
  },
  deptMeta: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  cardDesc: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 8,
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

export default BlockScreen;
