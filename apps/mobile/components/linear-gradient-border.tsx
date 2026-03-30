import { View } from 'react-native';

interface LinearGradientBorderProps {
  colorStart: string;
  colorEnd: string;
  width?: number;
}

/**
 * A simple vertical gradient simulation using two stacked color blocks.
 * Avoids expo-linear-gradient dependency for a lightweight gradient border effect.
 */
export function LinearGradient({
  colorStart,
  colorEnd,
  width = 4,
}: LinearGradientBorderProps) {
  return (
    <View style={{ width, flexDirection: 'column' }}>
      <View style={{ flex: 1, backgroundColor: colorStart }} />
      <View style={{ flex: 1, backgroundColor: colorEnd }} />
    </View>
  );
}
