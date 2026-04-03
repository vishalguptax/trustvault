import { Ionicons } from '@expo/vector-icons';

interface TrustiLockLogoProps {
  size?: number;
  color: string;
}

export function TrustiLockLogo({ size = 32, color }: TrustiLockLogoProps) {
  return <Ionicons name="shield-checkmark" size={size} color={color} />;
}
