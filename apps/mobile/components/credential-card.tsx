import { View, Text, Pressable } from 'react-native';
import { memo, useCallback } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import type { StoredCredential } from '@/lib/store';
import { CREDENTIAL_TYPE_CONFIG } from '@/lib/constants';
import { StatusBadge } from './status-badge';
import { LinearGradient } from './linear-gradient-border';

interface CredentialCardProps {
  credential: StoredCredential;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const CredentialCard = memo(function CredentialCard({
  credential,
  onPress,
}: CredentialCardProps) {
  const config =
    CREDENTIAL_TYPE_CONFIG[
      credential.type as keyof typeof CREDENTIAL_TYPE_CONFIG
    ];
  const gradientStart = config?.gradientStart ?? '#14B8A6';
  const gradientEnd = config?.gradientEnd ?? '#10B981';

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [scale]);

  const previewClaims = Object.entries(credential.claims).slice(0, 3);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}
      accessibilityLabel={`${credential.typeName} credential from ${credential.issuerName}, status ${credential.status}`}
      accessibilityRole="button"
      accessibilityHint="Double tap to view credential details"
    >
      <View style={{ flexDirection: 'row', borderRadius: 12, overflow: 'hidden' }}>
        {/* Gradient left border */}
        <LinearGradient
          colorStart={gradientStart}
          colorEnd={gradientEnd}
          width={4}
        />

        {/* Card content */}
        <View
          style={{
            flex: 1,
            backgroundColor: '#111827',
            padding: 16,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <Text
              style={{ color: '#F9FAFB', fontWeight: '600', fontSize: 16 }}
              numberOfLines={1}
            >
              {credential.typeName}
            </Text>
            <StatusBadge status={credential.status} />
          </View>

          <Text
            style={{ color: '#6B7280', fontSize: 12, marginBottom: 12 }}
            numberOfLines={1}
          >
            {credential.issuerName}
          </Text>

          {previewClaims.map(([key, value]) => (
            <View
              key={key}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 4,
              }}
            >
              <Text
                style={{
                  color: '#6B7280',
                  fontSize: 12,
                  textTransform: 'capitalize',
                }}
              >
                {key}
              </Text>
              <Text style={{ color: '#F9FAFB', fontSize: 12 }}>
                {String(value)}
              </Text>
            </View>
          ))}

          <Text style={{ color: '#6B7280', fontSize: 10, marginTop: 8 }}>
            Issued {new Date(credential.issuedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </AnimatedPressable>
  );
});
