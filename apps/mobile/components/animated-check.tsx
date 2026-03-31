import { View, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';

interface AnimatedCheckProps {
  type: 'success' | 'error';
  size?: number;
}

export function AnimatedCheck({ type, size = 80 }: AnimatedCheckProps) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const isSuccess = type === 'success';
  const bgColor = isSuccess ? `${colors.success}25` : `${colors.danger}25`;
  const fgColor = isSuccess ? colors.success : colors.danger;

  return (
    <View
      style={[s.container, { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor }]}
      accessibilityLabel={isSuccess ? 'Success' : 'Error'}
      accessibilityRole="image"
    >
      {visible && (
        <Ionicons
          name={isSuccess ? 'checkmark' : 'close'}
          size={size * 0.45}
          color={fgColor}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
});
