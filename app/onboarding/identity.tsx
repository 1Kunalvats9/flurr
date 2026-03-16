import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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

export default function IdentityScreen() {
  const router = useRouter();
  const { isBipoc, setIsBipoc } = useUser();
  const [selected, setSelected] = useState<boolean | null>(isBipoc);
  const [fontsLoaded] = useFonts({
    Playfair_Display_Italic: PlayfairDisplay_400Regular_Italic,
    DM_Sans_400Regular: DMSans_400Regular,
    DM_Sans_500Medium: DMSans_500Medium,
  });

  if (!fontsLoaded) {
    return null;
  }

  const canContinue = selected !== null;

  const handleContinue = () => {
    if (selected === null) {
      return;
    }

    setIsBipoc(selected);
    router.push('/onboarding/intentions');
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/onboarding/profile-details' as never);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" translucent={false} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <OnboardingProgressHeader stepLabel="2/9" progress={2 / 9} />

        <OnboardingEntrance>
          <View style={styles.content}>
            <View>
              <Text style={styles.heading}>do you identify as BIPOC?</Text>

              <View style={styles.optionRow}>
                {[
                  { label: 'Yes', value: true },
                  { label: 'No', value: false },
                ].map((option) => {
                  const isSelected = selected === option.value;
                  return (
                    <TactilePressable
                      key={option.label}
                      onPress={() => setSelected(option.value)}
                      style={[styles.optionPill, isSelected && styles.optionPillSelected]}
                      hapticFeedback="selection"
                      pressScale={0.96}>
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{option.label}</Text>
                    </TactilePressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.footer}>
              <TactilePressable onPress={handleBack} style={styles.backButton} pressScale={0.96}>
                <Ionicons name="arrow-back" size={22} color="#1C1612" />
              </TactilePressable>
              <TactilePressable
                onPress={handleContinue}
                style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
                disabled={!canContinue}>
                <Text style={styles.continueLabel}>continue</Text>
              </TactilePressable>
            </View>
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
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 24,
  },
  heading: {
    color: '#1C1612',
    fontFamily: 'Playfair_Display_Italic',
    fontSize: 44,
    lineHeight: 54,
    letterSpacing: -0.2,
    maxWidth: 340,
  },
  optionRow: {
    marginTop: 48,
    flexDirection: 'row',
    gap: 12,
  },
  optionPill: {
    minWidth: 72,
    minHeight: 68,
    borderRadius: 20,
    backgroundColor: '#EDEAE4',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionPillSelected: {
    backgroundColor: '#E8E3D8',
    borderColor: '#1C1612',
  },
  optionText: {
    color: '#1C1612',
    fontFamily: 'DM_Sans_500Medium',
    fontSize: 16,
  },
  optionTextSelected: {
    color: '#121212',
  },
  footer: {
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
