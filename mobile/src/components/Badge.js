import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../styles/theme';

export const Badge = ({ label, type = 'default', style }) => {
  const norm = (label || '').toLowerCase().replace(/\s+/g, '-');

  let bg = '#f1f5f9';
  let color = theme.colors.textMuted;
  let borderColor = '#cbd5e1';

  if (norm === 'pending') {
    bg = theme.colors.status.pendingBg;
    color = theme.colors.status.pending;
    borderColor = 'rgba(217, 119, 6, 0.3)';
  } else if (norm === 'assigned') {
    bg = theme.colors.status.assignedBg;
    color = theme.colors.status.assigned;
    borderColor = 'rgba(2, 132, 199, 0.3)';
  } else if (norm === 'in-progress') {
    bg = theme.colors.status.inProgressBg;
    color = theme.colors.status['in-progress'];
    borderColor = 'rgba(147, 51, 234, 0.3)';
  } else if (norm === 'onhold') {
    bg = theme.colors.status.onholdBg;
    color = theme.colors.status.onhold;
    borderColor = 'rgba(234, 88, 12, 0.3)';
  } else if (norm === 'closed') {
    bg = theme.colors.status.closedBg;
    color = theme.colors.status.closed;
    borderColor = 'rgba(22, 163, 74, 0.3)';
  } else if (norm === 'superadmin') {
    bg = '#f3e8ff';
    color = theme.colors.secondary;
    borderColor = '#d8b4fe';
  } else if (type === 'role') {
    bg = '#e0f2fe';
    color = theme.colors.primary;
    borderColor = '#bae6fd';
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor }, style]}>
      <Text style={[styles.text, { color }]}>{label || '-'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default Badge;
