import { View, Text } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '@/lib/theme';

interface QrDisplayProps {
  value: string;
  size?: number;
  label?: string;
}

export function QrDisplay({ value, size = 200, label }: QrDisplayProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      accessibilityLabel={label ?? 'QR code'}
      accessibilityRole="image"
    >
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 16,
          alignItems: 'center',
        }}
      >
        <QRCode
          value={value}
          size={size}
          backgroundColor="#FFFFFF"
          color={colors.bg}
        />
        <View
          style={{
            marginTop: 12,
            paddingHorizontal: 12,
            paddingVertical: 4,
            backgroundColor: colors.bg,
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              color: colors.primary,
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 1,
            }}
          >
            TRUSTVAULT
          </Text>
        </View>
      </View>
      {label ? (
        <Text
          style={{
            color: colors.mutedText,
            fontSize: 12,
            marginTop: 12,
            textAlign: 'center',
          }}
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
}
