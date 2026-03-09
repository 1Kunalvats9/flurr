import { StyleSheet, Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';

type OnboardingProgressHeaderProps = {
  stepLabel: string;
  progress: number;
};

export default function OnboardingProgressHeader({ stepLabel, progress }: OnboardingProgressHeaderProps) {
  const [fontsLoaded] = useFonts({
    DM_Sans_400Regular: DMSans_400Regular,
    DM_Sans_500Medium: DMSans_500Medium,
  });

  if (!fontsLoaded) {
    return null;
  }

  const boundedProgress = Math.max(0, Math.min(progress, 1));

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.title}>Profile Builder</Text>
        <Text style={styles.step}>{stepLabel}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${boundedProgress * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  title: {
    fontFamily: 'DM_Sans_500Medium',
    fontSize: 9,
    color: '#1C1612',
  },
  step: {
    fontFamily: 'DM_Sans_500Medium',
    fontSize: 15,
    color: '#1C1612',
  },
  track: {
    height: 2,
    backgroundColor: '#E8E1D8',
    width: '100%',
  },
  fill: {
    height: '100%',
    backgroundColor: '#F23862',
  },
});
