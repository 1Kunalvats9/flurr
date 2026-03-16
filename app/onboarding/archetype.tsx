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
import { ARCHETYPE_OPTIONS } from '@/constants/onboarding';
import { useUser } from '@/context/UserContext';

export default function ArchetypeScreen() {
  const router = useRouter();
  const { archetype, setArchetype } = useUser();
  const [selected, setSelected] = useState(archetype);
  const [fontsLoaded] = useFonts({
    Playfair_Display_Italic: PlayfairDisplay_400Regular_Italic,
    DM_Sans_400Regular: DMSans_400Regular,
    DM_Sans_500Medium: DMSans_500Medium,
  });

  if (!fontsLoaded) {
    return null;
  }

  const canContinue = selected.length > 0;

  const handleContinue = () => {
    if (!canContinue) {
      return;
    }

    setArchetype(selected);
    router.push('/onboarding/archetype-preference' as never);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/onboarding/presentation-preference' as never);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" translucent={false} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <OnboardingProgressHeader stepLabel="6/9" progress={6 / 9} />

        <OnboardingEntrance>
          <View style={styles.container}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}>
              <Text style={styles.heading}>which vibe(s) best describe you rn?</Text>
              <Text style={styles.formLabel}>Archetype-form</Text>

              <View style={styles.grid}>
                {ARCHETYPE_OPTIONS.map((option) => {
                  const isSelected = selected === option.key;
                  return (
                    <TactilePressable
                      key={option.key}
                      onPress={() => setSelected(option.key)}
                      style={[styles.card, isSelected && styles.cardSelected]}
                      hapticFeedback="selection"
                      pressScale={0.985}>
                      <View style={styles.cardTopRow}>
                        <Text style={styles.cardTitle}>{option.title}</Text>
                        <Ionicons name={option.icon as keyof typeof Ionicons.glyphMap} size={18} color="#1C1612" />
                      </View>
                      <Text style={styles.cardHelper}>{option.helper}</Text>
                      <Text style={styles.cardSubtitle}>{option.subtitle}</Text>
                      <Text style={styles.cardDescription}>{option.description}</Text>
                    </TactilePressable>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.footerWrap}>
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
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 34,
    paddingBottom: 140,
  },
  heading: {
    color: '#1C1612',
    fontFamily: 'Playfair_Display_Italic',
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.2,
    maxWidth: 310,
  },
  formLabel: {
    marginTop: 6,
    color: '#9C988F',
    fontFamily: 'DM_Sans_500Medium',
    fontSize: 14,
  },
  grid: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  card: {
    width: '48%',
    minHeight: 190,
    borderRadius: 16,
    backgroundColor: '#E8E8E8',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardSelected: {
    backgroundColor: '#E4DED3',
    borderColor: '#1C1612',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: {
    color: '#1C1612',
    fontFamily: 'Playfair_Display_Italic',
    fontSize: 30,
    lineHeight: 34,
    textTransform: 'lowercase',
  },
  cardHelper: {
    color: '#7D776F',
    fontFamily: 'DM_Sans_400Regular',
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 10,
  },
  cardSubtitle: {
    color: '#1C1612',
    fontFamily: 'DM_Sans_500Medium',
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 6,
  },
  cardDescription: {
    color: '#1C1612',
    fontFamily: 'DM_Sans_400Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  footerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingBottom: 24,
    backgroundColor: 'rgba(246, 244, 238, 0.94)',
  },
  footer: {
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
    opacity: 0.45,
  },
  continueLabel: {
    color: '#F5F0E8',
    fontFamily: 'DM_Sans_500Medium',
    fontSize: 17,
    letterSpacing: 0.1,
  },
});
