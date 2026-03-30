import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';

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
  const handleAllow = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAllow();
  };

  const handleDeny = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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
            backgroundColor: '#111827',
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
              backgroundColor: '#1F2937',
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
                backgroundColor: '#F59E0B',
                marginRight: 8,
              }}
            />
            <Text style={{ color: '#F59E0B', fontSize: 13, fontWeight: '600' }}>
              Consent Required
            </Text>
          </View>

          <Text
            style={{
              color: '#F9FAFB',
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
              color: '#6B7280',
              fontSize: 14,
              marginBottom: 20,
            }}
          >
            {purpose}
          </Text>

          {/* Disclosure list */}
          <Text
            style={{
              color: '#F9FAFB',
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
                  backgroundColor: '#1F2937',
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    color: '#14B8A6',
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
                        backgroundColor: '#6B7280',
                        marginRight: 8,
                      }}
                    />
                    <Text style={{ color: '#F9FAFB', fontSize: 14 }}>
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
                borderColor: '#1F2937',
                backgroundColor: pressed ? '#1F2937' : 'transparent',
              })}
              accessibilityLabel="Deny sharing credentials"
              accessibilityRole="button"
            >
              <Text style={{ color: '#F9FAFB', fontWeight: '600', fontSize: 16 }}>
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
                backgroundColor: pressed ? '#0D9488' : '#14B8A6',
              })}
              accessibilityLabel="Allow sharing credentials"
              accessibilityRole="button"
            >
              <Text style={{ color: '#0B1120', fontWeight: '700', fontSize: 16 }}>
                Allow
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
