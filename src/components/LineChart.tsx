import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { DARK_COLORS, LIGHT_COLORS } from '../theme/colors';

interface DataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  unit: string;
  lineColor: string;
  theme: 'dark' | 'light';
}

export const LineChart: React.FC<LineChartProps> = ({ data, unit, lineColor, theme }) => {
  const colors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
  
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          {theme === 'dark' ? 'Yeterli yakıt/şarj verisi yok' : 'Not enough fuel/charge data'}
        </Text>
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width - 40; // Card width padding
  const chartHeight = 180;
  const paddingLeft = 35;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = screenWidth - paddingLeft - paddingRight;
  const chartEffectiveHeight = chartHeight - paddingTop - paddingBottom;

  // Find Min/Max values
  const values = data.map(d => d.value);
  let maxValue = Math.max(...values);
  let minValue = Math.min(...values);

  // Buffer min/max values
  if (maxValue === minValue) {
    maxValue += 1;
    minValue = Math.max(0, minValue - 1);
  } else {
    const range = maxValue - minValue;
    maxValue += range * 0.15;
    minValue = Math.max(0, minValue - range * 0.15);
  }

  // Calculate coordinates
  const points = data.map((d, index) => {
    const x = paddingLeft + (index / (data.length - 1 || 1)) * chartWidth;
    const y = paddingTop + chartEffectiveHeight - ((d.value - minValue) / (maxValue - minValue)) * chartEffectiveHeight;
    return { x, y, label: d.label, value: d.value };
  });

  // Construct line path (using Bezier curve for smoothness)
  let linePath = '';
  let areaPath = '';

  if (points.length > 0) {
    // Start point
    linePath = `M ${points[0].x} ${points[0].y}`;
    areaPath = `M ${points[0].x} ${paddingTop + chartEffectiveHeight} L ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      // Control points for smooth bezier curve
      const cpX1 = p0.x + (p1.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
      const cpY2 = p1.y;

      linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
      areaPath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }

    // Close the area path for fill gradient
    areaPath += ` L ${points[points.length - 1].x} ${paddingTop + chartEffectiveHeight} Z`;
  }

  // Generate grid values (3 horizontal lines)
  const gridLinesCount = 3;
  const gridValues = Array.from({ length: gridLinesCount }, (_, i) => {
    const val = maxValue - (i / (gridLinesCount - 1)) * (maxValue - minValue);
    const y = paddingTop + (i / (gridLinesCount - 1)) * chartEffectiveHeight;
    return { val, y };
  });

  return (
    <View style={styles.container}>
      <Svg width={screenWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={lineColor} stopOpacity="0.35" />
            <Stop offset="100%" stopColor={lineColor} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Horizontal Grid lines & Y Axis labels */}
        {gridValues.map((line, idx) => (
          <React.Fragment key={idx}>
            <Line
              x1={paddingLeft}
              y1={line.y}
              x2={screenWidth - paddingRight}
              y2={line.y}
              stroke={theme === 'dark' ? '#33415540' : '#E2E8F0'}
              strokeDasharray="4 4"
              strokeWidth="1"
            />
            <SvgText
              x={paddingLeft - 8}
              y={line.y + 4}
              fontSize="9"
              fontWeight="700"
              fill={colors.textMuted}
              textAnchor="end"
            >
              {line.val.toFixed(1)}
            </SvgText>
          </React.Fragment>
        ))}

        {/* Area fill */}
        {points.length > 1 && (
          <Path d={areaPath} fill="url(#areaGradient)" />
        )}

        {/* Stroke Line */}
        {points.length > 1 && (
          <Path
            d={linePath}
            fill="none"
            stroke={lineColor}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        )}

        {/* Data points & X Labels */}
        {points.map((pt, idx) => (
          <React.Fragment key={idx}>
            {/* Draw Dot */}
            <Circle
              cx={pt.x}
              cy={pt.y}
              r="4.5"
              fill={lineColor}
              stroke={theme === 'dark' ? '#0F172A' : '#FFFFFF'}
              strokeWidth="2.5"
            />
            
            {/* Value Label above dot */}
            <SvgText
              x={pt.x}
              y={pt.y - 10}
              fontSize="9"
              fontWeight="800"
              fill={colors.textPrimary}
              textAnchor="middle"
            >
              {pt.value.toFixed(1)}
            </SvgText>

            {/* X Label (Bottom) */}
            <SvgText
              x={pt.x}
              y={chartHeight - 8}
              fontSize="8"
              fontWeight="700"
              fill={colors.textMuted}
              textAnchor="middle"
            >
              {pt.label}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    alignItems: 'center',
    width: '100%',
  },
  emptyContainer: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
