import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { PlayfairDisplay_400Regular_Italic } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
import TactilePressable from '@/components/tactile-pressable';
import { useUser } from '@/context/UserContext';

type IntentType = 'matchmaking' | 'organizer';

export default function IntentionsScreen() {
  const router = useRouter();
  const { intentions, setIntentions } = useUser();
  const [intent, setIntent] = useState<IntentType>(
    intentions[0] === 'organizer' ? 'organizer' : 'matchmaking'
  );
  const [fontsLoaded] = useFonts({
    Playfair_Display_Italic: PlayfairDisplay_400Regular_Italic,
    DM_Sans_400Regular: DMSans_400Regular,
    DM_Sans_500Medium: DMSans_500Medium,
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleContinue = () => {
    setIntentions([intent]);
    router.push({
      pathname: '/onboarding/email',
      params: { intent },
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" translucent={false} />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <View>
            <Text style={styles.heading}>what are your intentions?</Text>

            <View style={styles.optionRow}>
              <TactilePressable
                onPress={() => setIntent('matchmaking')}
                style={[styles.optionButton, intent === 'matchmaking' && styles.optionButtonSelected]}>
                <Text
                  style={[
                    styles.optionLabel,
                    intent === 'matchmaking' ? styles.optionLabelActive : styles.optionLabelMuted,
                  ]}>
                  Matchmaking
                </Text>
              </TactilePressable>

              <TactilePressable
                onPress={() => setIntent('organizer')}
                style={[styles.optionButton, intent === 'organizer' && styles.optionButtonSelected]}>
                <Text
                  style={[
                    styles.optionLabel,
                    intent === 'organizer' ? styles.optionLabelActive : styles.optionLabelMuted,
                  ]}>
                  I am an organizer
                </Text>
              </TactilePressable>
            </View>
          </View>

          <View style={styles.footer}>
            <TactilePressable onPress={() => router.back()} style={styles.backButton} pressScale={0.96}>
              <Ionicons name="arrow-back" size={22} color="#1C1612" />
            </TactilePressable>

            <TactilePressable
              onPress={handleContinue}
              style={styles.continueButton}>
              <Text style={styles.continueLabel}>continue</Text>
            </TactilePressable>
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
    paddingHorizontal: 24,
    paddingTop: 108,
    paddingBottom: 24,
  },
  heading: {
    color: '#1C1612',
    fontFamily: 'Playfair_Display_Italic',
    fontSize: 44,
    lineHeight: 56,
    letterSpacing: -0.1,
  },
  optionRow: {
    marginTop: 52,
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    minHeight: 76,
    borderRadius: 22,
    backgroundColor: '#EDEAE4',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  optionButtonSelected: {
    backgroundColor: '#E8E3D8',
  },
  optionLabel: {
    fontFamily: 'DM_Sans_500Medium',
    fontSize: 16,
    textAlign: 'center',
  },
  optionLabelActive: {
    color: '#121212',
  },
  optionLabelMuted: {
    color: '#8D8A84',
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
  continueLabel: {
    color: '#F5F0E8',
    fontFamily: 'DM_Sans_500Medium',
    fontSize: 17,
    letterSpacing: 0.1,
  },
});
