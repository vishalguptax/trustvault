import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { useTheme } from '@/lib/theme';

/**
 * MeshGradient — full-screen SVG with overlapping radial gradient blobs
 * that simulate a mesh gradient background. Theme-aware for light/dark.
 *
 * Place as first child inside a container with flex: 1.
 * Uses StyleSheet.absoluteFill + pointerEvents="none" so it sits behind content.
 */
export function MeshGradient() {
  const { colors, isDark } = useTheme();
  const { width, height } = useWindowDimensions();

  // Use pixel values for blob positions (userSpaceOnUse needs absolute coords)
  const blobs = isDark
    ? [
        { cx: width * 0.1,  cy: height * 0.05, r: width * 0.9,  color: '#3DBF86', opacity: 0.12 },
        { cx: width * 0.9,  cy: height * 0.2,  r: width * 0.8,  color: '#7C3AED', opacity: 0.10 },
        { cx: width * 0.4,  cy: height * 0.55, r: width * 0.85, color: '#14B8A6', opacity: 0.08 },
        { cx: width * 0.15, cy: height * 0.85, r: width * 0.7,  color: '#3B82F6', opacity: 0.06 },
      ]
    : [
        { cx: width * 0.05, cy: height * 0.02, r: width * 0.9,  color: '#2D9F73', opacity: 0.10 },
        { cx: width * 0.95, cy: height * 0.18, r: width * 0.8,  color: '#7C3AED', opacity: 0.08 },
        { cx: width * 0.45, cy: height * 0.5,  r: width * 0.85, color: '#14B8A6', opacity: 0.06 },
        { cx: width * 0.2,  cy: height * 0.88, r: width * 0.7,  color: '#F59E0B', opacity: 0.05 },
      ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
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

        {/* Gradient blobs layered on top */}
        {blobs.map((_, i) => (
          <Rect key={`r${i}`} x={0} y={0} width={width} height={height} fill={`url(#mb${i})`} />
        ))}
      </Svg>
    </View>
  );
}
