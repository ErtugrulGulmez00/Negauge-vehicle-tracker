import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, StyleProp } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS } from '../theme/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  hapticFeedback?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  hapticFeedback = true,
}) => {
  const handlePress = () => {
    if (disabled || loading) return;
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress();
  };

  const getButtonStyle = () => {
    const base: ViewStyle = styles.btn;
    if (disabled) return [base, styles.disabled, style];
    
    switch (variant) {
      case 'primary':
        return [base, styles.primary, style];
      case 'secondary':
        return [base, styles.secondary, style];
      case 'danger':
        return [base, styles.danger, style];
      case 'outline':
        return [base, styles.outline, style];
      default:
        return [base, styles.primary, style];
    }
  };

  const getTextStyle = () => {
    const base: TextStyle = styles.text;
    if (disabled) return [base, styles.textDisabled, textStyle];
    
    switch (variant) {
      case 'outline':
        return [base, styles.textOutline, textStyle];
      default:
        return [base, styles.textSolid, textStyle];
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      disabled={disabled || loading}
      style={getButtonStyle()}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? COLORS.primary : '#000'} size="small" />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.cardBorder,
  },
  danger: {
    backgroundColor: COLORS.danger,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: COLORS.primary,
  },
  disabled: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    opacity: 0.5,
  },
  text: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    letterSpacing: 0.3,
  },
  textSolid: {
    color: '#0F172A', // Dark text on primary/warning buttons
  },
  textOutline: {
    color: COLORS.primary,
  },
  textDisabled: {
    color: COLORS.textMuted,
  },
});
