import {
  View, Text, Pressable, TextInput, StyleSheet, Animated,
  Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import Svg, { Defs, Rect, Mask } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { notifySuccess } from '@/lib/haptics';
import { useScanner } from '@/hooks/use-scanner';
import { useTheme } from '@/lib/theme';
import { TABS } from '@/lib/routes';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const FRAME_SIZE = Math.min(SCREEN_W * 0.68, 270);
const CORNER_LEN = 28;
const CORNER_W = 4;
const CORNER_R = 16;

export default function ScannerScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualUri, setManualUri] = useState('');
  const { scanned, scanResult, handleBarcodeScan, handleManualUri, reset } = useScanner();
  const lineAnim = useRef(new Animated.Value(0)).current;

  // Scan line animation
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(lineAnim, { toValue: 1, duration: 2400, useNativeDriver: true }),
        Animated.timing(lineAnim, { toValue: 0, duration: 2400, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [lineAnim]);

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

  const onManualSubmit = () => {
    const trimmed = manualUri.trim();
    if (trimmed.length > 0) handleManualUri(trimmed);
  };

  const translateY = lineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-FRAME_SIZE / 2 + 8, FRAME_SIZE / 2 - 8],
  });

  // Frame centered horizontally, 30% from top
  const frameX = (SCREEN_W - FRAME_SIZE) / 2;
  const frameY = SCREEN_H * 0.3;

  // ── Permission loading ──
  if (permission === null) {
    return (
      <View style={[s.center, { backgroundColor: colors.bg }]}>
        <View style={[s.permIcon, { backgroundColor: `${colors.primary}15` }]}>
          <Ionicons name="camera-outline" size={36} color={colors.primary} />
        </View>
        <Text style={[s.permTitle, { color: colors.foreground }]}>Requesting camera...</Text>
      </View>
    );
  }

  // ── Permission denied ──
  if (!permission.granted) {
    return (
      <View style={[s.center, { backgroundColor: colors.bg }]}>
        <View style={[s.permIcon, { backgroundColor: `${colors.primary}15` }]}>
          <Ionicons name="scan-outline" size={40} color={colors.primary} />
        </View>
        <Text style={[s.permTitle, { color: colors.foreground }]}>Camera Access Needed</Text>
        <Text style={[s.permDesc, { color: colors.mutedText }]}>
          Scan QR codes to receive credentials{'\n'}and present them to verifiers.
        </Text>
        <Pressable
          onPress={requestPermission}
          style={({ pressed }) => [s.permBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
          accessibilityLabel="Grant camera permission"
          accessibilityRole="button"
        >
          <Ionicons name="camera" size={18} color={colors.primaryFg} style={{ marginRight: 8 }} />
          <Text style={[s.permBtnText, { color: colors.primaryFg }]}>Allow Camera</Text>
        </Pressable>
        <Pressable
          onPress={() => setShowManual((p) => !p)}
          style={({ pressed }) => [s.link, { opacity: pressed ? 0.6 : 1 }]}
          accessibilityLabel="Enter URI manually"
          accessibilityRole="button"
        >
          <Text style={[s.linkText, { color: colors.primary }]}>Enter URI manually</Text>
        </Pressable>
        {showManual && (
          <View style={s.manualRow}>
            <TextInput
              style={[s.manualInput, { backgroundColor: colors.muted, color: colors.foreground }]}
              value={manualUri}
              onChangeText={setManualUri}
              placeholder="openid-credential-offer://..."
              placeholderTextColor={colors.placeholder}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Credential offer URI"
            />
            <Pressable
              onPress={onManualSubmit}
              style={({ pressed }) => [s.manualGo, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
              accessibilityLabel="Submit URI"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-forward" size={20} color={colors.primaryFg} />
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  // ── Camera scanner ──
  return (
    <KeyboardAvoidingView style={s.cam} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
          fill="rgba(0,0,0,0.6)" mask="url(#cutout)"
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
            label={torchOn ? 'Torch On' : 'Torch'}
            active={torchOn}
            accent={colors.primary}
            accentFg={colors.primaryFg}
            onPress={() => setTorchOn((p) => !p)}
          />
          <Pill
            icon="document-text-outline"
            label="Paste URI"
            active={showManual}
            accent={colors.primary}
            accentFg={colors.primaryFg}
            onPress={() => setShowManual((p) => !p)}
          />
        </View>

        {showManual && (
          <View style={s.manualRow}>
            <TextInput
              style={[s.manualInput, { backgroundColor: 'rgba(255,255,255,0.12)', color: '#FFF' }]}
              value={manualUri}
              onChangeText={setManualUri}
              placeholder="openid-credential-offer://..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Credential offer URI"
            />
            <Pressable
              onPress={onManualSubmit}
              style={({ pressed }) => [s.manualGo, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
              accessibilityLabel="Submit URI"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-forward" size={20} color={colors.primaryFg} />
            </Pressable>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
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
  // Permission
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  permIcon: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  permTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  permDesc: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 32 },
  permBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, minHeight: 48, marginBottom: 16 },
  permBtnText: { fontSize: 16, fontWeight: '600' },
  link: { paddingVertical: 8, minHeight: 44, justifyContent: 'center' },
  linkText: { fontSize: 14, fontWeight: '500' },
  // Camera
  cam: { flex: 1, backgroundColor: '#000' },
  framePos: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  scanLine: { width: FRAME_SIZE - 32, height: 2, borderRadius: 1, opacity: 0.6 },
  // Bottom
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', paddingTop: 28, paddingHorizontal: 24 },
  hint: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '500', marginBottom: 24 },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, minHeight: 44, gap: 6 },
  pillLabel: { fontSize: 13, fontWeight: '600' },
  // Manual input
  manualRow: { flexDirection: 'row', width: '100%', gap: 8, paddingHorizontal: 8 },
  manualInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, fontSize: 13, fontFamily: 'monospace' },
  manualGo: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
