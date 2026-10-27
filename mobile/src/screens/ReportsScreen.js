import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import {
  complaintService,
  departmentService,
  programmeService,
  userService,
} from '../services/api';
import Header from '../components/Header';
import Badge from '../components/Badge';
import SelectPicker from '../components/SelectPicker';
import theme from '../styles/theme';

export const ReportsScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);

  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [users, setUsers] = useState([]);

  const [filters, setFilters] = useState({
    department: '',
    programme: '',
    complaintType: '',
    status: '',
    assignee: '',
  });

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (user?.role !== 'SuperAdmin') return;
    Promise.all([
      departmentService.getAll().catch(() => ({ data: [] })),
      programmeService.getAll().catch(() => ({ data: [] })),
      userService.getAll().catch(() => ({ data: [] })),
    ]).then(([dRes, pRes, uRes]) => {
      setDepartments(dRes.data || []);
      setProgrammes(pRes.data || []);
      setUsers(uRes.data || []);
    });
  }, [user]);

  const handleFetchReport = async () => {
    setError('');
    setLoading(true);
    setHasSearched(true);
    try {
      const params = { ...filters };
      Object.keys(params).forEach((k) => {
        if (!params[k]) delete params[k];
      });
      const res = await complaintService.report(params);
      setResults(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!results.length) {
      Alert.alert('No Data', 'Generate a report with results first to export.');
      return;
    }

    const headers = [
      'Date',
      'Block',
      'Room',
      'Type',
      'Remarks',
      'Status',
      'CreatedBy',
      'Assignee',
    ];

    const rows = results.map((r) => [
      new Date(r.createdAt).toLocaleString(),
      r.blockName,
      r.roomNumber,
      r.complaintType,
      (r.remarks || '').replace(/[\n\r]+/g, ' '),
      r.status,
      r.createdBy?.username || r.createdBy?.email || '',
      r.assignedTo?.username || r.assignedTo?.email || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${('' + cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    try {
      await Share.share({
        title: 'TMS Complaints Report.csv',
        message: csvContent,
      });
    } catch (err) {
      Alert.alert('Share Failed', err.message);
    }
  };

  if (user?.role !== 'SuperAdmin') {
    return (
      <View style={styles.container}>
        <Header title="Reports" navigation={navigation} />
        <View style={styles.accessDeniedCard}>
          <Ionicons name="lock-closed-outline" size={48} color={theme.colors.danger} />
          <Text style={styles.accessDeniedTitle}>SuperAdmin Only</Text>
          <Text style={styles.accessDeniedDesc}>
            Only administrators with SuperAdmin permissions can access and export report data.
          </Text>
        </View>
      </View>
    );
  }

  const deptOptions = [
    { label: 'All Departments', value: '' },
    ...departments.map((d) => ({ label: d.name, value: d._id })),
  ];
  const progOptions = [
    { label: 'All Programmes', value: '' },
    ...programmes.map((p) => ({ label: p.name, value: p._id })),
  ];
  const statusOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Assigned', value: 'Assigned' },
    { label: 'In-Progress', value: 'In-Progress' },
    { label: 'Onhold', value: 'Onhold' },
    { label: 'Closed', value: 'Closed' },
  ];
  const userOptions = [
    { label: 'Any Assignee', value: '' },
    ...users
      .filter((u) => u.role && u.role.toLowerCase() !== 'superadmin' && u.role.toLowerCase() !== 'user')
      .map((u) => ({ label: `${u.username} (${u.role})`, value: u._id })),
  ];

  return (
    <View style={styles.container}>
      <Header
        title="Reports"
        subtitle="Generate & export customized complaint reports"
        navigation={navigation}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={theme.colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Filter Card */}
        <View style={styles.filterCard}>
          <Text style={styles.filterCardTitle}>Report Filters</Text>

          <SelectPicker
            label="Department"
            value={filters.department}
            onValueChange={(val) => setFilters({ ...filters, department: val })}
            options={deptOptions}
            placeholder="All Departments"
          />

          <SelectPicker
            label="Programme"
            value={filters.programme}
            onValueChange={(val) => setFilters({ ...filters, programme: val })}
            options={progOptions}
            placeholder="All Programmes"
          />

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Complaint Type</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Electrical, Network, Plumbing"
              placeholderTextColor={theme.colors.textSubtle}
              value={filters.complaintType}
              onChangeText={(val) => setFilters({ ...filters, complaintType: val })}
            />
          </View>

          <SelectPicker
            label="Status"
            value={filters.status}
            onValueChange={(val) => setFilters({ ...filters, status: val })}
            options={statusOptions}
            placeholder="All Statuses"
          />

          <SelectPicker
            label="Assignee"
            value={filters.assignee}
            onValueChange={(val) => setFilters({ ...filters, assignee: val })}
            options={userOptions}
            placeholder="Any Assignee"
          />

          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[styles.generateButton, loading ? styles.disabledBtn : null]}
              onPress={handleFetchReport}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="search" size={18} color="#ffffff" />
                  <Text style={styles.generateButtonText}>Generate Report</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.exportButton,
                !results.length || loading ? styles.disabledExportBtn : null,
              ]}
              onPress={handleExportCSV}
              disabled={!results.length || loading}
              activeOpacity={0.8}
            >
              <Ionicons
                name="share-outline"
                size={18}
                color={!results.length ? theme.colors.textSubtle : theme.colors.primary}
              />
              <Text
                style={[
                  styles.exportButtonText,
                  !results.length ? { color: theme.colors.textSubtle } : null,
                ]}
              >
                Export CSV
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Results Section */}
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>
            Results ({results.length} {results.length === 1 ? 'record' : 'records'})
          </Text>

          {hasSearched && results.length === 0 && !loading && (
            <View style={styles.emptyResults}>
              <Ionicons name="search-outline" size={36} color={theme.colors.textSubtle} />
              <Text style={styles.emptyResultsText}>
                No complaints found matching criteria. Adjust filters and try again.
              </Text>
            </View>
          )}

          {results.map((r) => (
            <View key={r._id} style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultLocation}>
                  {r.blockName} • Room {r.roomNumber}
                </Text>
                <Badge label={r.status} />
              </View>

              <Text style={styles.resultType}>{r.complaintType}</Text>
              {r.remarks ? (
                <Text style={styles.resultRemarks} numberOfLines={2}>
                  {r.remarks}
                </Text>
              ) : null}

              <View style={styles.resultFooter}>
                <Text style={styles.resultMeta}>
                  By: {r.createdBy?.username || r.createdBy?.email || '-'}
                </Text>
                <Text style={styles.resultMeta}>
                  To: {r.assignedTo?.username || r.assignedTo?.email || 'Unassigned'}
                </Text>
                <Text style={styles.resultMeta}>
                  {new Date(r.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
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
  filterCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  filterCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
    paddingBottom: 8,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: 6,
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
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  generateButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    height: 48,
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    height: 48,
  },
  exportButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  disabledExportBtn: {
    borderColor: theme.colors.cardBorder,
    backgroundColor: '#f1f5f9',
  },
  resultsSection: {
    gap: 12,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  resultCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: theme.spacing.lg,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  resultLocation: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  resultType: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  resultRemarks: {
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 18,
    marginBottom: 8,
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
    paddingTop: 8,
  },
  resultMeta: {
    fontSize: 11,
    color: theme.colors.textSubtle,
  },
  emptyResults: {
    padding: theme.spacing.xxxl,
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  emptyResultsText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
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

export default ReportsScreen;
