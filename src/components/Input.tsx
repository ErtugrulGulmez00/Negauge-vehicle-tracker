import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { COLORS, FONTS } from '../theme/colors';

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

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputFocused,
          error && styles.inputError,
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          keyboardType={keyboardType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          maxLength={maxLength}
          style={[styles.input, inputStyle]}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  inputWrapper: {
    height: 52,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  inputFocused: {
    borderColor: COLORS.primary,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  input: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.textPrimary,
    padding: 0, // Reset default Android paddings
  },
  errorText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 4,
  },
});
