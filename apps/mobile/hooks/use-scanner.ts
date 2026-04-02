import { useCallback, useRef, useState } from 'react';
import { type BarcodeScanningResult } from 'expo-camera';
import { URI_SCHEME } from '@/lib/routes';

type ScanResult =
  | { type: 'offer'; uri: string }
  | { type: 'verification'; uri: string }
  | { type: 'unknown'; uri: string };

interface UseScannerReturn {
  scanned: boolean;
  scanResult: ScanResult | null;
  handleBarcodeScan: (result: BarcodeScanningResult) => void;
  handleManualUri: (uri: string) => void;
  reset: () => void;
}

function classifyUri(data: string): ScanResult {
  if (data.startsWith(URI_SCHEME.CREDENTIAL_OFFER)) {
    return { type: 'offer', uri: data };
  }
  if (data.startsWith(URI_SCHEME.VERIFICATION) || data.startsWith(URI_SCHEME.VERIFICATION_ALT)) {
    return { type: 'verification', uri: data };
  }
  return { type: 'unknown', uri: data };
}

export function useScanner(): UseScannerReturn {
  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const processingRef = useRef(false);

  const handleBarcodeScan = useCallback((result: BarcodeScanningResult) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setScanned(true);

    const classified = classifyUri(result.data);
    setScanResult(classified);
  }, []);

  const handleManualUri = useCallback((uri: string) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setScanned(true);

    const trimmed = uri.trim();
    if (trimmed.length === 0) {
      processingRef.current = false;
      return;
    }

    const classified = classifyUri(trimmed);
    setScanResult(classified);
  }, []);

  const reset = useCallback(() => {
    processingRef.current = false;
    setScanned(false);
    setScanResult(null);
  }, []);

  return { scanned, scanResult, handleBarcodeScan, handleManualUri, reset };
}
