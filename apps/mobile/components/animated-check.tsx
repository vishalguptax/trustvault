import { View, Text, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';

interface AnimatedCheckProps {
  type: 'success' | 'error';
  size?: number;
}

export function AnimatedCheck({ type, size = 80 }: AnimatedCheckProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)';
  const fgColor = isSuccess ? '#10B981' : '#EF4444';
  const symbol = isSuccess ? '✓' : '✕';

  return (
    <View
      style={[s.container, { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor }]}
      accessibilityLabel={isSuccess ? 'Success' : 'Error'}
      accessibilityRole="image"
    >
      {visible && (
        <Text style={[s.symbol, { color: fgColor, fontSize: size * 0.45 }]}>{symbol}</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  symbol: { fontWeight: '700' },
});
