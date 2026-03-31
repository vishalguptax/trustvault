import { View, Text, Pressable, TextInput, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { impactMedium, notifySuccess, notifyError, notifyWarning } from '@/lib/haptics';
import { useScanner } from '@/hooks/use-scanner';

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualUri, setManualUri] = useState('');
  const { scanned, scanResult, handleBarcodeScan, handleManualUri, reset } =
    useScanner();

  useEffect(() => {
    if (scanResult === null) return;

    notifySuccess();

    if (scanResult.type === 'offer') {
      router.replace({ pathname: '/receive', params: { uri: scanResult.uri } });
    } else if (scanResult.type === 'verification') {
      router.replace({ pathname: '/present', params: { uri: scanResult.uri } });
    } else {
      reset();
    }
  }, [scanResult, router, reset]);

  const handleManualSubmit = () => {
    const trimmed = manualUri.trim();
    if (trimmed.length === 0) return;
    handleManualUri(trimmed);
  };

  // Permission not yet determined
  if (permission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.messageText}>Requesting camera permission...</Text>
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.titleText}>Camera Access Required</Text>
        <Text style={styles.messageText}>
          TrustVault needs camera access to scan QR codes for receiving and
          presenting credentials.
        </Text>
        <Pressable
          onPress={requestPermission}
          style={styles.primaryButton}
          accessibilityLabel="Grant camera permission"
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>Grant Permission</Text>
        </Pressable>
        <Pressable
          onPress={() => setShowManualInput(true)}
          style={styles.secondaryButton}
          accessibilityLabel="Enter URI manually instead"
          accessibilityRole="button"
        >
          <Text style={styles.secondaryButtonText}>Enter URI Manually</Text>
        </Pressable>
        {showManualInput && (
          <View style={styles.manualInputContainer}>
            <TextInput
              style={styles.textInput}
              value={manualUri}
              onChangeText={setManualUri}
              placeholder="openid-credential-offer://..."
              placeholderTextColor="#6B7280"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Manual URI input"
            />
            <Pressable
              onPress={handleManualSubmit}
              style={styles.submitButton}
              accessibilityLabel="Submit URI"
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>Go</Text>
            </Pressable>
          </View>
        )}
        <Pressable
          onPress={() => router.back()}
          style={styles.cancelButton}
          accessibilityLabel="Cancel and go back"
          accessibilityRole="button"
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScan}
        enableTorch={torchOn}
      />

      {/* Scan frame overlay */}
      <View style={styles.overlay}>
        {/* Top dark area */}
        <View style={styles.overlayDark} />

        {/* Middle row: dark | frame | dark */}
        <View style={styles.overlayMiddle}>
          <View style={styles.overlayDark} />
          <View style={styles.scanFrame}>
            {/* Corner markers */}
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
          <View style={styles.overlayDark} />
        </View>

        {/* Bottom area with controls */}
        <View style={[styles.overlayDark, styles.bottomControls]}>
          <Text style={styles.scanInstructions}>
            Point your camera at a QR code
          </Text>

          {/* Torch toggle */}
          <Pressable
            onPress={() => setTorchOn((prev) => !prev)}
            style={[
              styles.torchButton,
              torchOn && styles.torchButtonActive,
            ]}
            accessibilityLabel={torchOn ? 'Turn off flashlight' : 'Turn on flashlight'}
            accessibilityRole="button"
          >
            <Text style={styles.torchIcon}>{torchOn ? '🔦' : '💡'}</Text>
            <Text style={[styles.torchText, torchOn && styles.torchTextActive]}>
              {torchOn ? 'Torch On' : 'Torch'}
            </Text>
          </Pressable>

          {/* Manual input toggle */}
          <Pressable
            onPress={() => setShowManualInput((prev) => !prev)}
            style={styles.manualToggle}
            accessibilityLabel="Toggle manual URI input"
            accessibilityRole="button"
          >
            <Text style={styles.manualToggleText}>
              {showManualInput ? 'Hide Manual Input' : 'Enter URI Manually'}
            </Text>
          </Pressable>

          {showManualInput && (
            <View style={styles.manualInputContainer}>
              <TextInput
                style={styles.textInput}
                value={manualUri}
                onChangeText={setManualUri}
                placeholder="openid-credential-offer://..."
                placeholderTextColor="#6B7280"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Manual URI input"
              />
              <Pressable
                onPress={handleManualSubmit}
                style={styles.submitButton}
                accessibilityLabel="Submit URI"
                accessibilityRole="button"
              >
                <Text style={styles.primaryButtonText}>Go</Text>
              </Pressable>
            </View>
          )}

          {/* Cancel */}
          <Pressable
            onPress={() => router.back()}
            style={styles.cancelButton}
            accessibilityLabel="Cancel scanning and go back"
            accessibilityRole="button"
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const FRAME_SIZE = 250;
const CORNER_SIZE = 24;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  titleText: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  messageText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayDark: {
    flex: 1,
    backgroundColor: 'rgba(11, 17, 32, 0.7)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: FRAME_SIZE,
  },
  scanFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.3)',
    borderRadius: 16,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTopLeft: {
    top: -1,
    left: -1,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderTopLeftRadius: 16,
    borderColor: '#14B8A6',
  },
  cornerTopRight: {
    top: -1,
    right: -1,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderTopRightRadius: 16,
    borderColor: '#14B8A6',
  },
  cornerBottomLeft: {
    bottom: -1,
    left: -1,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderBottomLeftRadius: 16,
    borderColor: '#14B8A6',
  },
  cornerBottomRight: {
    bottom: -1,
    right: -1,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderBottomRightRadius: 16,
    borderColor: '#14B8A6',
  },
  bottomControls: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  scanInstructions: {
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 20,
  },
  torchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 16,
    minHeight: 44,
  },
  torchButtonActive: {
    backgroundColor: '#14B8A6',
  },
  torchIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  torchText: {
    color: '#F9FAFB',
    fontSize: 13,
    fontWeight: '500',
  },
  torchTextActive: {
    color: '#0B1120',
  },
  manualToggle: {
    marginBottom: 12,
    minHeight: 44,
    justifyContent: 'center' as const,
  },
  manualToggleText: {
    color: '#14B8A6',
    fontSize: 13,
    fontWeight: '500',
  },
  manualInputContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 12,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1F2937',
    color: '#F9FAFB',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderRadius: 10,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  submitButton: {
    backgroundColor: '#14B8A6',
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  primaryButton: {
    backgroundColor: '#14B8A6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
    minHeight: 44,
    justifyContent: 'center' as const,
  },
  primaryButtonText: {
    color: '#0B1120',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
    minHeight: 44,
    justifyContent: 'center' as const,
  },
  secondaryButtonText: {
    color: '#F9FAFB',
    fontWeight: '500',
    fontSize: 14,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
    justifyContent: 'center' as const,
  },
  cancelText: {
    color: '#6B7280',
    fontSize: 14,
  },
});
