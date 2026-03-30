import { View, Text } from 'react-native';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <View
      className="flex-row items-center justify-center"
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${currentStep + 1} of ${steps.length}: ${steps[currentStep]}`}
      accessibilityValue={{ min: 1, max: steps.length, now: currentStep + 1 }}
    >
      {steps.map((step, index) => {
        const isComplete = index < currentStep;
        const isCurrent = index === currentStep;
        const stepState = isComplete ? 'complete' : isCurrent ? 'current' : 'upcoming';

        return (
          <View key={step} className="flex-row items-center">
            <View
              className={`w-7 h-7 rounded-full items-center justify-center ${
                index <= currentStep ? 'bg-primary' : 'bg-vault-muted'
              }`}
              accessibilityLabel={`Step ${index + 1}: ${step}, ${stepState}`}
            >
              <Text
                className={`text-xs font-bold ${
                  index <= currentStep ? 'text-vault-bg' : 'text-vault-muted-text'
                }`}
              >
                {index < currentStep ? '✓' : index + 1}
              </Text>
            </View>
            {index < steps.length - 1 && (
              <View
                className={`w-6 h-0.5 ${
                  index < currentStep ? 'bg-primary' : 'bg-vault-muted'
                }`}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}
