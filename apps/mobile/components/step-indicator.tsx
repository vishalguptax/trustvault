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
      style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 8,
      }}
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${currentStep + 1} of ${steps.length}: ${steps[currentStep]}`}
      accessibilityValue={{ min: 1, max: steps.length, now: currentStep + 1 }}
    >
      {steps.map((step, index) => {
        const isComplete = index < currentStep;
        const isCurrent = index === currentStep;
        const isActive = index <= currentStep;

        return (
          <View key={step} style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Step circle */}
            <View style={{ alignItems: 'center', width: 48 }}>
              <View
                style={{
                  width: 28, height: 28, borderRadius: 14,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: isComplete ? colors.primary : isCurrent ? colors.primary : 'transparent',
                  borderWidth: isCurrent ? 0 : isComplete ? 0 : 1.5,
                  borderColor: colors.border,
                }}
              >
                {isComplete ? (
                  <Ionicons name="checkmark" size={14} color={colors.primaryFg} />
                ) : (
                  <Text style={{
                    fontSize: 12, fontWeight: '700',
                    color: isCurrent ? colors.primaryFg : colors.mutedText,
                  }}>
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text style={{
                fontSize: 10, fontWeight: '600',
                color: isActive ? colors.foreground : colors.mutedText,
                marginTop: 4,
              }} numberOfLines={1}>
                {step}
              </Text>
            </View>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <View style={{
                flex: 1, height: 2, borderRadius: 1,
                backgroundColor: index < currentStep ? colors.primary : colors.border,
                marginHorizontal: -4,
                marginBottom: 16,
              }} />
            )}
          </View>
        );
      })}
    </View>
  );
}
