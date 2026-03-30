import { View, Text } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface QrDisplayProps {
  value: string;
  size?: number;
  label?: string;
}

export function QrDisplay({ value, size = 200, label }: QrDisplayProps) {
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
          color="#0B1120"
        />
        <View
          style={{
            marginTop: 12,
            paddingHorizontal: 12,
            paddingVertical: 4,
            backgroundColor: '#0B1120',
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              color: '#14B8A6',
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
            color: '#6B7280',
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
