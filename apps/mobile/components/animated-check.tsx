import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';

interface AnimatedCheckProps {
  variant: 'success' | 'rejection';
  size?: number;
}

export function AnimatedCheck({ variant, size = 80 }: AnimatedCheckProps) {
  const circleScale = useSharedValue(0);
  const iconOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0.3);

  const isSuccess = variant === 'success';
  const circleColor = isSuccess ? '#10B981' : '#EF4444';
  const circleBgColor = isSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';

  useEffect(() => {
    circleScale.value = withSpring(1, { damping: 12, stiffness: 180 });
    iconOpacity.value = withDelay(
      300,
      withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) }),
    );
    iconScale.value = withDelay(
      300,
      withSequence(
        withSpring(1.2, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 10, stiffness: 150 }),
      ),
    );
  }, [circleScale, iconOpacity, iconScale]);

  const circleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
    opacity: interpolate(circleScale.value, [0, 0.5, 1], [0, 0.8, 1]),
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: circleBgColor,
          alignItems: 'center',
          justifyContent: 'center',
        },
        circleAnimatedStyle,
      ]}
      accessibilityLabel={isSuccess ? 'Success checkmark' : 'Rejection indicator'}
      accessibilityRole="image"
    >
      <Animated.View
        style={[
          {
            width: size * 0.6,
            height: size * 0.6,
            borderRadius: (size * 0.6) / 2,
            backgroundColor: circleColor,
            alignItems: 'center',
            justifyContent: 'center',
          },
          iconAnimatedStyle,
        ]}
      >
        {isSuccess ? (
          <CheckmarkIcon size={size * 0.3} />
        ) : (
          <RejectionIcon size={size * 0.3} />
        )}
      </Animated.View>
    </Animated.View>
  );
}

function CheckmarkIcon({ size }: { size: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={styles.checkContainer}>
        <View
          style={[
            styles.checkShort,
            {
              width: size * 0.4,
              height: size * 0.15,
              bottom: size * 0.2,
              left: size * 0.05,
            },
          ]}
        />
        <View
          style={[
            styles.checkLong,
            {
              width: size * 0.7,
              height: size * 0.15,
              bottom: size * 0.25,
              left: size * 0.2,
            },
          ]}
        />
      </View>
    </View>
  );
}

function RejectionIcon({ size }: { size: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={[
          styles.xLine,
          {
            width: size * 0.8,
            height: size * 0.15,
            transform: [{ rotate: '45deg' }],
          },
        ]}
      />
      <View
        style={[
          styles.xLine,
          {
            width: size * 0.8,
            height: size * 0.15,
            transform: [{ rotate: '-45deg' }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  checkContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  checkShort: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  checkLong: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    transform: [{ rotate: '-45deg' }],
  },
  xLine: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
});
