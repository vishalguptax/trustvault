import { View, Text, Pressable, Modal } from 'react-native';
import { useTheme } from '@/lib/theme';

interface ConfirmSheetProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        onPress={onCancel}
        accessibilityLabel="Close dialog"
      >
        <Pressable
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: 12,
            paddingHorizontal: 22,
            paddingBottom: 40,
          }}
          onPress={() => {}}
          accessibilityRole="alert"
        >
          {/* Handle bar */}
          <View style={{
            width: 48, height: 4, backgroundColor: colors.muted,
            borderRadius: 2, alignSelf: 'center', marginBottom: 22,
          }} />

          <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: '700', marginBottom: 8 }}>
            {title}
          </Text>
          <Text style={{ color: colors.mutedText, fontSize: 15, lineHeight: 22, marginBottom: 28 }}>
            {message}
          </Text>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => ({
                flex: 1, paddingVertical: 15, borderRadius: 16,
                alignItems: 'center', backgroundColor: colors.muted,
                opacity: pressed ? 0.8 : 1, minHeight: 48,
              })}
              accessibilityLabel={cancelLabel}
              accessibilityRole="button"
            >
              <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 16 }}>
                {cancelLabel}
              </Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => ({
                flex: 1, paddingVertical: 15, borderRadius: 16,
                alignItems: 'center',
                backgroundColor: destructive ? colors.danger : colors.primary,
                opacity: pressed ? 0.9 : 1, minHeight: 48,
              })}
              accessibilityLabel={confirmLabel}
              accessibilityRole="button"
            >
              <Text style={{
                color: destructive ? '#FFFFFF' : colors.primaryFg,
                fontWeight: '700', fontSize: 16,
              }}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
