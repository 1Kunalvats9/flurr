import { type ReactNode, useRef } from 'react';
import {
  Animated,
  Pressable,
  type GestureResponderEvent,
  type Insets,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';

type TactilePressableProps = Omit<PressableProps, 'style'> & {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  pressScale?: number;
  hitSlop?: Insets | number;
  onPressIn?: (event: GestureResponderEvent) => void;
  onPressOut?: (event: GestureResponderEvent) => void;
  hapticFeedback?: 'light' | 'medium' | 'heavy' | 'selection' | 'none';
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function TactilePressable({
  children,
  onPress,
  style,
  disabled = false,
  pressScale = 0.97,
  hitSlop,
  onPressIn,
  onPressOut,
  hapticFeedback = 'light',
  ...rest
}: TactilePressableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number, speed: number, bounciness: number) => {
    Animated.spring(scale, {
      toValue,
      speed,
      bounciness,
      useNativeDriver: true,
    }).start();
  };

  const triggerHaptic = () => {
    if (disabled || hapticFeedback === 'none') return;
    
    if (hapticFeedback === 'selection') {
      Haptics.selectionAsync();
    } else {
      let impactStyle = Haptics.ImpactFeedbackStyle.Light;
      if (hapticFeedback === 'medium') impactStyle = Haptics.ImpactFeedbackStyle.Medium;
      if (hapticFeedback === 'heavy') impactStyle = Haptics.ImpactFeedbackStyle.Heavy;
      Haptics.impactAsync(impactStyle);
    }
  };

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPress={onPress}
      hitSlop={hitSlop}
      onPressIn={(event) => {
        animateTo(pressScale, 34, 0);
        triggerHaptic();
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animateTo(1, 24, 8);
        onPressOut?.(event);
      }}
      style={[style, { transform: [{ scale }] }]}>
      {children}
    </AnimatedPressable>
  );
}
