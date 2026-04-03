import {
  View, Text, Pressable, TextInput, StyleSheet, Animated,
  Dimensions, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import Svg, { Defs, Rect, Mask } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef, useCallback } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { impactMedium, notifySuccess } from '@/lib/haptics';
import { useScanner } from '@/hooks/use-scanner';
import { useTheme, cardShadow, cardShadowDark } from '@/lib/theme';
import { TABS } from '@/lib/routes';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const FRAME_SIZE = Math.min(SCREEN_W * 0.68, 270);
const CORNER_LEN = 28;
const CORNER_W = 4;
const CORNER_R = 16;

type Mode = 'chooser' | 'scan' | 'uri';

export default function ScannerScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const shadow = isDark ? cardShadowDark : cardShadow;
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<Mode>('chooser');
  const [torchOn, setTorchOn] = useState(false);
  const [manualUri, setManualUri] = useState('');
  const { scanned, scanResult, handleBarcodeScan, handleManualUri, reset } = useScanner();
  const lineAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  // Scan line animation
  useEffect(() => {
    if (mode !== 'scan') return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(lineAnim, { toValue: 1, duration: 2400, useNativeDriver: true }),
        Animated.timing(lineAnim, { toValue: 0, duration: 2400, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [lineAnim, mode]);

  // Navigate on scan result
  useEffect(() => {
    if (!scanResult) return;
    notifySuccess();
    if (scanResult.type === 'offer') {
      router.replace({ pathname: TABS.RECEIVE, params: { uri: scanResult.uri } });
    } else if (scanResult.type === 'verification') {
      router.replace({ pathname: TABS.PRESENT, params: { uri: scanResult.uri } });
    } else {
      reset();
    }
  }, [scanResult, router, reset]);

  const onManualSubmit = useCallback(() => {
    const trimmed = manualUri.trim();
    if (trimmed.length > 0) {
      impactMedium();
      handleManualUri(trimmed);
    }
  }, [manualUri, handleManualUri]);

  const openScanner = useCallback(async () => {
    impactMedium();
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }
    setMode('scan');
  }, [permission, requestPermission]);

  const openUriInput = useCallback(() => {
    impactMedium();
    setMode('uri');
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const translateY = lineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-FRAME_SIZE / 2 + 8, FRAME_SIZE / 2 - 8],
  });

  const frameX = (SCREEN_W - FRAME_SIZE) / 2;
  const frameY = SCREEN_H * 0.28;

  // ════════════════════════════════════════════
  // CHOOSER — default landing screen
  // ════════════════════════════════════════════
  if (mode === 'chooser') {
    return (
      <View style={{ flex: 1, paddingHorizontal: 20, justifyContent: 'center' }}>
        {/* Heading */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{
            width: 72, height: 72, borderRadius: 24,
            backgroundColor: `${colors.primary}14`,
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 20,
          }}>
            <Ionicons name="add-circle-outline" size={36} color={colors.primary} />
          </View>
          <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 6 }}>
            Add Credential
          </Text>
          <Text style={{ color: colors.mutedText, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
            Scan a QR code or paste a credential offer URI
          </Text>
        </View>

        {/* Option cards */}
        <View style={{ gap: 12 }}>
          <Pressable
            onPress={openScanner}
            style={({ pressed }) => ({
              backgroundColor: colors.surface,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
              ...shadow,
            })}
            accessibilityLabel="Scan QR code"
            accessibilityRole="button"
          >
            <View style={{
              width: 52, height: 52, borderRadius: 16,
              backgroundColor: `${colors.primary}14`,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="qr-code-outline" size={26} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700', marginBottom: 3 }}>
                Scan QR Code
              </Text>
              <Text style={{ color: colors.mutedText, fontSize: 13, lineHeight: 18 }}>
                Use your camera to scan a credential offer or verification request
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.mutedText} />
          </Pressable>

          <Pressable
            onPress={openUriInput}
            style={({ pressed }) => ({
              backgroundColor: colors.surface,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
              ...shadow,
            })}
            accessibilityLabel="Enter URI manually"
            accessibilityRole="button"
          >
            <View style={{
              width: 52, height: 52, borderRadius: 16,
              backgroundColor: `${colors.info}14`,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="link-outline" size={26} color={colors.info} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700', marginBottom: 3 }}>
                Paste URI
              </Text>
              <Text style={{ color: colors.mutedText, fontSize: 13, lineHeight: 18 }}>
                Enter a credential offer or verification URI directly
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.mutedText} />
          </Pressable>
        </View>
      </View>
    );
  }

  // ════════════════════════════════════════════
  // URI INPUT — dedicated full-screen input
  // ════════════════════════════════════════════
  if (mode === 'uri') {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1, justifyContent: 'center',
            paddingHorizontal: 20, paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View style={{
              width: 64, height: 64, borderRadius: 20,
              backgroundColor: `${colors.info}14`,
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <Ionicons name="link-outline" size={30} color={colors.info} />
            </View>
            <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 4 }}>
              Enter Credential URI
            </Text>
            <Text style={{ color: colors.mutedText, fontSize: 13, textAlign: 'center', lineHeight: 19 }}>
              Paste the full credential offer or verification URI
            </Text>
          </View>

          {/* Input card */}
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
            marginBottom: 16,
            ...shadow,
          }}>
            <Text style={{
              color: colors.mutedText, fontSize: 11, fontWeight: '600',
              textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
            }}>
              Credential URI
            </Text>
            <TextInput
              ref={inputRef}
              style={{
                backgroundColor: colors.muted,
                color: colors.foreground,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 14,
                fontSize: 13,
                fontFamily: 'monospace',
                minHeight: 80,
                textAlignVertical: 'top',
              }}
              value={manualUri}
              onChangeText={setManualUri}
              placeholder="openid-credential-offer://..."
              placeholderTextColor={colors.placeholder}
              autoCapitalize="none"
              autoCorrect={false}
              multiline
              accessibilityLabel="Credential offer URI"
            />
          </View>

          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={() => setMode('chooser')}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: colors.muted,
                paddingVertical: 15,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 50,
                opacity: pressed ? 0.85 : 1,
              })}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 15 }}>
                Back
              </Text>
            </Pressable>
            <Pressable
              onPress={onManualSubmit}
              style={({ pressed }) => ({
                flex: 1.4,
                backgroundColor: manualUri.trim().length > 0 ? colors.primary : colors.muted,
                paddingVertical: 15,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                minHeight: 50,
                opacity: pressed ? 0.85 : 1,
              })}
              disabled={manualUri.trim().length === 0}
              accessibilityLabel="Submit URI"
              accessibilityRole="button"
            >
              <Ionicons
                name="arrow-forward-circle"
                size={18}
                color={manualUri.trim().length > 0 ? colors.primaryFg : colors.mutedText}
              />
              <Text style={{
                color: manualUri.trim().length > 0 ? colors.primaryFg : colors.mutedText,
                fontWeight: '700', fontSize: 15,
              }}>
                Submit
              </Text>
            </Pressable>
          </View>

          {/* Switch to scan */}
          <Pressable
            onPress={openScanner}
            style={({ pressed }) => ({
              alignSelf: 'center', marginTop: 24,
              flexDirection: 'row', alignItems: 'center', gap: 6,
              opacity: pressed ? 0.6 : 1,
              paddingVertical: 8,
            })}
            accessibilityLabel="Switch to QR scanner"
            accessibilityRole="button"
          >
            <Ionicons name="qr-code-outline" size={16} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>
              Scan QR code instead
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ════════════════════════════════════════════
  // CAMERA SCANNER
  // ════════════════════════════════════════════

  // Permission not yet granted (shouldn't reach here normally, but safety check)
  if (!permission?.granted) {
    return (
      <View style={[s.center, { backgroundColor: colors.bg }]}>
        <Ionicons name="camera-outline" size={48} color={colors.mutedText} />
        <Text style={{ color: colors.mutedText, marginTop: 12, fontSize: 15 }}>Camera permission required</Text>
        <Pressable
          onPress={requestPermission}
          style={({ pressed }) => ({
            backgroundColor: colors.primary, borderRadius: 14,
            paddingHorizontal: 24, paddingVertical: 12, marginTop: 20,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ color: colors.primaryFg, fontWeight: '600' }}>Allow Camera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={s.cam}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScan}
        enableTorch={torchOn}
      />

      {/* Dark overlay with rounded-rect cutout */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <Mask id="cutout">
            <Rect x="0" y="0" width={SCREEN_W} height={SCREEN_H} fill="white" />
            <Rect
              x={frameX} y={frameY}
              width={FRAME_SIZE} height={FRAME_SIZE}
              rx={CORNER_R} ry={CORNER_R}
              fill="black"
            />
          </Mask>
        </Defs>
        <Rect
          x="0" y="0" width={SCREEN_W} height={SCREEN_H}
          fill="rgba(0,0,0,0.55)" mask="url(#cutout)"
        />
      </Svg>

      {/* Corner accents + scan line */}
      <View style={[s.framePos, { left: frameX, top: frameY, width: FRAME_SIZE, height: FRAME_SIZE }]} pointerEvents="none">
        <Corner pos="tl" color={colors.primary} />
        <Corner pos="tr" color={colors.primary} />
        <Corner pos="bl" color={colors.primary} />
        <Corner pos="br" color={colors.primary} />
        <Animated.View style={[s.scanLine, { backgroundColor: colors.primary, transform: [{ translateY }] }]} />
      </View>

      {/* Bottom controls */}
      <View style={[s.bottom, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={s.hint}>Align the QR code within the frame</Text>

        <View style={s.actions}>
          <Pill
            icon={torchOn ? 'flash' : 'flash-outline'}
            label={torchOn ? 'On' : 'Torch'}
            active={torchOn}
            accent={colors.primary}
            accentFg={colors.primaryFg}
            onPress={() => setTorchOn((p) => !p)}
          />
          <Pill
            icon="link-outline"
            label="Paste URI"
            active={false}
            accent={colors.primary}
            accentFg={colors.primaryFg}
            onPress={() => setMode('uri')}
          />
          <Pill
            icon="close-outline"
            label="Cancel"
            active={false}
            accent={colors.primary}
            accentFg={colors.primaryFg}
            onPress={() => setMode('chooser')}
          />
        </View>
      </View>
    </View>
  );
}

// ── Corner accent ──
function Corner({ pos, color }: { pos: 'tl' | 'tr' | 'bl' | 'br'; color: string }) {
  const top = pos[0] === 't';
  const left = pos[1] === 'l';
  return (
    <View style={{
      position: 'absolute', width: CORNER_LEN, height: CORNER_LEN,
      ...(top ? { top: 0 } : { bottom: 0 }),
      ...(left ? { left: 0 } : { right: 0 }),
      borderColor: color,
      ...(top && left && { borderTopWidth: CORNER_W, borderLeftWidth: CORNER_W, borderTopLeftRadius: CORNER_R }),
      ...(top && !left && { borderTopWidth: CORNER_W, borderRightWidth: CORNER_W, borderTopRightRadius: CORNER_R }),
      ...(!top && left && { borderBottomWidth: CORNER_W, borderLeftWidth: CORNER_W, borderBottomLeftRadius: CORNER_R }),
      ...(!top && !left && { borderBottomWidth: CORNER_W, borderRightWidth: CORNER_W, borderBottomRightRadius: CORNER_R }),
    }} />
  );
}

// ── Pill button ──
function Pill({ icon, label, active, accent, accentFg, onPress }: {
  icon: string; label: string; active: boolean; accent: string; accentFg: string; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.pill, { backgroundColor: active ? accent : 'rgba(255,255,255,0.12)', opacity: pressed ? 0.8 : 1 }]}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={active ? accentFg : '#FFF'} />
      <Text style={[s.pillLabel, { color: active ? accentFg : '#FFF' }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  cam: { flex: 1, backgroundColor: '#000' },
  framePos: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  scanLine: { width: FRAME_SIZE - 32, height: 2, borderRadius: 1, opacity: 0.6 },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', paddingTop: 28, paddingHorizontal: 24 },
  hint: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '500', marginBottom: 24 },
  actions: { flexDirection: 'row', gap: 10 },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, minHeight: 44, gap: 6 },
  pillLabel: { fontSize: 13, fontWeight: '600' },
});
