import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { PRESENTATION_OPTIONS } from '@/constants/onboarding';
import { useUser } from '@/context/UserContext';

export default function PresentationPreferenceScreen() {
  const router = useRouter();
  const { presentationPreferences, setPresentationPreferences } = useUser();
  const [selected, setSelected] = useState<string[]>(presentationPreferences);
  const [fontsLoaded] = useFonts({
    Playfair_Display_Italic: PlayfairDisplay_400Regular_Italic,
    DM_Sans_400Regular: DMSans_400Regular,
    DM_Sans_500Medium: DMSans_500Medium,
  });

  if (!fontsLoaded) {
    return null;
  }

  const canContinue = selected.length > 0;

  const toggleSelection = (value: string) => {
    setSelected((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const handleContinue = () => {
    if (!canContinue) {
      return;
    }

    setPresentationPreferences(selected);
    router.push('/onboarding/archetype' as never);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/onboarding/presentation' as never);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" translucent={false} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <OnboardingProgressHeader stepLabel="5/9" progress={5 / 9} />

        <OnboardingEntrance>
          <View style={styles.content}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <Text style={styles.heading}>which presentation(s) are you most drawn to?</Text>

              <View style={styles.chipWrap}>
                {PRESENTATION_OPTIONS.map((option) => {
                  const isSelected = selected.includes(option.value);
                  return (
                    <TactilePressable
                      key={option.value}
                      onPress={() => toggleSelection(option.value)}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      hapticFeedback="selection"
                      pressScale={0.97}>
                      <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>{option.label}</Text>
                    </TactilePressable>
                  );
                })}
              </View>
            </ScrollView>

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
    paddingTop: 40,
    paddingBottom: 24,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heading: {
    color: '#1C1612',
    fontFamily: 'Playfair_Display_Italic',
    fontSize: 40,
    lineHeight: 50,
    letterSpacing: -0.2,
    maxWidth: 350,
  },
  chipWrap: {
    marginTop: 34,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    minHeight: 64,
    borderRadius: 20,
    backgroundColor: '#EDEAE4',
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: '#E8E3D8',
    borderColor: '#1C1612',
  },
  chipLabel: {
    color: '#1C1612',
    fontFamily: 'DM_Sans_500Medium',
    fontSize: 15,
  },
  chipLabelSelected: {
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
