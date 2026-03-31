import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${currentStep + 1} of ${steps.length}: ${steps[currentStep]}`}
      accessibilityValue={{ min: 1, max: steps.length, now: currentStep + 1 }}
    >
      {steps.map((step, index) => {
        const isComplete = index < currentStep;
        const isCurrent = index === currentStep;
        const isActive = index <= currentStep;
        const stepState = isComplete ? 'complete' : isCurrent ? 'current' : 'upcoming';

        return (
          <View key={step} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isActive ? colors.primary : colors.muted,
              }}
              accessibilityLabel={`Step ${index + 1}: ${step}, ${stepState}`}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: '700',
                color: isActive ? colors.primaryFg : colors.mutedText,
              }}>
{isComplete ? <Ionicons name="checkmark" size={14} color={colors.primaryFg} /> : <Text style={{ fontSize: 12, fontWeight: '700', color: isActive ? colors.primaryFg : colors.mutedText }}>{index + 1}</Text>}
              </Text>
            </View>
            {index < steps.length - 1 && (
              <View style={{
                width: 24,
                height: 2,
                backgroundColor: index < currentStep ? colors.primary : colors.muted,
              }} />
            )}
          </View>
        );
      })}
    </View>
  );
}
