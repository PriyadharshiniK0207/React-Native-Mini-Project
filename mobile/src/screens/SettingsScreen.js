import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import {
  getBaseUrl,
  setCustomBaseUrl,
  resetBaseUrl,
  PRESET_URLS,
} from '../config/apiConfig';
import api from '../services/api';
import Header from '../components/Header';
import theme from '../styles/theme';

export const SettingsScreen = ({ navigation }) => {
  const { user, logout, refreshProfile } = useContext(AuthContext);

  const [currentUrl, setCurrentUrl] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [testing, setTesting] = useState(false);
  const [pingResult, setPingResult] = useState(null);

  useEffect(() => {
    loadUrl();
  }, []);

  const loadUrl = async () => {
    const url = await getBaseUrl();
    setCurrentUrl(url);
    setCustomInput(url);
  };

  const handleTestConnection = async (urlToTest) => {
    setTesting(true);
    setPingResult(null);
    try {
      const target = (urlToTest || customInput).trim().replace(/\/+$/, '');
      const healthUrl = `${target}/health`;
      const res = await api.get(healthUrl, { timeout: 4000, baseURL: '' });
      setPingResult({
        ok: true,
        message: `Success! Connected to server (${res.data?.message || 'OK'})`,
      });
    } catch (err) {
      setPingResult({
        ok: false,
        message: err.message.includes('timeout')
          ? 'Timed out connecting to server. Check IP & port.'
          : `Error: ${err.message}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!customInput.trim()) return;
    await setCustomBaseUrl(customInput.trim());
    await loadUrl();
    Alert.alert('Saved', 'API Base URL updated successfully.');
  };

  const handleReset = async () => {
    await resetBaseUrl();
    await loadUrl();
    setPingResult(null);
    Alert.alert('Reset', 'Restored platform default URL.');
  };

  return (
    <View style={styles.container}>
      <Header
        title="Settings & Profile"
        subtitle="User profile and server connectivity"
        navigation={navigation}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Profile Card */}
        <View style={styles.card}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{user?.username || 'User'}</Text>
              <Text style={styles.profileEmail}>{user?.email || '-'}</Text>
              <View style={styles.roleTag}>
                <Text style={styles.roleTagText}>{user?.role || 'User'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{user?.phone || 'Not provided'}</Text>
          </View>

          {user?.department?.name && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Department</Text>
              <Text style={styles.infoValue}>{user.department.name}</Text>
            </View>
          )}

          {user?.programme?.name && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Programme</Text>
              <Text style={styles.infoValue}>{user.programme.name}</Text>
            </View>
          )}
        </View>

        {/* Server Connection Settings Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Backend Server Configuration</Text>
          <Text style={styles.cardDesc}>
            Specify the Express API address for mobile communication:
          </Text>

          <Text style={styles.label}>Active API Base URL</Text>
          <TextInput
            style={styles.input}
            value={customInput}
            onChangeText={setCustomInput}
            placeholder="http://192.168.x.x:5000/api"
            placeholderTextColor={theme.colors.textSubtle}
            autoCapitalize="none"
          />

          <Text style={[styles.label, { marginTop: 14 }]}>Network Presets</Text>
          {PRESET_URLS.map((preset, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.presetPill}
              onPress={() => setCustomInput(preset.url)}
            >
              <Text style={styles.presetLabel}>{preset.label}</Text>
              <Text style={styles.presetUrl}>{preset.url}</Text>
            </TouchableOpacity>
          ))}

          {pingResult && (
            <View
              style={[
                styles.pingBanner,
                {
                  backgroundColor: pingResult.ok
                    ? theme.colors.successBg
                    : theme.colors.dangerBg,
                  borderColor: pingResult.ok
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'rgba(239, 68, 68, 0.3)',
                },
              ]}
            >
              <Ionicons
                name={pingResult.ok ? 'checkmark-circle' : 'alert-circle'}
                size={16}
                color={pingResult.ok ? theme.colors.success : theme.colors.danger}
              />
              <Text
                style={[
                  styles.pingBannerText,
                  { color: pingResult.ok ? theme.colors.success : theme.colors.danger },
                ]}
              >
                {pingResult.message}
              </Text>
            </View>
          )}

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.testBtn}
              onPress={() => handleTestConnection(customInput)}
              disabled={testing}
            >
              {testing ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Text style={styles.testBtnText}>Test Server</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetBtnText}>Restore Default URL</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutCardBtn} onPress={logout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={theme.colors.danger} />
          <Text style={styles.logoutCardText}>Log Out</Text>
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
    padding: theme.spacing.lg,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: theme.spacing.xl,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginBottom: 14,
    lineHeight: 18,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  profileEmail: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  roleTag: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  roleTagText: {
    color: theme.colors.secondary,
    fontSize: 11,
    fontWeight: '700',
  },
  infoDivider: {
    height: 1,
    backgroundColor: theme.colors.cardBorder,
    marginVertical: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: theme.colors.textSubtle,
  },
  infoValue: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '600',
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
  presetPill: {
    padding: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    marginTop: 6,
  },
  presetLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text,
  },
  presetUrl: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  pingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    marginTop: 12,
  },
  pingBannerText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  testBtn: {
    flex: 1,
    height: 44,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testBtnText: {
    color: theme.colors.primary,
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
  resetBtn: {
    alignItems: 'center',
    marginTop: 12,
  },
  resetBtnText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  logoutCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: theme.radius.md,
    height: 48,
  },
  logoutCardText: {
    color: theme.colors.danger,
    fontSize: 15,
    fontWeight: '700',
  },
});

export default SettingsScreen;
