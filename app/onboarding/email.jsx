import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { PlayfairDisplay_400Regular_Italic } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';

export default function EmailScreen() {
  const router = useRouter();
  const { intent } = useLocalSearchParams();
  const [email, setEmail] = useState('');
  const [fontsLoaded] = useFonts({
    Playfair_Display_Italic: PlayfairDisplay_400Regular_Italic,
    DM_Sans_400Regular: DMSans_400Regular,
    DM_Sans_500Medium: DMSans_500Medium,
  });

  const canContinue = email.trim().length > 0;

  const handleContinue = () => {
    if (!canContinue) {
      return;
    }

    router.push({
      pathname: '/onboarding/code',
      params: {
        email: email.trim(),
        intent: typeof intent === 'string' ? intent : 'matchmaking',
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
              <Text style={styles.heading}>enter your email</Text>
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
            </View>

            <View style={styles.footer}>
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={22} color="#1C1612" />
              </Pressable>

              <Pressable
                onPress={handleContinue}
                style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}>
                <Text style={styles.continueLabel}>continue</Text>
              </Pressable>
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
    marginTop: 44,
    marginBottom: 10,
    color: '#1C1612',
    fontFamily: 'DM_Sans_400Regular',
    fontSize: 32 / 2,
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
