import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../styles/theme';

export const SelectPicker = ({
  label,
  value,
  onValueChange,
  options = [], // [{ label: 'Option', value: '1' }]
  placeholder = '-- Select --',
  disabled = false,
  required = false,
  style,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  // Find selected label
  const selectedOption = options.find((opt) => String(opt.value) === String(value));
  const displayText = selectedOption ? selectedOption.label : placeholder;

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>
          {label} {required && <Text style={{ color: theme.colors.danger }}>*</Text>}
        </Text>
      )}

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => !disabled && setModalVisible(true)}
        style={[
          styles.selectorButton,
          disabled ? styles.disabledButton : null,
          !selectedOption ? styles.placeholderButton : null,
        ]}
      >
        <Text
          style={[
            styles.selectorText,
            !selectedOption ? styles.placeholderText : null,
            disabled ? styles.disabledText : null,
          ]}
          numberOfLines={1}
        >
          {displayText}
        </Text>
        <Ionicons
          name="chevron-down"
          size={18}
          color={disabled ? theme.colors.textSubtle : theme.colors.primary}
        />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <SafeAreaView style={styles.modalSheet}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{label || 'Select Option'}</Text>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={22} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {options.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No options available</Text>
                  </View>
                ) : (
                  <FlatList
                    data={options}
                    keyExtractor={(item, index) => `${item.value}-${index}`}
                    renderItem={({ item }) => {
                      const isSelected = String(item.value) === String(value);
                      return (
                        <TouchableOpacity
                          style={[
                            styles.optionItem,
                            isSelected ? styles.selectedOptionItem : null,
                          ]}
                          onPress={() => {
                            onValueChange(item.value);
                            setModalVisible(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              isSelected ? styles.selectedOptionText : null,
                            ]}
                          >
                            {item.label}
                          </Text>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                          )}
                        </TouchableOpacity>
                      );
                    }}
                  />
                )}
              </SafeAreaView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.inputBg,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    minHeight: 48,
  },
  selectorText: {
    fontSize: 15,
    color: theme.colors.text,
    flex: 1,
    marginRight: 8,
  },
  placeholderButton: {},
  placeholderText: {
    color: theme.colors.textSubtle,
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: '#f1f5f9',
  },
  disabledText: {
    color: theme.colors.textSubtle,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    borderTopWidth: 1,
    borderColor: theme.colors.cardBorder,
    maxHeight: '75%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  closeButton: {
    padding: 4,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  selectedOptionItem: {
    backgroundColor: '#e0f2fe',
  },
  optionText: {
    fontSize: 15,
    color: theme.colors.text,
    flex: 1,
  },
  selectedOptionText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: theme.spacing.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
});

export default SelectPicker;
