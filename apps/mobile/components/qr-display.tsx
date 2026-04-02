import { View, Text, Pressable, Modal, useWindowDimensions } from 'react-native';
import { useState } from 'react';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, cardShadow, cardShadowDark } from '@/lib/theme';

interface QrDisplayProps {
  value: string;
  size?: number;
  label?: string;
}

export function QrDisplay({ value, size = 200, label }: QrDisplayProps) {
  const { colors, isDark } = useTheme();
  const shadow = isDark ? cardShadowDark : cardShadow;
  const [expanded, setExpanded] = useState(false);
  const { width } = useWindowDimensions();
  const expandedSize = Math.min(width - 96, 320);

  return (
    <>
      <Pressable
        onPress={() => setExpanded(true)}
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
        accessibilityLabel={label ? `${label}. Tap to enlarge.` : 'QR code. Tap to enlarge.'}
        accessibilityRole="button"
        accessibilityHint="Opens a larger view of the QR code"
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            padding: 18,
            alignItems: 'center',
            ...shadow,
          }}
        >
          <View
            style={{
              backgroundColor: colors.qrBg,
              borderRadius: 12,
              padding: 16,
            }}
          >
            <QRCode
              value={value}
              size={size}
              backgroundColor={colors.qrBg}
              color={colors.qrFg}
            />
          </View>
          <View
            style={{
              marginTop: 12,
              paddingHorizontal: 12,
              paddingVertical: 4,
              backgroundColor: `${colors.primary}10`,
              borderRadius: 999,
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
      </Pressable>

      <Modal
        visible={expanded}
        transparent
        animationType="fade"
        onRequestClose={() => setExpanded(false)}
      >
        <Pressable
          onPress={() => setExpanded(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.8)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityLabel="Close enlarged QR code"
          accessibilityRole="button"
        >
          <View
            style={{
              backgroundColor: colors.qrBg,
              borderRadius: 20,
              padding: 24,
              alignItems: 'center',
            }}
          >
            <QRCode
              value={value}
              size={expandedSize}
              backgroundColor={colors.qrBg}
              color={colors.qrFg}
            />
            <Text
              style={{
                color: colors.qrFg,
                fontSize: 12,
                marginTop: 16,
                fontWeight: '600',
              }}
            >
              Tap anywhere to close
            </Text>
          </View>
          <Pressable
            onPress={() => setExpanded(false)}
            style={{
              marginTop: 24,
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityLabel="Close"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={24} color={colors.foreground} />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
