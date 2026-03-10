import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_900Black,
} from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
import { useUser } from '@/context/UserContext';

const BG_IMAGE = require('../assets/images/background.png');

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isAuthReady } = useUser();
  const { width } = useWindowDimensions();
  const [fontsLoaded] = useFonts({
    Playfair_Display_Black: PlayfairDisplay_900Black,
    Playfair_Display_Italic: PlayfairDisplay_400Regular_Italic,
    DM_Sans_400Regular: DMSans_400Regular,
    DM_Sans_500Medium: DMSans_500Medium,
  });

  const bgScale = useRef(new Animated.Value(1.04)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleX = useRef(new Animated.Value(-30)).current;
  const forTheOpacity = useRef(new Animated.Value(0)).current;
  const forTheY = useRef(new Animated.Value(16)).current;
  const subtextOpacity = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsY = useRef(new Animated.Value(30)).current;
  const signUpScale = useRef(new Animated.Value(1)).current;
  const loginScale = useRef(new Animated.Value(1)).current;
  const availableTitleWidth = width - 20;
  const titleFontSize = Math.round(Math.min(108, Math.max(82, availableTitleWidth / 4)));
  const titleLineHeight = Math.round(titleFontSize * 1.32);

  useEffect(() => {
    const entrance = Animated.parallel([
      Animated.timing(bgScale, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(titleX, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          Animated.timing(forTheOpacity, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(forTheY, {
            toValue: 0,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(subtextOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(500),
        Animated.parallel([
          Animated.timing(buttonsOpacity, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.back(1.1)),
            useNativeDriver: true,
          }),
          Animated.timing(buttonsY, {
            toValue: 0,
            duration: 500,
            easing: Easing.out(Easing.back(1.1)),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]);

    entrance.start();

    return () => {
      entrance.stop();
    };
  }, [
    bgScale,
    titleOpacity,
    titleX,
    forTheOpacity,
    forTheY,
    subtextOpacity,
    buttonsOpacity,
    buttonsY,
  ]);

  useEffect(() => {
    if (!isAuthReady || !isAuthenticated) {
      return;
    }

    const timer = setTimeout(() => {
      router.replace('/home');
    }, 450);

    return () => clearTimeout(timer);
  }, [isAuthReady, isAuthenticated, router]);

  const pressIn = (scaleValue: Animated.Value, toValue: number) => {
    Animated.spring(scaleValue, {
      toValue,
      speed: 32,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  };

  const pressOut = (scaleValue: Animated.Value) => {
    Animated.spring(scaleValue, {
      toValue: 1,
      speed: 20,
      bounciness: 8,
      useNativeDriver: true,
    }).start();
  };

  const handleSignUpPress = () => {
    router.push('/onboarding/intentions');
  };

  const handleLoginPress = () => {
    router.push('/auth/login');
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" translucent />

      <Animated.View style={[styles.background, { transform: [{ scale: bgScale }] }]}>
        <ImageBackground source={BG_IMAGE} style={styles.image} resizeMode="cover" />
      </Animated.View>

      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.78)']}
        locations={[0, 0.35, 1]}
        style={styles.gradient}
      />

      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.content}>
          <View style={styles.titleBlock}>
            <Animated.Text
              adjustsFontSizeToFit
              allowFontScaling={false}
              maxFontSizeMultiplier={1}
              minimumFontScale={0.4}
              numberOfLines={1}
              ellipsizeMode="clip"
              style={[
                styles.title,
                {
                  fontSize: titleFontSize,
                  lineHeight: titleLineHeight,
                },
                {
                  opacity: titleOpacity,
                  transform: [{ translateX: titleX }],
                },
              ]}>
              FLURR
            </Animated.Text>

            <Animated.Text
              style={[
                styles.forThe,
                {
                  opacity: forTheOpacity,
                  transform: [{ translateY: forTheY }],
                },
              ]}>
              for the
            </Animated.Text>
          </View>

          <View style={styles.lowerSection}>
            <Animated.Text style={[styles.subtext, { opacity: subtextOpacity }]}>
              soft queers, shy bois, femmes who flirt with their eyes, etc.
            </Animated.Text>

            {isAuthReady && !isAuthenticated ? (
              <Animated.View
                style={[
                  styles.buttons,
                  {
                    opacity: buttonsOpacity,
                    transform: [{ translateY: buttonsY }],
                  },
                ]}>
                <TouchableWithoutFeedback
                  onPress={handleSignUpPress}
                  onPressIn={() => pressIn(signUpScale, 0.97)}
                  onPressOut={() => pressOut(signUpScale)}>
                  <Animated.View style={[styles.signUpButton, { transform: [{ scale: signUpScale }] }]}>
                    <Text style={styles.signUpText}>Sign up</Text>
                  </Animated.View>
                </TouchableWithoutFeedback>

                <TouchableWithoutFeedback
                  onPress={handleLoginPress}
                  onPressIn={() => pressIn(loginScale, 0.98)}
                  onPressOut={() => pressOut(loginScale)}>
                  <Animated.View style={[styles.loginButton, { transform: [{ scale: loginScale }] }]}>
                    <Text style={styles.loginText}>Coming back to see us? Login</Text>
                  </Animated.View>
                </TouchableWithoutFeedback>
              </Animated.View>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1C1612',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    flex: 1,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleBlock: {
    paddingTop: 86,
    alignItems: 'center',
  },
  title: {
    width: '100%',
    paddingHorizontal: 8,
    textAlign: 'center',
    fontFamily: 'Playfair_Display_Black',
    letterSpacing: -1.2,
    color: '#F5F0E8',
  },
  forThe: {
    width: '100%',
    marginTop: 2,
    textAlign: 'center',
    fontFamily: 'Playfair_Display_Italic',
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: 0.2,
    color: '#F5F0E8',
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  lowerSection: {
    width: '100%',
    alignItems: 'center',
  },
  subtext: {
    maxWidth: 280,
    marginBottom: 26,
    textAlign: 'center',
    fontFamily: 'DM_Sans_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#F5F0E8',
  },
  buttons: {
    width: '100%',
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 10,
  },
  signUpButton: {
    height: 56,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0EBE0',
  },
  signUpText: {
    fontFamily: 'DM_Sans_500Medium',
    fontSize: 16,
    color: '#1C1612',
  },
  loginButton: {
    height: 56,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(80, 70, 60, 0.6)',
  },
  loginText: {
    fontFamily: 'DM_Sans_400Regular',
    fontSize: 15,
    color: '#F5F0E8',
  },
});
