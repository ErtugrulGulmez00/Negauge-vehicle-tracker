import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { G, Circle } from 'react-native-svg';
import { DARK_COLORS, LIGHT_COLORS } from '../theme/colors';

interface DataItem {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

interface DonutChartProps {
  data: DataItem[];
  totalAmount: number;
  currencySymbol: string;
  theme: 'dark' | 'light';
}

export const DonutChart: React.FC<DonutChartProps> = ({ data, totalAmount, currencySymbol, theme }) => {
  const colors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
  
  const size = 160;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  let accumulatedPercent = 0;

  return (
    <View style={styles.container}>
      <View style={styles.chartWrapper}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
            {/* Background circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={theme === 'dark' ? '#334155' : '#E2E8F0'}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Segments */}
            {data.map((item, index) => {
              if (item.amount === 0) return null;
              
              const strokeLength = (item.percentage / 100) * circumference;
              const strokeOffset = circumference - strokeLength - (accumulatedPercent / 100) * circumference;
              
              accumulatedPercent += item.percentage;
              
              return (
                <Circle
                  key={index}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${strokeLength} ${circumference}`}
                  strokeDashoffset={strokeOffset}
                  fill="transparent"
                  strokeLinecap="round"
                />
              );
            })}
          </G>
        </Svg>
        
        {/* Center Text */}
        <View style={styles.centerTextContainer}>
          <Text style={[styles.centerLabel, { color: colors.textSecondary }]}>
            Total
          </Text>
          <Text style={[styles.centerValue, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
            {currencySymbol}{totalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 15,
  },
  chartWrapper: {
    position: 'relative',
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 110,
    height: 110,
  },
  centerLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  centerValue: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
});
