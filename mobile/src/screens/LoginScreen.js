import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  Modal,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import {
  getBaseUrl,
  setCustomBaseUrl,
  resetBaseUrl,
  getDefaultBaseUrl,
  PRESET_URLS,
} from '../config/apiConfig';
import api from '../services/api';
import theme from '../styles/theme';

export const LoginScreen = () => {
  const insets = useSafeAreaInsets();
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0;
  const safeTop = Math.max(insets.top, statusBarHeight) + theme.spacing.sm;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  // Server Settings Modal State
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [pingStatus, setPingStatus] = useState(null);
  const [pingLoading, setPingLoading] = useState(false);

  useEffect(() => {
    loadCurrentUrl();
  }, []);

  const loadCurrentUrl = async () => {
    const url = await getBaseUrl();
    setCurrentUrl(url);
    setCustomUrlInput(url);
  };

  const handleTestConnection = async (urlToTest) => {
    setPingLoading(true);
    setPingStatus(null);
    try {
      const cleanUrl = (urlToTest || customUrlInput).trim().replace(/\/+$/, '');
      const healthUrl = `${cleanUrl}/health`;
      const res = await api.get(healthUrl, { timeout: 4000, baseURL: '' });
      if (res.data?.message) {
        setPingStatus({ ok: true, message: `Connected! (${res.data.message})` });
      } else {
        setPingStatus({ ok: true, message: 'Server reached successfully!' });
      }
    } catch (err) {
      setPingStatus({
        ok: false,
        message: err.message.includes('timeout')
          ? 'Timeout: Could not reach server'
          : `Connection failed: ${err.message}`,
      });
    } finally {
      setPingLoading(false);
    }
  };

  const handleSaveUrl = async () => {
    if (!customUrlInput.trim()) return;
    await setCustomBaseUrl(customUrlInput.trim());
    await loadCurrentUrl();
    setSettingsVisible(false);
    Alert.alert('Settings Saved', `Backend URL set to: ${customUrlInput.trim()}`);
  };

  const handleResetUrl = async () => {
    await resetBaseUrl();
    await loadCurrentUrl();
    setPingStatus(null);
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setError('Please enter both email and password');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login(email.trim(), password);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK'
          ? 'Cannot connect to backend. Check your server URL in settings (gear icon).'
          : 'Login failed. Please try again.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardContainer}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Bar with Server Config */}
          <View style={[styles.topBar, { paddingTop: safeTop }]}>
            <TouchableOpacity
              style={styles.serverPill}
              onPress={() => {
                setSettingsVisible(true);
                setPingStatus(null);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.serverIndicator} />
              <Text style={styles.serverPillText} numberOfLines={1}>
                Backend: {currentUrl.replace(/^http:\/\//, '')}
              </Text>
              <Ionicons name="settings-outline" size={14} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Logo / Header */}
            <View style={styles.logoContainer}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoBadgeText}>TMS</Text>
              </View>
              <Text style={styles.title}>Welcome to TMS</Text>
              <Text style={styles.subtitle}>Ticket & Complaint Management System</Text>
            </View>

            {/* Error Banner */}
            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={theme.colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Form Card */}
            <View style={styles.card}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={theme.colors.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor={theme.colors.textSubtle}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (error) setError('');
                    }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={theme.colors.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor={theme.colors.textSubtle}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (error) setError('');
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={theme.colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.loginButton, loading ? styles.loginButtonDisabled : null]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={styles.loginButtonText}>Logging in...</Text>
                  </View>
                ) : (
                  <Text style={styles.loginButtonText}>Login</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

        {/* Server Settings Modal */}
        <Modal
          visible={settingsVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSettingsVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Backend Server Settings</Text>
                <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                  <Ionicons name="close" size={22} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalDescription}>
                Configure the API URL to connect to the Node.js/Express backend running on port 5000:
              </Text>

              <Text style={styles.label}>Custom API Base URL</Text>
              <TextInput
                style={styles.modalInput}
                value={customUrlInput}
                onChangeText={setCustomUrlInput}
                placeholder="http://192.168.x.x:5000/api"
                placeholderTextColor={theme.colors.textSubtle}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={[styles.label, { marginTop: 12 }]}>Quick Presets</Text>
              {PRESET_URLS.map((preset, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.presetButton}
                  onPress={() => setCustomUrlInput(preset.url)}
                >
                  <Text style={styles.presetLabel}>{preset.label}</Text>
                  <Text style={styles.presetUrl}>{preset.url}</Text>
                </TouchableOpacity>
              ))}

              {/* Ping Test Result */}
              {pingStatus ? (
                <View
                  style={[
                    styles.pingResult,
                    {
                      backgroundColor: pingStatus.ok
                        ? theme.colors.successBg
                        : theme.colors.dangerBg,
                      borderColor: pingStatus.ok
                        ? 'rgba(16, 185, 129, 0.3)'
                        : 'rgba(239, 68, 68, 0.3)',
                    },
                  ]}
                >
                  <Ionicons
                    name={pingStatus.ok ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={pingStatus.ok ? theme.colors.success : theme.colors.danger}
                  />
                  <Text
                    style={[
                      styles.pingText,
                      { color: pingStatus.ok ? theme.colors.success : theme.colors.danger },
                    ]}
                  >
                    {pingStatus.message}
                  </Text>
                </View>
              ) : null}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.testButton}
                  onPress={() => handleTestConnection(customUrlInput)}
                  disabled={pingLoading}
                >
                  {pingLoading ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  ) : (
                    <Text style={styles.testButtonText}>Test Connection</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveButton} onPress={handleSaveUrl}>
                  <Text style={styles.saveButtonText}>Save URL</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.resetButton} onPress={handleResetUrl}>
                <Text style={styles.resetButtonText}>Reset to Platform Default</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  topBar: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  serverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    maxWidth: '90%',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  serverIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.success,
    marginRight: 8,
  },
  serverPillText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginRight: 6,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  content: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#e0f2fe',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoBadgeText: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
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
    marginBottom: theme.spacing.lg,
    gap: 8,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: theme.spacing.xl,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  formGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBg,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    color: theme.colors.text,
    fontSize: 15,
  },
  eyeButton: {
    padding: 6,
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
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
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  modalDescription: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginBottom: 16,
    lineHeight: 18,
  },
  modalInput: {
    backgroundColor: theme.colors.inputBg,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.radius.md,
    color: theme.colors.text,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
  },
  presetButton: {
    padding: 10,
    backgroundColor: '#f8fafc',
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
  pingResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    marginTop: 12,
  },
  pingText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  testButton: {
    flex: 1,
    height: 44,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  resetButton: {
    alignItems: 'center',
    marginTop: 12,
    padding: 6,
  },
  resetButtonText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
