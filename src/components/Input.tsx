import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { useVehicles } from '../context/VehicleContext';
import { DARK_COLORS, LIGHT_COLORS } from '../theme/colors';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  error?: string;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  maxLength?: number;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  error,
  style,
  inputStyle,
  maxLength,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const { theme } = useVehicles();
  const currentColors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  const dynamicStyles = {
    label: {
      color: currentColors.textSecondary,
    },
    inputWrapper: {
      backgroundColor: theme === 'dark' ? '#0F172A' : '#F1F5F9',
      borderColor: currentColors.cardBorder,
    },
    inputFocused: {
      borderColor: currentColors.primary,
    },
    inputError: {
      borderColor: currentColors.danger,
    },
    input: {
      color: currentColors.textPrimary,
    },
    errorText: {
      color: currentColors.danger,
    },
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, dynamicStyles.label]}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          dynamicStyles.inputWrapper,
          isFocused && styles.inputFocused,
          isFocused && dynamicStyles.inputFocused,
          error && styles.inputError,
          error && dynamicStyles.inputError,
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={currentColors.textMuted}
          keyboardType={keyboardType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          maxLength={maxLength}
          style={[styles.input, dynamicStyles.input, inputStyle]}
        />
      </View>
      {error && <Text style={[styles.errorText, dynamicStyles.errorText]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    letterSpacing: 0.2,
    fontWeight: '600',
  },
  inputWrapper: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  inputFocused: {},
  inputError: {},
  input: {
    fontSize: 16,
    padding: 0, // Reset default Android paddings
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
});
