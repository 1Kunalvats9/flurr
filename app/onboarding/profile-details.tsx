import { useMemo, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { PlayfairDisplay_400Regular_Italic } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
import OnboardingEntrance from '@/components/onboarding-entrance';
import OnboardingProgressHeader from '@/components/onboarding-progress-header';
import TactilePressable from '@/components/tactile-pressable';
import { useUser } from '@/context/UserContext';

const PRONOUN_POOL = ['they', 'them', 'she/her', 'he/him', 'any'] as const;

export default function ProfileDetailsScreen() {
  const router = useRouter();
  const { profile, setName, setPronouns: setProfilePronouns } = useUser();
  const [firstName, setFirstName] = useState(profile.name || '');
  const [pronouns, setPronouns] = useState<string[]>(
    profile.pronouns
      ? profile.pronouns
          .split('/')
          .map((item) => item.trim())
          .filter(Boolean)
      : ['them', 'they']
  );
  const [customPronoun, setCustomPronoun] = useState('');
  const [fontsLoaded] = useFonts({
    Playfair_Display_Italic: PlayfairDisplay_400Regular_Italic,
    DM_Sans_400Regular: DMSans_400Regular,
    DM_Sans_500Medium: DMSans_500Medium,
  });

  const canContinue = firstName.trim().length >= 2 && pronouns.length > 0;
  const nextPronoun = useMemo(() => PRONOUN_POOL.find((item) => !pronouns.includes(item)), [pronouns]);

  const addPronoun = () => {
    if (!nextPronoun) {
      return;
    }
    setPronouns((prev) => [...prev, nextPronoun]);
  };

  const removePronoun = (target: string) => {
    setPronouns((prev) => prev.filter((item) => item !== target));
  };

  const addCustomPronoun = () => {
    const normalized = customPronoun.trim().toLowerCase();

    if (normalized.length < 2 || pronouns.includes(normalized)) {
      return;
    }

    setPronouns((prev) => [...prev, normalized]);
    setCustomPronoun('');
  };

  const handleContinue = () => {
    if (!canContinue) {
      return;
    }
    setName(firstName.trim());
    setProfilePronouns(pronouns);
    router.push('/onboarding/identity' as never);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/' as never);
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" translucent={false} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <OnboardingProgressHeader stepLabel="1/9" progress={1 / 9} />

        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={Platform.select({ ios: 'padding', android: 'height' })}
          keyboardVerticalOffset={Platform.select({ ios: 10, android: 0 })}>
          <OnboardingEntrance>
            <View style={styles.content}>
              <View>
                <Text style={styles.heading}>what&apos;s ur name &amp; pronouns</Text>
                <Text style={styles.subheading}>this is how we&apos;ll intro u to ur match.</Text>

                <View style={styles.inputCard}>
                  <Text style={styles.inputLabel}>First name</Text>
                  <TextInput
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="June"
                    placeholderTextColor="#9F998F"
                    autoCorrect={false}
                    style={styles.input}
                  />
                  {firstName.trim().length > 0 && firstName.trim().length < 2 ? (
                    <Text style={styles.validationText}>name must be at least 2 characters</Text>
                  ) : null}
                </View>

                <View style={styles.inputCard}>
                  <Text style={styles.inputLabel}>Pronouns</Text>
                  <View style={styles.tagsRow}>
                    {pronouns.map((tag) => (
                      <View key={tag} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                        <Pressable onPress={() => removePronoun(tag)} hitSlop={8}>
                          <Ionicons name="close" size={14} color="#F23862" />
                        </Pressable>
                      </View>
                    ))}

                    <TactilePressable
                      onPress={addPronoun}
                      style={[styles.tagAdd, !nextPronoun && styles.tagAddDisabled]}
                      disabled={!nextPronoun}
                      pressScale={0.98}>
                      <Text style={styles.tagAddText}>+ add</Text>
                    </TactilePressable>
                  </View>

                  <View style={styles.customPronounRow}>
                    <TextInput
                      value={customPronoun}
                      onChangeText={setCustomPronoun}
                      placeholder="type custom pronoun"
                      placeholderTextColor="#9F998F"
                      autoCorrect={false}
                      autoCapitalize="none"
                      style={styles.customPronounInput}
                    />
                    <TactilePressable
                      onPress={addCustomPronoun}
                      style={[styles.customPronounButton, customPronoun.trim().length < 2 && styles.tagAddDisabled]}
                      disabled={customPronoun.trim().length < 2}
                      pressScale={0.98}>
                      <Text style={styles.customPronounButtonText}>add</Text>
                    </TactilePressable>
                  </View>
                </View>
              </View>

              <View style={styles.footer}>
                <TactilePressable onPress={handleBack} style={styles.backButton} pressScale={0.96}>
                  <Ionicons name="arrow-back" size={22} color="#1C1612" />
                </TactilePressable>

                <TactilePressable
                  onPress={handleContinue}
                  style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}>
                  <Text style={styles.continueLabel}>continue</Text>
                </TactilePressable>
              </View>
            </View>
          </OnboardingEntrance>
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
    paddingTop: 56,
    paddingBottom: 24,
  },
  heading: {
    color: '#1C1612',
    fontFamily: 'Playfair_Display_Italic',
    fontSize: 33,
    lineHeight: 44,
    letterSpacing: -0.1,
  },
  subheading: {
    marginTop: 8,
    color: '#1C1612',
    fontFamily: 'DM_Sans_400Regular',
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  inputCard: {
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: '#F2F2F2',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputLabel: {
    color: '#9F998F',
    fontFamily: 'DM_Sans_400Regular',
    fontSize: 11,
    marginBottom: 6,
  },
  input: {
    paddingVertical: 0,
    color: '#1C1612',
    fontFamily: 'DM_Sans_400Regular',
    fontSize: 12,
  },
  validationText: {
    marginTop: 8,
    color: '#D24764',
    fontFamily: 'DM_Sans_400Regular',
    fontSize: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    height: 32,
    borderRadius: 14,
    backgroundColor: '#E9E6DF',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagText: {
    color: '#1C1612',
    fontFamily: 'DM_Sans_500Medium',
    fontSize: 13,
  },
  tagAdd: {
    height: 32,
    borderRadius: 14,
    backgroundColor: '#E9E6DF',
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagAddDisabled: {
    opacity: 0.45,
  },
  tagAddText: {
    color: '#8A8378',
    fontFamily: 'DM_Sans_500Medium',
    fontSize: 12,
  },
  customPronounRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  customPronounInput: {
    flex: 1,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#ECE9E1',
    paddingHorizontal: 10,
    color: '#1C1612',
    fontFamily: 'DM_Sans_400Regular',
    fontSize: 12,
  },
  customPronounButton: {
    height: 34,
    borderRadius: 12,
    backgroundColor: '#E9E6DF',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customPronounButtonText: {
    color: '#8A8378',
    fontFamily: 'DM_Sans_500Medium',
    fontSize: 12,
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
