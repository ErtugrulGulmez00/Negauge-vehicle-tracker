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
      case 'suv': // SUV / Crossover / Pickup
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

            {/* Roof Rails */}
            <Path d="M 68,10 L 128,10" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
            <Path d="M 78,10 L 78,13 M 118,10 L 118,13" stroke="#475569" strokeWidth="2" />

            {/* Main Body */}
            <Path
              d="M 12,54 
                 C 8,54 4,50 4,45 
                 C 4,41 10,38 18,36 
                 C 22,25 36,15 65,13 
                 L 132,13 
                 C 145,13 164,15 174,26 
                 L 184,33 
                 C 192,36 196,40 196,44 
                 C 196,49 191,54 186,54 
                 C 181,54 176,46 166,46 
                 C 156,46 151,54 146,54 
                 L 66,54 
                 C 61,54 56,46 46,46 
                 C 36,46 31,54 26,54 
                 Z"
              fill={`url(#${metalGradId})`}
              stroke="#0F172A"
              strokeWidth="2.5"
            />

            {/* Rear Wheel */}
            <Circle cx="46" cy="52" r="12" fill="#1E293B" stroke="#0F172A" strokeWidth="4" />
            <Circle cx="46" cy="52" r="5" fill="#64748B" />

            {/* Front Wheel */}
            <Circle cx="146" cy="52" r="12" fill="#1E293B" stroke="#0F172A" strokeWidth="4" />
            <Circle cx="146" cy="52" r="5" fill="#64748B" />

            {/* Windows */}
            <Path
              d="M 60,30 
                 L 124,30 
                 L 152,30 
                 C 147,22 139,16 128,16 
                 L 66,16 
                 Z"
              fill="#0F172A"
              opacity="0.8"
            />
            <Path d="M 68,18 C 83,16 100,16 115,18" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.25" />
            <Path d="M 108,16 L 108,30" stroke="#0F172A" strokeWidth="1.5" opacity="0.6" />
          </Svg>
        );
      case 'van': // Hafif Ticari
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

            {/* Main Body */}
            <Path
              d="M 15,55 
                 L 15,18 
                 C 15,14 18,12 24,12 
                 L 138,12 
                 C 148,12 165,16 172,25 
                 L 182,34 
                 C 188,38 190,42 190,46 
                 L 190,55 
                 C 190,55 183,47 173,47 
                 C 163,47 158,55 153,55 
                 L 67,55 
                 C 62,55 57,47 47,47 
                 C 37,47 32,55 27,55 
                 Z"
              fill={`url(#${metalGradId})`}
              stroke="#0F172A"
              strokeWidth="2.5"
            />

            {/* Rear Wheel */}
            <Circle cx="47" cy="53" r="11" fill="#1E293B" stroke="#0F172A" strokeWidth="4" />
            <Circle cx="47" cy="53" r="4.5" fill="#64748B" />

            {/* Front Wheel */}
            <Circle cx="153" cy="53" r="11" fill="#1E293B" stroke="#0F172A" strokeWidth="4" />
            <Circle cx="153" cy="53" r="4.5" fill="#64748B" />

            {/* Windows */}
            <Path d="M 112,16 L 142,16 L 158,26 L 158,34 L 112,34 Z" fill="#0F172A" opacity="0.85" />
            <Path d="M 68,16 L 105,16 L 105,34 L 68,34 Z" fill="#0F172A" opacity="0.85" />
            <Path d="M 22,16 L 62,16 L 62,34 L 22,34 Z" fill="#0F172A" opacity="0.85" />
          </Svg>
        );
      case 'truck': // Ağır Ticari (Tır)
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
            <Circle cx="100" cy="68" r="90" fill={`url(#${gradId})`} scaleY="0.12" />

            {/* Exhaust Pipe */}
            <Path d="M 60,48 L 60,6 M 62,48 L 62,8" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />

            {/* Main Body */}
            <Path
              d="M 15,58 
                 L 15,52 
                 L 52,52 
                 L 52,48 
                 L 65,48 
                 L 65,12 
                 C 65,10 68,8 72,8 
                 L 142,8 
                 C 148,8 152,10 155,14 
                 L 165,28 
                 L 175,34 
                 C 182,38 185,42 185,48 
                 L 185,58 
                 C 185,58 178,50 168,50 
                 C 158,50 153,58 148,58 
                 L 118,58 
                 C 113,58 108,50 98,50 
                 C 88,50 83,58 78,58 
                 L 65,58 
                 C 60,58 55,50 45,50 
                 C 35,50 30,58 25,58 
                 Z"
              fill={`url(#${metalGradId})`}
              stroke="#0F172A"
              strokeWidth="2.5"
            />

            {/* Rear Wheel 1 */}
            <Circle cx="45" cy="56" r="11" fill="#1E293B" stroke="#0F172A" strokeWidth="4" />
            <Circle cx="45" cy="56" r="4.5" fill="#64748B" />

            {/* Rear Wheel 2 */}
            <Circle cx="98" cy="56" r="11" fill="#1E293B" stroke="#0F172A" strokeWidth="4" />
            <Circle cx="98" cy="56" r="4.5" fill="#64748B" />

            {/* Front Wheel */}
            <Circle cx="148" cy="56" r="11" fill="#1E293B" stroke="#0F172A" strokeWidth="4" />
            <Circle cx="148" cy="56" r="4.5" fill="#64748B" />

            {/* Windows */}
            <Path d="M 112,12 L 140,12 L 152,24 L 152,32 L 112,32 Z" fill="#0F172A" opacity="0.85" />
            <Path d="M 78,14 L 98,14 L 98,22 L 78,22 Z" fill="#0F172A" opacity="0.85" />
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
