import { type ReactElement, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { PlayfairDisplay_400Regular_Italic } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
import OnboardingProgressHeader from '@/components/onboarding-progress-header';
import TactilePressable from '@/components/tactile-pressable';
import { useUser } from '@/context/UserContext';

type IoniconName = keyof typeof Ionicons.glyphMap;
type MaterialIconName = keyof typeof MaterialCommunityIcons.glyphMap;
type IconLib = 'Ionicons' | 'MaterialCommunityIcons';

type GoalOption = {
  key: string;
  label: string;
  iconLib: IconLib;
  icon: IoniconName | MaterialIconName;
};

const GOAL_OPTIONS: GoalOption[] = [
  {
    key: 'romantic_partner',
    label: 'Romantic\npartner',
    iconLib: 'Ionicons',
    icon: 'heart-outline',
  },
  {
    key: 'open_to_exploring',
    label: 'Open to\nexploring',
    iconLib: 'MaterialCommunityIcons',
    icon: 'leaf',
  },
  {
    key: 'relationship',
    label: 'Relationship',
    iconLib: 'MaterialCommunityIcons',
    icon: 'account-lock-outline',
  },
  {
    key: 'someone_to_go_out',
    label: 'Someone to go\nout w/',
    iconLib: 'MaterialCommunityIcons',
    icon: 'glass-wine',
  },
  {
    key: 'good_time',
    label: 'A good\ntime',
    iconLib: 'MaterialCommunityIcons',
    icon: 'lipstick',
  },
  {
    key: 'new_bestie',
    label: 'A new\nbestie',
    iconLib: 'Ionicons',
    icon: 'people-outline',
  },
];

function OptionIcon({ iconLib, icon }: { iconLib: IconLib; icon: IoniconName | MaterialIconName }) {
  if (iconLib === 'MaterialCommunityIcons') {
    return <MaterialCommunityIcons name={icon as MaterialIconName} size={22} color="#1C1612" />;
  }

  return <Ionicons name={icon as IoniconName} size={22} color="#1C1612" />;
}

export default function MatchGoalsScreen() {
  const router = useRouter();
  const { matchTypes, setMatchTypes } = useUser();
  const [selected, setSelected] = useState<string[]>(matchTypes);
  const [fontsLoaded] = useFonts({
    Playfair_Display_Italic: PlayfairDisplay_400Regular_Italic,
    DM_Sans_400Regular: DMSans_400Regular,
    DM_Sans_500Medium: DMSans_500Medium,
  });

  const toggleSelection = (key: string) => {
    setSelected((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));
  };

  const canContinue = selected.length > 0;

  const handleContinue = () => {
    if (!canContinue) {
      return;
    }
    setMatchTypes(selected);
    router.push('/onboarding/era');
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" translucent={false} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <OnboardingProgressHeader stepLabel="4/8" progress={4 / 8} />

        <View style={styles.content}>
          <View>
            <Text style={styles.heading}>what&apos;s missing rn that ur hoping to get from a match?</Text>

            <View style={styles.grid}>
              {GOAL_OPTIONS.map((item): ReactElement => {
                const isSelected = selected.includes(item.key);
                return (
                  <TactilePressable
                    key={item.key}
                    onPress={() => toggleSelection(item.key)}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    pressScale={0.985}>
                    <View style={styles.optionIcon}>
                      <OptionIcon iconLib={item.iconLib} icon={item.icon} />
                    </View>
                    <Text style={styles.optionText}>{item.label}</Text>
                  </TactilePressable>
                );
              })}
            </View>
          </View>

          <View style={styles.footer}>
            <TactilePressable onPress={() => router.back()} style={styles.backButton} pressScale={0.96}>
              <Ionicons name="arrow-back" size={22} color="#1C1612" />
            </TactilePressable>

            <TactilePressable
              onPress={handleContinue}
              style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}>
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
    paddingTop: 48,
    paddingBottom: 24,
  },
  heading: {
    color: '#1C1612',
    fontFamily: 'Playfair_Display_Italic',
    fontSize: 33,
    lineHeight: 44,
    letterSpacing: -0.15,
    maxWidth: 340,
  },
  grid: {
    marginTop: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionCard: {
    width: '48.3%',
    minHeight: 105,
    borderRadius: 16,
    backgroundColor: '#EDEAE4',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    justifyContent: 'space-between',
  },
  optionCardSelected: {
    borderColor: '#1C1612',
    backgroundColor: '#E7E2D8',
  },
  optionIcon: {
    alignItems: 'flex-end',
  },
  optionText: {
    color: '#1C1612',
    fontFamily: 'DM_Sans_500Medium',
    fontSize: 14,
    lineHeight: 20,
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
