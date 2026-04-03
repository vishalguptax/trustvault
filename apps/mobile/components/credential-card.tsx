import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import type { StoredCredential } from '@/lib/store';
import { CREDENTIAL_TYPE_CONFIG, CREDENTIAL_CATEGORIES, getClaimLabel, formatCredentialType, getDocumentTitle } from '@/lib/constants';
import { filterUserClaims, formatClaimValue, formatDate, didDisplayName } from '@/lib/format';
import { StatusBadge } from './status-badge';
import { useTheme, cardShadow, cardShadowDark } from '@/lib/theme';

interface CredentialCardProps {
  credential: StoredCredential;
  onPress: () => void;
}

function getCategoryIcon(type: string): keyof typeof Ionicons.glyphMap {
  const cat = CREDENTIAL_CATEGORIES.find((c) => c.type === type);
  return cat?.icon ?? 'document-outline';
}

export const CredentialCard = memo(function CredentialCard({
  credential,
  onPress,
}: CredentialCardProps) {
  const { colors, isDark } = useTheme();
  const shadow = isDark ? cardShadowDark : cardShadow;
  const config =
    CREDENTIAL_TYPE_CONFIG[credential.type as keyof typeof CREDENTIAL_TYPE_CONFIG];
  const accentColor = config?.accent ?? colors.primary;
  const icon = getCategoryIcon(credential.type);

  const documentTitle = getDocumentTitle(credential.type, credential.claims);
  const categoryName = formatCredentialType(credential.type) || credential.typeName;
  const userClaims = filterUserClaims(credential.claims);
  const previewClaims = Object.entries(userClaims).slice(0, 3);
  const totalClaims = Object.keys(userClaims).length;
  const extraCount = totalClaims - previewClaims.length;
  const issuerLabel = credential.issuerName && !credential.issuerName.startsWith('did:')
    ? credential.issuerName
    : didDisplayName(credential.issuerDid);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.97 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
      accessibilityLabel={`${credential.typeName} credential from ${issuerLabel}, status ${credential.status}`}
      accessibilityRole="button"
      accessibilityHint="Double tap to view credential details"
    >
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        flexDirection: 'row',
        ...shadow,
      }}>
        {/* Left accent stripe — two-tone gradient simulation */}
        <View style={{ width: 5, overflow: 'hidden' }}>
          <View style={{ flex: 1, backgroundColor: accentColor }} />
          <View style={{ flex: 1, backgroundColor: accentColor, opacity: 0.5 }} />
        </View>

        {/* Card body */}
        <View style={{ flex: 1, padding: 16 }}>

          {/* ── Header: type badge + title + status ── */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            {/* Type icon */}
            <View style={{
              width: 40, height: 40, borderRadius: 12,
              backgroundColor: `${accentColor}14`,
              alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Ionicons name={icon} size={19} color={accentColor} />
            </View>

            {/* Title + category */}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{
                  color: colors.foreground, fontWeight: '700',
                  fontSize: 15, lineHeight: 20,
                }}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {documentTitle}
              </Text>
              <Text style={{
                color: accentColor, fontSize: 11, fontWeight: '600',
                marginTop: 2, letterSpacing: 0.2,
              }}>
                {categoryName}
              </Text>
            </View>

            {/* Status */}
            <View style={{ flexShrink: 0, marginTop: 2 }}>
              <StatusBadge status={credential.status} />
            </View>
          </View>

          {/* ── Issuer chip ── */}
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            marginTop: 12,
            backgroundColor: colors.muted,
            borderRadius: 8,
            paddingHorizontal: 10, paddingVertical: 6,
          }}>
            <Ionicons
              name="shield-checkmark-outline"
              size={12}
              color={colors.mutedText}
              style={{ marginRight: 6 }}
            />
            <Text
              style={{ color: colors.mutedText, fontSize: 11.5, fontWeight: '500', flex: 1 }}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {issuerLabel}
            </Text>
          </View>

          {/* ── Claims table ── */}
          {previewClaims.length > 0 && (
            <View style={{
              marginTop: 14,
              backgroundColor: isDark ? `${colors.muted}80` : `${colors.muted}60`,
              borderRadius: 10,
              paddingHorizontal: 12, paddingVertical: 10,
              gap: 8,
            }}>
              {previewClaims.map(([key, value], index) => (
                <View
                  key={key}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingBottom: index < previewClaims.length - 1 ? 8 : 0,
                    borderBottomWidth: index < previewClaims.length - 1 ? 1 : 0,
                    borderBottomColor: isDark ? `${colors.border}60` : `${colors.border}80`,
                  }}
                >
                  <Text
                    style={{
                      color: colors.mutedText, fontSize: 12,
                      width: '44%', lineHeight: 16,
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {getClaimLabel(key)}
                  </Text>
                  <Text
                    style={{
                      color: colors.foreground, fontSize: 12.5, fontWeight: '600',
                      flex: 1, textAlign: 'right', lineHeight: 16,
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {formatClaimValue(value)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Footer ── */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            marginTop: 14,
          }}>
            <Text style={{ color: colors.mutedText, fontSize: 11 }}>
              Issued {formatDate(credential.issuedAt)}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {extraCount > 0 && (
                <View style={{
                  backgroundColor: `${accentColor}14`,
                  borderRadius: 10,
                  paddingHorizontal: 8, paddingVertical: 2,
                }}>
                  <Text style={{ color: accentColor, fontSize: 10, fontWeight: '700' }}>
                    +{extraCount} more
                  </Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={14} color={colors.mutedText} />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
});
