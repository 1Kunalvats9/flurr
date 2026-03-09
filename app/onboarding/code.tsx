import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { PlayfairDisplay_400Regular_Italic } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
import TactilePressable from '@/components/tactile-pressable';

const OTP_LENGTH = 4;

export default function CodeScreen() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Playfair_Display_Italic: PlayfairDisplay_400Regular_Italic,
    DM_Sans_400Regular: DMSans_400Regular,
    DM_Sans_500Medium: DMSans_500Medium,
  });

  const [digits, setDigits] = useState<string[]>(Array.from({ length: OTP_LENGTH }, () => ''));
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 250);

    return () => clearTimeout(timer);
  }, []);

  const updateDigits = (nextDigits: string[]) => {
    setDigits(nextDigits);
  };

  const handleChangeText = (index: number, rawValue: string) => {
    const value = rawValue.replace(/\D/g, '');
    const nextDigits = [...digits];

    if (value.length === 0) {
      nextDigits[index] = '';
      updateDigits(nextDigits);
      return;
    }

    if (value.length > 1) {
      const chunk = value.slice(0, OTP_LENGTH - index).split('');
      chunk.forEach((char, offset) => {
        nextDigits[index + offset] = char;
      });
      updateDigits(nextDigits);

      const nextFocus = Math.min(index + chunk.length, OTP_LENGTH - 1);
      inputRefs.current[nextFocus]?.focus();
      setActiveIndex(nextFocus);
      return;
    }

    nextDigits[index] = value;
    updateDigits(nextDigits);

    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }
  };

  const handleKeyPress = (index: number, event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (event.nativeEvent.key !== 'Backspace') {
      return;
    }

    if (digits[index] !== '') {
      const nextDigits = [...digits];
      nextDigits[index] = '';
      updateDigits(nextDigits);
      return;
    }

    if (index > 0) {
      const nextDigits = [...digits];
      nextDigits[index - 1] = '';
      updateDigits(nextDigits);
      inputRefs.current[index - 1]?.focus();
      setActiveIndex(index - 1);
    }
  };

  const handleVerify = () => {
    router.push('/onboarding/profile-details');
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" translucent={false} />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={Platform.select({ ios: 'padding', android: 'height' })}
          keyboardVerticalOffset={Platform.select({ ios: 10, android: 0 })}>
          <View style={styles.content}>
            <View>
              <Text style={styles.heading}>enter your code</Text>
              <Text style={styles.label}>Code number</Text>

              <View style={styles.codeRow}>
                {digits.map((digit, index) => {
                  const isActive = activeIndex === index;
                  return (
                    <Pressable
                      key={`code-${index}`}
                      onPress={() => {
                        inputRefs.current[index]?.focus();
                        setActiveIndex(index);
                      }}
                      style={[styles.codeBox, isActive && styles.codeBoxActive]}>
                      <TextInput
                        ref={(ref) => {
                          inputRefs.current[index] = ref;
                        }}
                        value={digit}
                        onChangeText={(text) => handleChangeText(index, text)}
                        onKeyPress={(event) => handleKeyPress(index, event)}
                        onFocus={() => setActiveIndex(index)}
                        keyboardType={Platform.select({ ios: 'number-pad', android: 'numeric' })}
                        maxLength={OTP_LENGTH}
                        selectionColor="#FF335F"
                        placeholder="1"
                        placeholderTextColor="#99958F"
                        textAlign="center"
                        style={styles.codeInput}
                        textContentType="oneTimeCode"
                        autoComplete="sms-otp"
                      />
                    </Pressable>
                  );
                })}
              </View>

              <TactilePressable
                onPress={() => inputRefs.current[0]?.focus()}
                style={styles.resendWrap}
                pressScale={0.98}>
                <Text style={styles.resendText}>Resend code</Text>
              </TactilePressable>
            </View>

            <View style={styles.footer}>
              <TactilePressable onPress={() => router.back()} style={styles.backButton} pressScale={0.96}>
                <Ionicons name="arrow-back" size={22} color="#1C1612" />
              </TactilePressable>

              <TactilePressable onPress={handleVerify} style={styles.verifyButton}>
                <Text style={styles.verifyLabel}>Verify code</Text>
              </TactilePressable>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  keyboard: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 108,
    paddingBottom: 24,
  },
  heading: {
    color: '#1C1612',
    fontFamily: 'Playfair_Display_Italic',
    fontSize: 56,
    lineHeight: 64,
    letterSpacing: -0.2,
  },
  label: {
    marginTop: 44,
    marginBottom: 12,
    color: '#1C1612',
    fontFamily: 'DM_Sans_400Regular',
    fontSize: 16,
  },
  codeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  codeBox: {
    width: 77,
    height: 72,
    borderRadius: 18,
    backgroundColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  codeBoxActive: {
    borderColor: '#1C1612',
  },
  codeInput: {
    width: '100%',
    height: '100%',
    color: '#1C1612',
    fontFamily: 'DM_Sans_500Medium',
    fontSize: 17,
  },
  resendWrap: {
    marginTop: 30,
    alignSelf: 'flex-start',
  },
  resendText: {
    color: '#FF2B56',
    fontFamily: 'DM_Sans_500Medium',
    fontSize: 17,
  },
  footer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backButton: {
    width: 76,
    height: 68,
    borderRadius: 18,
    backgroundColor: '#EDEAE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButton: {
    flex: 1,
    height: 68,
    borderRadius: 18,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyLabel: {
    color: '#F5F0E8',
    fontFamily: 'DM_Sans_500Medium',
    fontSize: 17,
    letterSpacing: 0.1,
  },
});
