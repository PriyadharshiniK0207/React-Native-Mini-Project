export const theme = {
  colors: {
    background: '#f8fafc',
    card: '#ffffff',
    cardBorder: '#e2e8f0',
    cardLight: '#f1f5f9',
    text: '#0f172a',
    textMuted: '#475569',
    textSubtle: '#94a3b8',
    primary: '#0284c7', // Accessible vibrant ocean blue
    primaryDark: '#0369a1',
    primaryLight: '#e0f2fe',
    secondary: '#7c3aed', // Clean violet
    accentLilac: '#8b5cf6',
    inputBg: '#ffffff',
    inputBorder: '#cbd5e1',
    danger: '#dc2626',
    dangerBg: '#fee2e2',
    success: '#16a34a',
    successBg: '#dcfce7',
    warning: '#d97706',
    warningBg: '#fef3c7',
    info: '#0284c7',
    infoBg: '#e0f2fe',
    purple: '#9333ea',
    purpleBg: '#f3e8ff',
    status: {
      pending: '#d97706',
      pendingBg: '#fef3c7',
      assigned: '#0284c7',
      assignedBg: '#e0f2fe',
      'in-progress': '#9333ea',
      inProgressBg: '#f3e8ff',
      onhold: '#ea580c',
      onholdBg: '#ffedd5',
      closed: '#16a34a',
      closedBg: '#dcfce7',
    },
  },
  typography: {
    fontFamily: undefined, // System default font (San Francisco on iOS, Roboto on Android)
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  radius: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    pill: 9999,
  },
};

export default theme;
