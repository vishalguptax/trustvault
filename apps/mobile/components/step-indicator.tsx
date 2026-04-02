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
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isActive ? colors.primary : colors.muted,
              }}
              accessibilityLabel={`Step ${index + 1}: ${step}, ${stepState}`}
            >
              {isComplete ? (
                <Ionicons name="checkmark" size={16} color={colors.primaryFg} />
              ) : (
                <Text style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: isActive ? colors.primaryFg : colors.mutedText,
                }}>
                  {index + 1}
                </Text>
              )}
            </View>
            {index < steps.length - 1 && (
              <View style={{
                width: 28,
                height: 3,
                borderRadius: 1.5,
                backgroundColor: index < currentStep ? colors.primary : colors.muted,
              }} />
            )}
          </View>
        );
      })}
    </View>
  );
}
