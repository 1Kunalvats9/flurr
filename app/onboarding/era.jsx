import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { PlayfairDisplay_400Regular_Italic } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
import OnboardingProgressHeader from '@/components/onboarding-progress-header';

const ERA_OPTIONS = [
  { key: 'gen_z', label: '2010s+ (gen z)' },
  { key: 'zillenial', label: 'on the cusp (zillenial)' },
  { key: 'millennial', label: '30+ (solid millenial,\naka late 90s)' },
];

const THUMB_WIDTH = 38;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default function EraScreen() {
  const router = useRouter();
  const [eraIndex, setEraIndex] = useState(0);
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
    (index) => {
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

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          dragStart.current = positionForIndex(eraIndex);
        },
        onPanResponderMove: (_, gesture) => {
          const nextX = clamp(dragStart.current + gesture.dx, 0, maxThumbX);
          thumbX.setValue(nextX);
        },
        onPanResponderRelease: (_, gesture) => {
          const releasedX = clamp(dragStart.current + gesture.dx, 0, maxThumbX);
          const ratio = maxThumbX === 0 ? 0 : releasedX / maxThumbX;
          const nextIndex = Math.round(ratio * (ERA_OPTIONS.length - 1));
          setEraIndex(nextIndex);
        },
        onPanResponderTerminate: (_, gesture) => {
          const releasedX = clamp(dragStart.current + gesture.dx, 0, maxThumbX);
          const ratio = maxThumbX === 0 ? 0 : releasedX / maxThumbX;
          const nextIndex = Math.round(ratio * (ERA_OPTIONS.length - 1));
          setEraIndex(nextIndex);
        },
      }),
    [eraIndex, maxThumbX, positionForIndex, thumbX]
  );

  const handleTrackPress = (locationX) => {
    if (ERA_OPTIONS.length <= 1) {
      setEraIndex(0);
      return;
    }
    const nextX = clamp(locationX - THUMB_WIDTH / 2, 0, maxThumbX);
    const ratio = maxThumbX === 0 ? 0 : nextX / maxThumbX;
    const nextIndex = Math.round(ratio * (ERA_OPTIONS.length - 1));
    setEraIndex(nextIndex);
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" translucent={false} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <OnboardingProgressHeader stepLabel="5/8" progress={5 / 8} />

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
                  <Pressable
                    key={option.key}
                    style={[styles.dot, { left: dotX + THUMB_WIDTH / 2 - 3 }]}
                    onPress={() => setEraIndex(index)}
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
                <Pressable
                  key={option.key}
                  onPress={() => setEraIndex(index)}
                  style={styles.labelBlock}>
                  <Text style={styles.labelText}>{option.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.footer}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color="#1C1612" />
            </Pressable>

            <Pressable onPress={() => router.push('/home')} style={styles.continueButton}>
              <Text style={styles.continueLabel}>continue</Text>
            </Pressable>
          </View>
        </View>
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
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 24,
  },
  heading: {
    color: '#1C1612',
    fontFamily: 'Playfair_Display_Italic',
    fontSize: 66 / 2,
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
    gap: 6,
  },
  labelBlock: {
    flex: 1,
  },
  labelText: {
    color: '#1C1612',
    fontFamily: 'DM_Sans_400Regular',
    fontSize: 21 / 2,
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
  continueLabel: {
    color: '#F5F0E8',
    fontFamily: 'DM_Sans_500Medium',
    fontSize: 17,
    letterSpacing: 0.1,
  },
});
