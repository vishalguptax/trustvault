import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCredentialStore } from '@/lib/store';
import { StatusBadge } from '@/components/status-badge';
import { IssuerBadge } from '@/components/issuer-badge';
import { QrDisplay } from '@/components/qr-display';
import { CREDENTIAL_TYPE_CONFIG, CREDENTIAL_CATEGORIES, getClaimLabel } from '@/lib/constants';
import { formatDate, truncateDid, filterUserClaims, formatClaimValue } from '@/lib/format';
import { useCredentialClaims } from '@/hooks/use-credentials';
import { useTheme, cardShadow, cardShadowDark } from '@/lib/theme';

function getCategoryIcon(type: string): keyof typeof Ionicons.glyphMap {
  const cat = CREDENTIAL_CATEGORIES.find((c) => c.type === type);
  return cat?.icon ?? 'document-outline';
}

export default function CredentialDetail() {
  const { colors, isDark } = useTheme();
  const shadow = isDark ? cardShadowDark : cardShadow;
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const credential = useCredentialStore((state) =>
    state.credentials.find((c) => c.id === id),
  );

  const { data: claimsData, isLoading: loadingClaims, error: claimsError } = useCredentialClaims(id ?? '');

  if (!credential) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="document-outline" size={48} color={colors.mutedText} />
        <Text style={{ color: colors.mutedText, marginTop: 12, fontSize: 15 }}>Credential not found</Text>
      </View>
    );
  }

  const typeConfig =
    CREDENTIAL_TYPE_CONFIG[credential.type as keyof typeof CREDENTIAL_TYPE_CONFIG];
  const accentColor = typeConfig?.accent ?? colors.primary;
  const icon = getCategoryIcon(credential.type);

  const displayClaims = claimsData?.claims ?? credential.claims;
  const displaySdClaims = claimsData?.sdClaims ?? credential.sdClaims;
  const userClaims = filterUserClaims(displayClaims);
  const claimEntries = Object.entries(userClaims);

  const subjectDid = credential.subjectDid || (credential.claims?.sub as string) || '';

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ══════════════════════════════════════════════
          HERO CARD — credential identity
          ══════════════════════════════════════════════ */}
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        marginBottom: 14,
        ...shadow,
      }}>
        {/* Accent gradient bar */}
        <View style={{ height: 4, flexDirection: 'row' }}>
          <View style={{ flex: 1, backgroundColor: accentColor }} />
          <View style={{ flex: 1, backgroundColor: accentColor, opacity: 0.6 }} />
          <View style={{ flex: 1, backgroundColor: accentColor, opacity: 0.3 }} />
        </View>

        <View style={{ padding: 20 }}>
          {/* Type icon + Title + Status */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
            <View style={{
              width: 48, height: 48, borderRadius: 16,
              backgroundColor: `${accentColor}14`,
              alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Ionicons name={icon} size={24} color={accentColor} />
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{
                  color: colors.foreground, fontSize: 20, fontWeight: '700',
                  lineHeight: 26, letterSpacing: -0.3,
                }}
                numberOfLines={3}
              >
                {credential.typeName}
              </Text>
              <Text style={{
                color: accentColor, fontSize: 12, fontWeight: '600',
                marginTop: 4, letterSpacing: 0.3,
              }}>
                {typeConfig?.name ?? credential.type}
              </Text>
            </View>

            <View style={{ flexShrink: 0, marginTop: 4 }}>
              <StatusBadge status={credential.status} />
            </View>
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 16 }} />

          {/* Issuer */}
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: colors.muted,
            borderRadius: 12, padding: 12,
            marginBottom: 14,
          }}>
            <View style={{
              width: 32, height: 32, borderRadius: 10,
              backgroundColor: `${colors.primary}18`,
              alignItems: 'center', justifyContent: 'center',
              marginRight: 10,
            }}>
              <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: colors.mutedText, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Issued by
              </Text>
              <Text
                style={{ color: colors.foreground, fontSize: 14, fontWeight: '600', marginTop: 1 }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {credential.issuerName && !credential.issuerName.startsWith('did:')
                  ? credential.issuerName
                  : 'Verified Issuer'}
              </Text>
              {credential.issuerDid ? (
                <Text style={{ color: colors.mutedText, fontSize: 10, fontFamily: 'monospace', marginTop: 2 }} numberOfLines={1}>
                  {truncateDid(credential.issuerDid)}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Dates row */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: colors.muted, borderRadius: 10, padding: 10 }}>
              <Text style={{ color: colors.mutedText, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Issued
              </Text>
              <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600', marginTop: 3 }}>
                {formatDate(credential.issuedAt)}
              </Text>
            </View>
            {credential.expiresAt ? (
              <View style={{ flex: 1, backgroundColor: colors.muted, borderRadius: 10, padding: 10 }}>
                <Text style={{ color: colors.mutedText, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Expires
                </Text>
                <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600', marginTop: 3 }}>
                  {formatDate(credential.expiresAt)}
                </Text>
              </View>
            ) : (
              <View style={{ flex: 1, backgroundColor: colors.muted, borderRadius: 10, padding: 10 }}>
                <Text style={{ color: colors.mutedText, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Validity
                </Text>
                <Text style={{ color: colors.success, fontSize: 13, fontWeight: '600', marginTop: 3 }}>
                  No Expiry
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ══════════════════════════════════════════════
          CLAIMS CARD — data table
          ══════════════════════════════════════════════ */}
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        marginBottom: 14,
        ...shadow,
      }}>
        {/* Section header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 18, paddingTop: 18, paddingBottom: 12,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="list-outline" size={18} color={colors.foreground} />
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700' }}>
              Claims
            </Text>
          </View>
          <View style={{
            backgroundColor: `${accentColor}14`, borderRadius: 8,
            paddingHorizontal: 8, paddingVertical: 3,
          }}>
            <Text style={{ color: accentColor, fontSize: 11, fontWeight: '700' }}>
              {claimEntries.length}
            </Text>
          </View>
        </View>

        {/* Loading / Error / Claims list */}
        {loadingClaims && !claimsData ? (
          <View style={{ alignItems: 'center', paddingVertical: 24, paddingBottom: 28 }}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={{ color: colors.mutedText, fontSize: 12, marginTop: 8 }}>
              Loading claims...
            </Text>
          </View>
        ) : claimsError && !claimsData ? (
          <View style={{ paddingHorizontal: 18, paddingBottom: 18 }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: `${colors.warning}12`, borderRadius: 8,
              paddingHorizontal: 10, paddingVertical: 8, marginBottom: 12,
            }}>
              <Ionicons name="warning-outline" size={14} color={colors.warning} />
              <Text style={{ color: colors.warning, fontSize: 11, flex: 1 }}>
                Could not load latest claims. Showing cached data.
              </Text>
            </View>
            <ClaimsTable entries={claimEntries} sdClaims={displaySdClaims} colors={colors} isDark={isDark} />
          </View>
        ) : claimEntries.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 24, paddingBottom: 28 }}>
            <Ionicons name="document-text-outline" size={32} color={colors.mutedText} />
            <Text style={{ color: colors.mutedText, fontSize: 13, marginTop: 8 }}>
              No claims available
            </Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 18, paddingBottom: 18 }}>
            <ClaimsTable entries={claimEntries} sdClaims={displaySdClaims} colors={colors} isDark={isDark} />
          </View>
        )}
      </View>

      {/* ══════════════════════════════════════════════
          HOLDER DID + QR
          ══════════════════════════════════════════════ */}
      {subjectDid && subjectDid !== 'unknown' ? (
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
          marginBottom: 14,
          ...shadow,
        }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            paddingHorizontal: 18, paddingTop: 18, paddingBottom: 4,
          }}>
            <Ionicons name="finger-print-outline" size={18} color={colors.foreground} />
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700' }}>
              Holder DID
            </Text>
          </View>
          <View style={{ paddingHorizontal: 18, paddingTop: 4 }}>
            <Text
              style={{
                color: colors.mutedText, fontSize: 11, fontFamily: 'monospace',
                backgroundColor: colors.muted, borderRadius: 8,
                paddingHorizontal: 10, paddingVertical: 8,
                overflow: 'hidden',
              }}
              numberOfLines={2}
              selectable
            >
              {subjectDid}
            </Text>
          </View>
          <QrDisplay value={subjectDid} size={140} label="Scan to obtain holder DID" />
        </View>
      ) : null}
    </ScrollView>
  );
}

/* ── Claims Table Component ── */

interface ClaimsTableProps {
  entries: [string, unknown][];
  sdClaims: string[];
  colors: Record<string, string>;
  isDark: boolean;
}

function ClaimsTable({ entries, sdClaims, colors, isDark }: ClaimsTableProps) {
  return (
    <View style={{ borderRadius: 12, overflow: 'hidden' }}>
      {entries.map(([key, value], index) => {
        const isSD = sdClaims.includes(key);
        const isLast = index === entries.length - 1;

        return (
          <View
            key={key}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              paddingVertical: 11,
              paddingHorizontal: 12,
              backgroundColor: index % 2 === 0 ? 'transparent' : `${colors.muted}60`,
              borderBottomWidth: isLast ? 0 : 1,
              borderBottomColor: isDark ? `${colors.border}40` : `${colors.border}60`,
            }}
            accessibilityLabel={`${getClaimLabel(key)}: ${formatClaimValue(value)}, ${isSD ? 'selectively disclosable' : 'always disclosed'}`}
            accessibilityRole="text"
          >
            {/* Disclosure indicator */}
            <View style={{ marginRight: 10, marginTop: 2, width: 16, alignItems: 'center' }}>
              {isSD ? (
                <Ionicons name="eye-outline" size={13} color={colors.primary} />
              ) : (
                <Ionicons name="lock-closed-outline" size={13} color={colors.mutedText} />
              )}
            </View>

            {/* Label */}
            <Text
              style={{ color: colors.mutedText, fontSize: 13, width: '38%', lineHeight: 18 }}
              numberOfLines={2}
            >
              {getClaimLabel(key)}
            </Text>

            {/* Value */}
            <Text
              style={{
                color: colors.foreground, fontSize: 13, fontWeight: '600',
                flex: 1, textAlign: 'right', lineHeight: 18,
              }}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {formatClaimValue(value)}
            </Text>
          </View>
        );
      })}

      {/* Legend */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 16,
        paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="eye-outline" size={11} color={colors.primary} />
          <Text style={{ color: colors.mutedText, fontSize: 10 }}>Selective</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="lock-closed-outline" size={11} color={colors.mutedText} />
          <Text style={{ color: colors.mutedText, fontSize: 10 }}>Always shared</Text>
        </View>
      </View>
    </View>
  );
}
