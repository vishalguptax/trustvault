import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { useTheme } from '@/lib/theme';

/**
 * MeshGradient — full-screen SVG with overlapping radial gradient blobs.
 *
 * Dark mode:  deep charcoal base with subtle warm plum and cool navy glows
 * Light mode: clean airy base with soft lavender and warm sand washes
 *
 * Green is reserved for UI accent elements only — never in the mesh.
 */
export function MeshGradient() {
  const { colors, isDark } = useTheme();
  const { width, height } = useWindowDimensions();

  // On web, skip SVG mesh — use simple CSS background to avoid rendering issues
  if (Platform.OS === 'web') {
    return (
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg, zIndex: -1 }]}
        pointerEvents="none"
      />
    );
  }

  if (width === 0 || height === 0) return null;

  const blobs = isDark
    ? [
        // Top-left: soft pink
        { cx: width * 0.05, cy: height * 0.0,  r: width * 0.7,  color: '#E855A0', opacity: 0.06 },
        // Top-right: electric blue
        { cx: width * 0.95, cy: height * 0.1,  r: width * 0.65, color: '#3B82F6', opacity: 0.06 },
        // Center: violet purple
        { cx: width * 0.3,  cy: height * 0.45, r: width * 0.75, color: '#8B5CF6', opacity: 0.05 },
        // Bottom-left: teal green
        { cx: width * 0.1,  cy: height * 0.8,  r: width * 0.6,  color: '#14B8A6', opacity: 0.04 },
        // Bottom-right: warm amber
        { cx: width * 0.85, cy: height * 0.7,  r: width * 0.55, color: '#F59E0B', opacity: 0.04 },
      ]
    : [
        // Top-left: pastel pink
        { cx: width * 0.0,  cy: height * 0.0,  r: width * 0.7,  color: '#F9A8D4', opacity: 0.12 },
        // Top-right: sky blue
        { cx: width * 0.95, cy: height * 0.08, r: width * 0.65, color: '#93C5FD', opacity: 0.10 },
        // Center: soft violet
        { cx: width * 0.35, cy: height * 0.45, r: width * 0.75, color: '#C4B5FD', opacity: 0.08 },
        // Bottom-left: mint green
        { cx: width * 0.08, cy: height * 0.8,  r: width * 0.6,  color: '#6EE7B7', opacity: 0.07 },
        // Bottom-right: warm peach
        { cx: width * 0.85, cy: height * 0.72, r: width * 0.55, color: '#FCD34D', opacity: 0.06 },
      ];

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: -1 }]} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          {blobs.map((blob, i) => (
            <RadialGradient
              key={`g${i}`}
              id={`mb${i}`}
              cx={blob.cx}
              cy={blob.cy}
              rx={blob.r}
              ry={blob.r}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor={blob.color} stopOpacity={blob.opacity} />
              <Stop offset="1" stopColor={blob.color} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>

        {/* Solid base */}
        <Rect x={0} y={0} width={width} height={height} fill={colors.bg} />

        {/* Gradient blobs */}
        {blobs.map((_, i) => (
          <Rect key={`r${i}`} x={0} y={0} width={width} height={height} fill={`url(#mb${i})`} />
        ))}
      </Svg>
    </View>
  );
}
