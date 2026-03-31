import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { impactMedium, notifySuccess, notifyError, notifyWarning } from '@/lib/haptics';
import { useTheme } from '@/lib/theme';

interface DisclosureItem {
  credentialType: string;
  claims: string[];
}

interface ConsentSheetProps {
  visible: boolean;
  verifierName: string;
  purpose: string;
  disclosures: DisclosureItem[];
  onAllow: () => void;
  onDeny: () => void;
}

export function ConsentSheet({
  visible,
  verifierName,
  purpose,
  disclosures,
  onAllow,
  onDeny,
}: ConsentSheetProps) {
  const { colors } = useTheme();

  const handleAllow = () => {
    notifySuccess();
    onAllow();
  };

  const handleDeny = () => {
    notifyWarning();
    onDeny();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 12,
            paddingHorizontal: 20,
            paddingBottom: 40,
            maxHeight: '75%',
          }}
          accessibilityRole="alert"
          accessibilityLabel="Consent required"
        >
          {/* Handle bar */}
          <View
            style={{
              width: 40,
              height: 4,
              backgroundColor: colors.muted,
              borderRadius: 2,
              alignSelf: 'center',
              marginBottom: 20,
            }}
          />

          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 4,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.warning,
                marginRight: 8,
              }}
            />
            <Text style={{ color: colors.warning, fontSize: 13, fontWeight: '600' }}>
              Consent Required
            </Text>
          </View>

          <Text
            style={{
              color: colors.foreground,
              fontSize: 20,
              fontWeight: '700',
              marginBottom: 4,
              marginTop: 8,
            }}
          >
            {verifierName}
          </Text>

          <Text
            style={{
              color: colors.mutedText,
              fontSize: 14,
              marginBottom: 20,
            }}
          >
            {purpose}
          </Text>

          {/* Disclosure list */}
          <Text
            style={{
              color: colors.foreground,
              fontSize: 14,
              fontWeight: '600',
              marginBottom: 12,
            }}
          >
            Information that will be shared:
          </Text>

          <ScrollView
            style={{ maxHeight: 200, marginBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {disclosures.map((disclosure) => (
              <View
                key={disclosure.credentialType}
                style={{
                  backgroundColor: colors.muted,
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: 12,
                    fontWeight: '600',
                    marginBottom: 8,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {disclosure.credentialType}
                </Text>
                {disclosure.claims.map((claim) => (
                  <View
                    key={claim}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 4,
                    }}
                  >
                    <View
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: colors.mutedText,
                        marginRight: 8,
                      }}
                    />
                    <Text style={{ color: colors.foreground, fontSize: 14 }}>
                      {claim}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>

          {/* Action buttons */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={handleDeny}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: colors.muted,
                backgroundColor: pressed ? colors.muted : 'transparent',
                minHeight: 44,
              })}
              accessibilityLabel="Deny sharing credentials"
              accessibilityRole="button"
              accessibilityHint="Cancels the presentation and returns to the wallet"
            >
              <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 16 }}>
                Deny
              </Text>
            </Pressable>
            <Pressable
              onPress={handleAllow}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
                backgroundColor: colors.primary,
                opacity: pressed ? 0.85 : 1,
                minHeight: 44,
              })}
              accessibilityLabel="Allow sharing credentials"
              accessibilityRole="button"
              accessibilityHint="Shares the selected claims with the verifier"
            >
              <Text style={{ color: colors.primaryFg, fontWeight: '700', fontSize: 16 }}>
                Allow
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
