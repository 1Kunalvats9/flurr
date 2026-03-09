import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';

export default function OnboardingNextPlaceholder() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    DM_Sans_400Regular: DMSans_400Regular,
    DM_Sans_500Medium: DMSans_500Medium,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" translucent={false} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <Text style={styles.title}>Main home screen coming soon.</Text>
          <Pressable style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonLabel}>back</Text>
          </Pressable>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 20,
  },
  title: {
    fontFamily: 'DM_Sans_400Regular',
    fontSize: 18,
    color: '#1C1612',
    textAlign: 'center',
  },
  button: {
    height: 52,
    minWidth: 120,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  buttonLabel: {
    color: '#F5F0E8',
    fontFamily: 'DM_Sans_500Medium',
    fontSize: 16,
  },
});
