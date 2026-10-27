import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../styles/theme';

export const StatCard = ({ label, value, color, icon, active = false, onPress }) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.card,
        color ? { borderTopColor: color, borderTopWidth: 3.5 } : null,
        active ? styles.activeCard : null,
      ]}
    >
      {icon && (
        <View style={[styles.iconWrap, color ? { backgroundColor: `${color}18` } : null]}>
          <Ionicons name={icon} size={20} color={color || theme.colors.primary} />
        </View>
      )}
      <Text style={[styles.value, color ? { color } : null]}>{value !== undefined ? value : 0}</Text>
      <Text style={styles.label}>{label}</Text>
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: theme.spacing.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    backgroundColor: '#f1f5f9',
  },
  activeCard: {
    borderColor: theme.colors.primary,
    backgroundColor: '#e0f2fe',
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default StatCard;
