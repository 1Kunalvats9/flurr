import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { PlayfairDisplay_400Regular_Italic } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
import * as Haptics from 'expo-haptics';
import OnboardingEntrance from '@/components/onboarding-entrance';
import OnboardingProgressHeader from '@/components/onboarding-progress-header';
import TactilePressable from '@/components/tactile-pressable';
import { useUser } from '@/context/UserContext';

type EraOption = {
  key: string;
  label: string;
};

const ERA_OPTIONS: EraOption[] = [
  { key: 'gen_z', label: '2010s+ (gen z)' },
  { key: 'zillenial', label: 'on the cusp (zillenial)' },
  { key: 'millennial', label: '30+ (solid millenial,\naka late 90s)' },
];

const THUMB_WIDTH = 38;
const ERA_VALUES = [25, 50, 75];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default function EraScreen() {
  const router = useRouter();
  const { profile, completeOnboarding, isCompletingOnboarding, onboardingError } = useUser();
  const [eraIndex, setEraIndex] = useState(() => {
    const target = Number(profile.era || 50);
    let nearestIndex = 0;
    let nearestDiff = Number.POSITIVE_INFINITY;

    ERA_VALUES.forEach((value, index) => {
      const diff = Math.abs(value - target);
      if (diff < nearestDiff) {
        nearestDiff = diff;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  });
  const [trackWidth, setTrackWidth] = useState(0);
  const [fontsLoaded] = useFonts({
    Playfair_Display_Italic: PlayfairDisplay_400Regular_Italic,
    DM_Sans_400Regular: DMSans_400Regular,
    DM_Sans_500Medium: DMSans_500Medium,
  });

  const thumbX = useRef(new Animated.Value(0)).current;
  const dragStart = useRef(0);

  const maxThumbX = Math.max(0, trackWidth - THUMB_WIDTH);

  const positionForIndex = useCallback(
    (index: number) => {
      if (ERA_OPTIONS.length <= 1 || maxThumbX === 0) {
        return 0;
      }
      return (index / (ERA_OPTIONS.length - 1)) * maxThumbX;
    },
    [maxThumbX]
  );

  useEffect(() => {
    Animated.spring(thumbX, {
      toValue: positionForIndex(eraIndex),
      speed: 20,
      bounciness: 8,
      useNativeDriver: true,
    }).start();
  }, [eraIndex, positionForIndex, thumbX]);

  const settleToNearest = useCallback(
    (releasedX: number) => {
      const ratio = maxThumbX === 0 ? 0 : releasedX / maxThumbX;
      const nextIndex = Math.round(ratio * (ERA_OPTIONS.length - 1));
      if (nextIndex !== eraIndex) {
        Haptics.selectionAsync();
        setEraIndex(nextIndex);
      }
    },
    [maxThumbX, eraIndex]
  );

  const handleSetEraIndex = (index: number) => {
    if (index !== eraIndex) {
      Haptics.selectionAsync();
      setEraIndex(index);
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          dragStart.current = positionForIndex(eraIndex);
        },
        onPanResponderMove: (_: GestureResponderEvent, gesture: PanResponderGestureState) => {
          const nextX = clamp(dragStart.current + gesture.dx, 0, maxThumbX);
          thumbX.setValue(nextX);
        },
        onPanResponderRelease: (_: GestureResponderEvent, gesture: PanResponderGestureState) => {
          const releasedX = clamp(dragStart.current + gesture.dx, 0, maxThumbX);
          settleToNearest(releasedX);
        },
        onPanResponderTerminate: (_: GestureResponderEvent, gesture: PanResponderGestureState) => {
          const releasedX = clamp(dragStart.current + gesture.dx, 0, maxThumbX);
          settleToNearest(releasedX);
        },
      }),
    [eraIndex, maxThumbX, positionForIndex, settleToNearest, thumbX]
  );

  const handleTrackPress = (locationX: number) => {
    if (ERA_OPTIONS.length <= 1) {
      setEraIndex(0);
      return;
    }
    const nextX = clamp(locationX - THUMB_WIDTH / 2, 0, maxThumbX);
    settleToNearest(nextX);
  };

  if (!fontsLoaded) {
    return null;
  }

  const handleContinue = async () => {
    if (isCompletingOnboarding) {
      return;
    }

    const selectedEra = ERA_VALUES[eraIndex] ?? 50;
    await completeOnboarding(selectedEra);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" translucent={false} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <OnboardingProgressHeader stepLabel="9/9" progress={9 / 9} />

        <OnboardingEntrance>
          <View style={styles.content}>
            <View>
              <Text style={styles.heading}>whats ur era?</Text>

              <Pressable
                onPress={(event) => handleTrackPress(event.nativeEvent.locationX)}
                style={styles.sliderArea}
                onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}>
                <View style={styles.sliderTrack} />

                {ERA_OPTIONS.map((option, index) => {
                  const dotX = maxThumbX <= 0 ? 0 : (index / (ERA_OPTIONS.length - 1)) * maxThumbX;
                  return (
                    <TactilePressable
                      key={option.key}
                      style={[styles.dot, { left: dotX + THUMB_WIDTH / 2 - 3 }]}
                      onPress={() => handleSetEraIndex(index)}
                      hapticFeedback="selection"
                    />
                  );
                })}

                <Animated.View
                  {...panResponder.panHandlers}
                  style={[styles.sliderThumb, { transform: [{ translateX: thumbX }] }]}
                />
              </Pressable>

              <View style={styles.labelRow}>
                {ERA_OPTIONS.map((option, index) => (
                  <TactilePressable key={option.key} onPress={() => handleSetEraIndex(index)} style={styles.labelBlock} pressScale={0.96} hapticFeedback="selection">
                    <Text style={styles.labelText}>{option.label}</Text>
                  </TactilePressable>
                ))}
              </View>
            </View>

            <View style={styles.footer}>
              <TactilePressable onPress={() => router.back()} style={styles.backButton} pressScale={0.96}>
                <Ionicons name="arrow-back" size={22} color="#1C1612" />
              </TactilePressable>

              <TactilePressable
                onPress={handleContinue}
                style={[styles.continueButton, isCompletingOnboarding && styles.continueButtonDisabled]}>
                <Text style={styles.continueLabel}>{isCompletingOnboarding ? 'saving...' : 'continue'}</Text>
              </TactilePressable>
            </View>
            {onboardingError ? <Text style={styles.errorText}>{onboardingError}</Text> : null}
          </View>
        </OnboardingEntrance>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F6F4EE',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 24,
  },
  heading: {
    color: '#1C1612',
    fontFamily: 'Playfair_Display_Italic',
    fontSize: 33,
    lineHeight: 44,
    letterSpacing: -0.15,
  },
  sliderArea: {
    marginTop: 56,
    height: 34,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 12,
    borderRadius: 8,
    backgroundColor: '#E0DDD7',
    width: '100%',
  },
  dot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CFCBC3',
    top: 14,
  },
  sliderThumb: {
    position: 'absolute',
    left: 0,
    width: THUMB_WIDTH,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#000000',
    top: 2,
  },
  labelRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  labelBlock: {
    flex: 1,
  },
  labelText: {
    color: '#1C1612',
    fontFamily: 'DM_Sans_400Regular',
    fontSize: 10.5,
    lineHeight: 15,
  },
  footer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 60,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#EDEAE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueLabel: {
    color: '#F5F0E8',
    fontFamily: 'DM_Sans_500Medium',
    fontSize: 17,
    letterSpacing: 0.1,
  },
  errorText: {
    marginTop: 12,
    color: '#D24764',
    fontFamily: 'DM_Sans_400Regular',
    fontSize: 13,
    textAlign: 'center',
  },
});
