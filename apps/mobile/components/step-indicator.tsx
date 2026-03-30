import { View, Text } from 'react-native';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <View className="flex-row items-center justify-center">
      {steps.map((step, index) => (
        <View key={step} className="flex-row items-center">
          <View
            className={`w-7 h-7 rounded-full items-center justify-center ${
              index <= currentStep ? 'bg-primary' : 'bg-vault-muted'
            }`}
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
      ))}
    </View>
  );
}
