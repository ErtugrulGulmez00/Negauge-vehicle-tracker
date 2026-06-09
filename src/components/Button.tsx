import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, StyleProp } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useVehicles } from '../context/VehicleContext';
import { DARK_COLORS, LIGHT_COLORS } from '../theme/colors';

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
  const { theme } = useVehicles();
  const currentColors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  const handlePress = () => {
    if (disabled || loading) return;
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress();
  };

  const dynamicStyles = {
    primary: {
      backgroundColor: currentColors.primary,
    },
    secondary: {
      backgroundColor: currentColors.cardBackground,
      borderColor: currentColors.cardBorder,
    },
    danger: {
      backgroundColor: currentColors.danger,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: currentColors.primary,
    },
    disabled: {
      backgroundColor: theme === 'dark' ? '#1E293B' : '#E2E8F0',
      borderColor: theme === 'dark' ? '#334155' : '#CBD5E1',
      opacity: 0.5,
    },
    textOutline: {
      color: currentColors.primary,
    },
    textDisabled: {
      color: currentColors.textMuted,
    },
  };

  const getButtonStyle = () => {
    const base: ViewStyle = styles.btn;
    if (disabled) return [base, dynamicStyles.disabled, style];
    
    switch (variant) {
      case 'primary':
        return [base, dynamicStyles.primary, style];
      case 'secondary':
        return [base, dynamicStyles.secondary, style];
      case 'danger':
        return [base, dynamicStyles.danger, style];
      case 'outline':
        return [base, dynamicStyles.outline, style];
      default:
        return [base, dynamicStyles.primary, style];
    }
  };

  const getTextStyle = () => {
    const base: TextStyle = styles.text;
    if (disabled) return [base, dynamicStyles.textDisabled, textStyle];
    
    switch (variant) {
      case 'outline':
        return [base, dynamicStyles.textOutline, textStyle];
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
        <ActivityIndicator color={variant === 'outline' ? currentColors.primary : '#000'} size="small" />
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
  text: {
    fontSize: 16,
    letterSpacing: 0.3,
    fontWeight: '700',
  },
  textSolid: {
    color: '#0F172A', // Dark text on primary/warning buttons
  },
});
