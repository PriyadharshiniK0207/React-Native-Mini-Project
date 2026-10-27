import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { AuthContext } from '../context/AuthContext';
import {
  complaintService,
  departmentService,
  blockService,
  roomService,
} from '../services/api';
import Header from '../components/Header';
import SelectPicker from '../components/SelectPicker';
import theme from '../styles/theme';

const COMPLAINT_TYPES = [
  'PC Hardware',
  'PC Software',
  'Application Issues',
  'Network',
  'Electronics',
  'Plumbing',
  'Other',
];

export const RaiseComplaintScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);

  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [blockId, setBlockId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState('');
  const [customRoomNumber, setCustomRoomNumber] = useState('');
  const [type, setType] = useState(COMPLAINT_TYPES[0]);
  const [remarks, setRemarks] = useState('');
  const [attachment, setAttachment] = useState(null); // { uri, name, type }

  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch departments on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoadingData(true);
        const resp = await departmentService.getAll();
        const data = Array.isArray(resp.data) ? resp.data : resp.data?.data || [];
        setDepartments(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load departments');
      } finally {
        setLoadingData(false);
      }
    };
    fetchDepartments();
  }, []);

  // 2. Fetch blocks when department changes
  useEffect(() => {
    const fetchBlocks = async () => {
      if (!departmentId) {
        setBlocks([]);
        setBlockId('');
        return;
      }
      try {
        setLoadingData(true);
        const resp = await blockService.getAll({ departmentId });
        const data = Array.isArray(resp.data) ? resp.data : resp.data?.data || [];
        setBlocks(data);
      } catch (err) {
        setError('Failed to load blocks for selected department');
      } finally {
        setLoadingData(false);
      }
    };

    fetchBlocks();
    setBlockId('');
    setRoomId('');
    setRooms([]);
  }, [departmentId]);

  // 3. Fetch rooms when block changes
  useEffect(() => {
    const fetchRooms = async () => {
      if (!blockId) {
        setRooms([]);
        setRoomId('');
        return;
      }
      try {
        setLoadingData(true);
        const resp = await roomService.getAll({ blockId });
        const data = Array.isArray(resp.data) ? resp.data : resp.data?.data || [];
        setRooms(data);
      } catch (err) {
        setError('Failed to load rooms for selected block');
      } finally {
        setLoadingData(false);
      }
    };

    fetchRooms();
    setRoomId('');
  }, [blockId]);

  // Permission check: only SuperAdmin and regular Users can raise complaints
  const canRaise = user && ['SuperAdmin', 'User'].includes(user.role);

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please allow gallery access to upload an image.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const filename = asset.fileName || asset.uri.split('/').pop() || 'photo.jpg';
        setAttachment({
          uri: asset.uri,
          name: filename,
          type: asset.mimeType || 'image/jpeg',
        });
      }
    } catch (err) {
      console.warn('Image pick error:', err);
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setAttachment({
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
        });
      }
    } catch (err) {
      console.warn('Doc pick error:', err);
    }
  };

  const handleSubmit = async () => {
    setError('');

    const selectedDepartment = departments.find((d) => d._id === departmentId);
    const selectedBlock = blocks.find((b) => b._id === blockId);
    const selectedRoom = rooms.find((r) => r._id === roomId);

    if (!selectedDepartment) {
      setError('Please select a department');
      return;
    }
    if (!selectedBlock) {
      setError('Please select a block');
      return;
    }

    const finalRoomNumber =
      roomId === '__manual__' || rooms.length === 0
        ? customRoomNumber.trim()
        : selectedRoom?.roomNumber || '';

    if (!finalRoomNumber) {
      setError('Please select a room or enter room number');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('departmentName', selectedDepartment.name);
      formData.append('blockName', selectedBlock.name);
      formData.append('roomNumber', finalRoomNumber);
      formData.append('complaintType', type);
      formData.append('remarks', remarks.trim());

      if (user?.id || user?._id) {
        formData.append('userId', user.id || user._id);
      }

      if (attachment) {
        formData.append('attachment', {
          uri: attachment.uri,
          name: attachment.name,
          type: attachment.type,
        });
      }

      await complaintService.create(formData);

      Alert.alert(
        'Success',
        'Complaint raised successfully!',
        [
          {
            text: 'View My Complaints',
            onPress: () => navigation.navigate(user?.role === 'SuperAdmin' ? 'AllComplaints' : 'MyComplaints'),
          },
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setDepartmentId('');
              setBlockId('');
              setRoomId('');
              setCustomRoomNumber('');
              setRemarks('');
              setAttachment(null);
            },
          },
        ]
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit complaint. Please check connection.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!canRaise) {
    return (
      <View style={styles.container}>
        <Header title="Raise Complaint" navigation={navigation} />
        <View style={styles.accessDeniedCard}>
          <Ionicons name="shield-outline" size={48} color={theme.colors.danger} />
          <Text style={styles.accessDeniedTitle}>Permission Restricted</Text>
          <Text style={styles.accessDeniedDesc}>
            Only regular Users and SuperAdmin can raise new complaints. Staff accounts manage and resolve assigned tasks.
          </Text>
        </View>
      </View>
    );
  }

  // Build picker options
  const deptOptions = departments.map((d) => ({ label: d.name, value: d._id }));
  const blockOptions = blocks.map((b) => ({ label: b.name, value: b._id }));
  const roomOptions = [
    ...rooms.map((r) => ({
      label: r.block?.name ? `${r.block.name} - ${r.roomNumber}` : `Room ${r.roomNumber}`,
      value: r._id,
    })),
    { label: 'Other (Enter room manually)', value: '__manual__' },
  ];
  const typeOptions = COMPLAINT_TYPES.map((t) => ({ label: t, value: t }));

  return (
    <View style={styles.container}>
      <Header
        title="Raise Complaint"
        subtitle="Submit a new issue or maintenance request"
        navigation={navigation}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={theme.colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.formCard}>
          <Text style={styles.formHeader}>Location Details</Text>

          {/* Department Picker */}
          <SelectPicker
            label="Department"
            value={departmentId}
            onValueChange={setDepartmentId}
            options={deptOptions}
            placeholder="-- Select Department --"
            required={true}
            disabled={loadingData}
          />

          {/* Block Picker */}
          <SelectPicker
            label="Block Name"
            value={blockId}
            onValueChange={setBlockId}
            options={blockOptions}
            placeholder={departmentId ? '-- Select Block --' : 'Select a department first'}
            required={true}
            disabled={!departmentId || loadingData}
          />

          {/* Room Picker */}
          <SelectPicker
            label="Room Number"
            value={roomId}
            onValueChange={setRoomId}
            options={roomOptions}
            placeholder={blockId ? '-- Select Room --' : 'Select a block first'}
            disabled={!blockId || loadingData}
          />

          {/* Custom Room Input if manual or no rooms */}
          {(roomId === '__manual__' || (blockId && rooms.length === 0)) && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Enter Room Number <Text style={{ color: theme.colors.danger }}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., R-101 or Lab 3"
                placeholderTextColor={theme.colors.textSubtle}
                value={customRoomNumber}
                onChangeText={setCustomRoomNumber}
              />
            </View>
          )}

          <Text style={[styles.formHeader, { marginTop: 16 }]}>Issue Details</Text>

          {/* Complaint Type */}
          <SelectPicker
            label="Complaint Type"
            value={type}
            onValueChange={setType}
            options={typeOptions}
            required={true}
          />

          {/* Remarks Textarea */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Remarks / Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Please describe the issue in detail..."
              placeholderTextColor={theme.colors.textSubtle}
              value={remarks}
              onChangeText={setRemarks}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Attachment Picker */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Attachment <Text style={styles.optionalText}>(Optional Photo / Document)</Text>
            </Text>

            {attachment ? (
              <View style={styles.attachmentPreview}>
                <Ionicons name="document-attach" size={24} color={theme.colors.primary} />
                <View style={styles.attachmentInfo}>
                  <Text style={styles.attachmentName} numberOfLines={1}>
                    {attachment.name}
                  </Text>
                  <Text style={styles.attachmentSize}>Ready for upload</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setAttachment(null)}
                  style={styles.removeAttachment}
                >
                  <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.pickerButtonsRow}>
                <TouchableOpacity
                  style={styles.uploadOptionBtn}
                  onPress={handlePickImage}
                  activeOpacity={0.7}
                >
                  <Ionicons name="image-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.uploadOptionText}>Choose Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.uploadOptionBtn}
                  onPress={handlePickDocument}
                  activeOpacity={0.7}
                >
                  <Ionicons name="document-text-outline" size={20} color={theme.colors.secondary} />
                  <Text style={styles.uploadOptionText}>Choose File/PDF</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting ? styles.submitButtonDisabled : null]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.submitButtonText}>Submitting Complaint...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>Submit Complaint</Text>
            )}
          </TouchableOpacity>
        </View>
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
    padding: theme.spacing.lg,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: theme.spacing.xl,
  },
  formHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
    paddingBottom: 8,
    marginBottom: 16,
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
  optionalText: {
    fontSize: 11,
    color: theme.colors.textSubtle,
    fontWeight: '400',
  },
  textInput: {
    backgroundColor: theme.colors.inputBg,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.radius.md,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.md,
    height: 48,
    fontSize: 15,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  pickerButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radius.md,
    height: 48,
  },
  uploadOptionText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.3)',
    borderRadius: theme.radius.md,
    padding: 12,
    gap: 12,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  attachmentSize: {
    color: theme.colors.primary,
    fontSize: 11,
    marginTop: 2,
  },
  removeAttachment: {
    padding: 6,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.dangerBg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    gap: 8,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  accessDeniedCard: {
    margin: theme.spacing.xl,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xxxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  accessDeniedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  accessDeniedDesc: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default RaiseComplaintScreen;
