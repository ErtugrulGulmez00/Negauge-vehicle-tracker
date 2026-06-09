import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, StyleProp } from 'react-native';
import { useVehicles } from '../context/VehicleContext';
import { DARK_COLORS, LIGHT_COLORS } from '../theme/colors';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  bordered?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, style, onPress, bordered = true }) => {
  const { theme } = useVehicles();
  const currentColors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  const dynamicCardStyle = {
    backgroundColor: currentColors.cardBackground,
    borderColor: currentColors.cardBorder,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[
          styles.card,
          bordered && styles.bordered,
          dynamicCardStyle,
          style,
        ]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, bordered && styles.bordered, dynamicCardStyle, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  bordered: {
    borderWidth: 1,
  },
});
