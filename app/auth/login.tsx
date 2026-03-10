import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { PlayfairDisplay_400Regular_Italic } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
import TactilePressable from '@/components/tactile-pressable';
import { useUser } from '@/context/UserContext';

type LoginParams = {
  email?: string | string[];
};

export default function LoginScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<LoginParams>();
  const { signIn, isAuthLoading, authError } = useUser();
  const [email, setEmail] = useState(typeof emailParam === 'string' ? emailParam : '');
  const [password, setPassword] = useState('');
  const [fontsLoaded] = useFonts({
    Playfair_Display_Italic: PlayfairDisplay_400Regular_Italic,
    DM_Sans_400Regular: DMSans_400Regular,
    DM_Sans_500Medium: DMSans_500Medium,
  });

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();
  const isValidEmail = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail), [normalizedEmail]);
  const canContinue = isValidEmail && normalizedPassword.length >= 8 && !isAuthLoading;

  const handleLogin = async () => {
    if (!canContinue) {
      return;
    }

    const result = await signIn(normalizedEmail, normalizedPassword);

    if (!result.ok) {
      if (result.redirectTo === 'signup') {
        router.replace({
          pathname: '/onboarding/email',
          params: {
            email: normalizedEmail,
            intent: 'matchmaking',
          },
        });
      }
      return;
    }

    if (result.onboardingComplete) {
      router.replace('/home');
      return;
    }

    router.replace({
      pathname: '/onboarding/email',
      params: {
        email: normalizedEmail,
        intent: 'matchmaking',
      },
    });
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
              <Text style={styles.heading}>welcome back</Text>
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#9A8F85"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="done"
                style={styles.input}
              />
              {email.length > 0 && !isValidEmail ? <Text style={styles.validationText}>enter a valid email</Text> : null}

              <Text style={styles.label}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="your password"
                placeholderTextColor="#9A8F85"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                returnKeyType="done"
                style={styles.input}
              />
              {password.length > 0 && normalizedPassword.length < 8 ? (
                <Text style={styles.validationText}>password must be at least 8 characters</Text>
              ) : null}
              {authError ? <Text style={styles.validationText}>{authError.toLowerCase()}</Text> : null}
            </View>

            <View style={styles.footer}>
              <TactilePressable onPress={() => router.back()} style={styles.backButton} pressScale={0.96}>
                <Ionicons name="arrow-back" size={22} color="#1C1612" />
              </TactilePressable>

              <TactilePressable
                onPress={handleLogin}
                style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}>
                <Text style={styles.continueLabel}>{isAuthLoading ? 'logging in...' : 'login'}</Text>
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
    fontSize: 54,
    lineHeight: 62,
    letterSpacing: -0.2,
  },
  label: {
    marginTop: 24,
    marginBottom: 10,
    color: '#1C1612',
    fontFamily: 'DM_Sans_400Regular',
    fontSize: 16,
  },
  input: {
    height: 68,
    borderRadius: 18,
    backgroundColor: '#EFEEEA',
    borderWidth: 1,
    borderColor: '#D8D4CC',
    paddingHorizontal: 18,
    color: '#1C1612',
    fontFamily: 'DM_Sans_400Regular',
    fontSize: 20,
  },
  validationText: {
    marginTop: 8,
    color: '#D24764',
    fontFamily: 'DM_Sans_400Regular',
    fontSize: 13,
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
  continueButton: {
    flex: 1,
    height: 68,
    borderRadius: 18,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.45,
  },
  continueLabel: {
    color: '#F5F0E8',
    fontFamily: 'DM_Sans_500Medium',
    fontSize: 17,
    letterSpacing: 0.1,
  },
});
