import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Defs, RadialGradient, Stop, LinearGradient } from 'react-native-svg';

interface VehicleVisualProps {
  type: string; // 'car' | 'bicycle' | 'bus' | 'boat'
  color: string; // Hex color code
  width?: number;
  height?: number;
}

export const VehicleVisual: React.FC<VehicleVisualProps> = ({
  type,
  color,
  width = 180,
  height = 80,
}) => {
  // Generate gradient IDs unique to this instance to avoid SVG clashes
  const gradId = `glow-${type}-${color.replace('#', '')}`;
  const metalGradId = `metal-${type}-${color.replace('#', '')}`;

  const renderVisual = () => {
    switch (type) {
      case 'bicycle': // Motosiklet
        return (
          <Svg width={width} height={height} viewBox="0 0 200 100">
            <Defs>
              <RadialGradient id={gradId} cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor={color} stopOpacity="0.4" />
                <Stop offset="100%" stopColor={color} stopOpacity="0.0" />
              </RadialGradient>
              <LinearGradient id={metalGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
                <Stop offset="50%" stopColor={color} stopOpacity="1" />
                <Stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
              </LinearGradient>
            </Defs>

            {/* Neon Ground Glow */}
            <Circle cx="100" cy="85" r="75" fill={`url(#${gradId})`} scaleY="0.15" />

            {/* Rear Wheel */}
            <Circle cx="45" cy="60" r="22" fill="#1E293B" stroke="#0F172A" strokeWidth="4" />
            <Circle cx="45" cy="60" r="14" fill="transparent" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="4 2" />
            <Circle cx="45" cy="60" r="6" fill="#64748B" />

            {/* Front Wheel */}
            <Circle cx="155" cy="60" r="22" fill="#1E293B" stroke="#0F172A" strokeWidth="4" />
            <Circle cx="155" cy="60" r="14" fill="transparent" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="4 2" />
            <Circle cx="155" cy="60" r="6" fill="#64748B" />

            {/* Chain & Swingarm */}
            <Path d="M 45 60 L 95 60 L 90 52 L 45 60" fill="#475569" />

            {/* Fork & Handlebars */}
            <Path d="M 155 60 L 130 25 L 122 25 L 125 20 M 120 20 L 135 22" stroke="#64748B" strokeWidth="4" strokeLinecap="round" fill="none" />

            {/* Main Body Frame */}
            <Path
              d="M 55,60 
                 L 75,38 
                 C 80,32 95,26 110,26 
                 L 128,32 
                 L 138,46 
                 L 115,50 
                 L 90,62 
                 Z"
              fill={`url(#${metalGradId})`}
              stroke="#0F172A"
              strokeWidth="2.5"
            />

            {/* Engine block detail */}
            <Path d="M 85 62 L 115 50 L 110 65 L 88 68 Z" fill="#334155" stroke="#1E293B" strokeWidth="1.5" />
            
            {/* Seat */}
            <Path d="M 62 48 Q 72 38 88 40 L 82 50 Z" fill="#0F172A" />
            
            {/* Fuel Tank Outline Highlight */}
            <Path d="M 92 30 C 102 28 118 28 124 34" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4" />
          </Svg>
        );
      case 'bus': // Minibüs / Van
        return (
          <Svg width={width} height={height} viewBox="0 0 200 80">
            <Defs>
              <RadialGradient id={gradId} cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor={color} stopOpacity="0.4" />
                <Stop offset="100%" stopColor={color} stopOpacity="0.0" />
              </RadialGradient>
              <LinearGradient id={metalGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
                <Stop offset="50%" stopColor={color} stopOpacity="1" />
                <Stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
              </LinearGradient>
            </Defs>

            {/* Ground Glow */}
            <Circle cx="100" cy="67" r="80" fill={`url(#${gradId})`} scaleY="0.12" />

            {/* Main Body */}
            <Path
              d="M 15,60 
                 L 15,22 
                 C 15,16 22,12 28,12 
                 L 172,12 
                 C 178,12 185,18 185,26 
                 L 185,60 
                 C 185,60 178,52 168,52 
                 C 158,52 153,60 148,60 
                 L 68,60 
                 C 63,60 58,52 48,52 
                 C 38,52 33,60 28,60 
                 Z"
              fill={`url(#${metalGradId})`}
              stroke="#0F172A"
              strokeWidth="2.5"
            />

            {/* Rear Wheel */}
            <Circle cx="48" cy="58" r="12" fill="#1E293B" stroke="#0F172A" strokeWidth="4" />
            <Circle cx="48" cy="58" r="4" fill="#64748B" />

            {/* Front Wheel */}
            <Circle cx="158" cy="58" r="12" fill="#1E293B" stroke="#0F172A" strokeWidth="4" />
            <Circle cx="158" cy="58" r="4" fill="#64748B" />

            {/* Windows */}
            <Path d="M 22,18 L 85,18 L 85,32 L 22,32 Z M 92,18 L 140,18 L 140,32 L 92,32 Z M 147,18 L 178,18 L 175,32 L 147,32 Z" fill="#0F172A" opacity="0.85" />
            
            {/* Front Windshield glare */}
            <Path d="M 150 20 L 175 20 L 173 26 L 150 26 Z" fill="#FFFFFF" opacity="0.15" />
          </Svg>
        );
      case 'boat': // Tekne
        return (
          <Svg width={width} height={height} viewBox="0 0 200 80">
            <Defs>
              <RadialGradient id={gradId} cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor={color} stopOpacity="0.4" />
                <Stop offset="100%" stopColor={color} stopOpacity="0.0" />
              </RadialGradient>
              <LinearGradient id={metalGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
                <Stop offset="50%" stopColor={color} stopOpacity="1" />
                <Stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
              </LinearGradient>
            </Defs>

            {/* Water Glow */}
            <Circle cx="100" cy="58" r="85" fill={`url(#${gradId})`} scaleY="0.15" />

            {/* Cabin */}
            <Path d="M 60,35 L 72,16 L 132,16 L 142,35 Z" fill="#E2E8F0" stroke="#0F172A" strokeWidth="2" />
            <Path d="M 78,20 L 105,20 L 102,30 L 80,30 Z M 110,20 L 128,20 L 126,30 L 108,30 Z" fill="#0F172A" />

            {/* Hull */}
            <Path
              d="M 12,35 
                 L 188,35 
                 C 188,35 178,58 145,62 
                 L 45,62 
                 C 25,58 12,35 12,35 
                 Z"
              fill={`url(#${metalGradId})`}
              stroke="#0F172A"
              strokeWidth="2.5"
            />

            {/* Metallic line on hull */}
            <Path d="M 22,42 L 172,42" stroke="#FFFFFF" strokeWidth="2" opacity="0.3" />
          </Svg>
        );
      case 'car': // Otomobil (Default)
      default:
        return (
          <Svg width={width} height={height} viewBox="0 0 200 80">
            <Defs>
              <RadialGradient id={gradId} cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor={color} stopOpacity="0.4" />
                <Stop offset="100%" stopColor={color} stopOpacity="0.0" />
              </RadialGradient>
              <LinearGradient id={metalGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
                <Stop offset="50%" stopColor={color} stopOpacity="1" />
                <Stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
              </LinearGradient>
            </Defs>

            {/* Ground Glow */}
            <Circle cx="100" cy="65" r="85" fill={`url(#${gradId})`} scaleY="0.12" />

            {/* Main Body Silhouette */}
            <Path
              d="M 15,55 
                 C 10,55 6,51 6,46 
                 C 6,43 12,40 18,38 
                 C 24,30 45,15 76,10 
                 C 101,6 131,6 146,14 
                 C 161,23 176,33 186,38 
                 C 193,40 196,42 196,46 
                 C 196,51 191,55 186,55 
                 C 181,55 176,48 166,48 
                 C 156,48 151,55 146,55 
                 L 66,55 
                 C 61,55 56,48 46,48 
                 C 36,48 31,55 26,55 
                 Z"
              fill={`url(#${metalGradId})`}
              stroke="#0F172A"
              strokeWidth="2.5"
            />

            {/* Rear Wheel */}
            <Circle cx="46" cy="53" r="11" fill="#1E293B" stroke="#0F172A" strokeWidth="4" />
            <Circle cx="46" cy="53" r="4.5" fill="#64748B" />

            {/* Front Wheel */}
            <Circle cx="146" cy="53" r="11" fill="#1E293B" stroke="#0F172A" strokeWidth="4" />
            <Circle cx="146" cy="53" r="4.5" fill="#64748B" />

            {/* Windows (Glass Cabin) */}
            <Path
              d="M 68,30 
                 C 68,30 83,16 103,13 
                 C 118,11 138,13 143,20 
                 C 148,25 151,30 151,30 
                 Z"
              fill="#0F172A"
              opacity="0.8"
            />

            {/* Window Highlight/Glare */}
            <Path d="M 75,26 C 90,17 110,15 125,17" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.25" />
            
            {/* Door seam line */}
            <Path d="M 106,14 L 106,47" stroke="#0F172A" strokeWidth="1.5" opacity="0.6" />
          </Svg>
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderVisual()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
});
