import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  LayoutAnimation,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_900Black,
} from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';

const USERS = [
  {
    id: 'tracey',
    name: 'TRACEY',
    pronouns: 'she/her',
    tags: ['prefers 1:1', 'long walks', 'birding', 'slow replies ok', 'friends first'],
    about: 'soft spoken, loyal, and into intentional connection.',
    image:
      'https://images.unsplash.com/photo-1542206395-9feb3edaa68d?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'seyi',
    name: 'SEYI',
    pronouns: 'she/they',
    tags: ['deep convos pls', 'calling > texting', 'beach life', 'loves to host'],
    about: 'wants tenderness, banter, and someone emotionally present.',
    image:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'dani',
    name: 'DANI',
    pronouns: 'any pronouns',
    tags: ['goofy', 'new friendships', 'enm', 'here for a good time', 'gathers the crew'],
    about: 'brings light energy and plans fun things for everyone.',
    image:
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'hayden',
    name: 'HAYDEN',
    pronouns: 'they/them',
    tags: ['foodie', 'open', 'friends first', 'slow mornings'],
    about: 'looking for care, curiosity, and quality time.',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'riya',
    name: 'RIYA',
    pronouns: 'she/they',
    tags: ['bookshops', 'queer cinema', 'mutual care', 'night walks'],
    about: 'romantic, observant, and high on emotional honesty.',
    image:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'mika',
    name: 'MIKA',
    pronouns: 'he/they',
    tags: ['kitchen dates', 'plants', 'soft masc', 'good listener'],
    about: 'loves slow intimacy and playful daily rituals.',
    image:
      'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=600&q=80',
  },
];

const TABS = [
  { key: 'home', label: 'home', icon: 'sparkles' },
  { key: 'chats', label: 'chats', icon: null },
  { key: 'events', label: 'events', icon: null },
];

const SMOOTH_EXPAND_ANIMATION = {
  duration: 280,
  create: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  update: {
    type: LayoutAnimation.Types.easeInEaseOut,
  },
  delete: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
};

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState('home');
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [barWidth, setBarWidth] = useState(width - 64);
  const [fontsLoaded] = useFonts({
    Playfair_Display_Italic: PlayfairDisplay_400Regular_Italic,
    Playfair_Display_Black: PlayfairDisplay_900Black,
    DM_Sans_400Regular: DMSans_400Regular,
    DM_Sans_500Medium: DMSans_500Medium,
  });

  const indicatorX = useRef(new Animated.Value(0)).current;
  const activeIndex = TABS.findIndex((tab) => tab.key === activeTab);
  const singleTabWidth = useMemo(() => Math.max(96, (barWidth - 12) / TABS.length), [barWidth]);
  const cardImageWidth = Math.max(120, Math.min(146, Math.floor(width * 0.32)));
  const cardImageHeight = Math.round(cardImageWidth * 1.36);

  useEffect(() => {
    Animated.spring(indicatorX, {
      toValue: activeIndex * singleTabWidth,
      speed: 20,
      bounciness: 8,
      useNativeDriver: true,
    }).start();
  }, [activeIndex, indicatorX, singleTabWidth]);

  const toggleCard = (id) => {
    LayoutAnimation.configureNext(SMOOTH_EXPAND_ANIMATION);
    setExpandedCardId((prev) => (prev === id ? null : id));
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" translucent={false} />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {activeTab === 'home' ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            <View style={styles.headerRow}>
              <Image source={{ uri: USERS[3].image }} style={styles.avatar} />
              <Pressable style={styles.settingsButton}>
                <Ionicons name="settings-outline" size={22} color="#1C1612" />
              </Pressable>
            </View>

            <Text style={styles.heroText}>hey June, looking to{'\n'}meet ur twin flame?</Text>

            <View style={styles.cardStack}>
              {USERS.map((user) => {
                const expanded = expandedCardId === user.id;
                const visibleTags = expanded ? user.tags : user.tags.slice(0, 3);
                const hiddenCount = user.tags.length - visibleTags.length;

                return (
                  <Pressable key={user.id} onPress={() => toggleCard(user.id)} style={styles.card}>
                    <View style={[styles.cardTop, { minHeight: cardImageHeight }]}>
                      <View style={styles.cardLeft}>
                        <Text style={styles.cardName}>{user.name}</Text>
                        <Text style={styles.cardPronouns}>{user.pronouns}</Text>

                        <View style={styles.tagsWrap}>
                          {visibleTags.map((tag) => (
                            <View key={`${user.id}-${tag}`} style={styles.tag}>
                              <Text style={styles.tagText}>{tag}</Text>
                            </View>
                          ))}
                          {!expanded && hiddenCount > 0 ? (
                            <View style={styles.tag}>
                              <Text style={styles.tagText}>+{hiddenCount} more</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>

                      <View style={[styles.cardImageWrap, { width: cardImageWidth }]}>
                        <Image source={{ uri: user.image }} style={styles.cardImage} />
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.placeholderWrap}>
            <Text style={styles.placeholderTitle}>{activeTab}</Text>
            <Text style={styles.placeholderText}>To be added soon</Text>
          </View>
        )}

        <View style={styles.tabBarShell}>
          <View
            style={styles.tabBar}
            onLayout={(event) => {
              const nextWidth = event.nativeEvent.layout.width;
              setBarWidth(nextWidth);
            }}>
            <BlurView
              intensity={50}
              tint="light"
              style={StyleSheet.absoluteFill}
              experimentalBlurMethod="dimezisBlurView"
            />
            <View style={styles.tabOverlay} />

            <Animated.View
              style={[
                styles.activePill,
                {
                  width: singleTabWidth,
                  transform: [{ translateX: indicatorX }],
                },
              ]}
            />

            {TABS.map((tab, index) => {
              const isActive = tab.key === activeTab;
              return (
                <Pressable
                  key={tab.key}
                  style={[styles.tabButton, { width: singleTabWidth }]}
                  onPress={() => setActiveTab(tab.key)}>
                  <View style={styles.tabTextRow}>
                    {tab.icon ? (
                      <Ionicons
                        name={tab.icon}
                        size={14}
                        color={isActive ? '#111111' : '#3E3A35'}
                        style={styles.tabIcon}
                      />
                    ) : null}
                    <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
                    {tab.key === 'chats' ? <View style={styles.unreadDot} /> : null}
                  </View>
                </Pressable>
              );
            })}
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 128,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  settingsButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    marginTop: 18,
    color: '#1C1612',
    fontFamily: 'Playfair_Display_Italic',
    fontSize: 32,
    lineHeight: 50,
    letterSpacing: -0.2,
  },
  cardStack: {
    marginTop: 26,
    gap: 12,
  },
  card: {
    borderRadius: 22,
    backgroundColor: '#ECEAE4',
    padding: 14,
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  cardLeft: {
    flex: 1,
    paddingRight: 12,
  },
  cardName: {
    color: '#111111',
    fontFamily: 'Playfair_Display_Black',
    fontSize: 39,
    lineHeight: 46,
    letterSpacing: -1,
  },
  cardPronouns: {
    color: '#1C1612',
    fontFamily: 'DM_Sans_400Regular',
    fontSize: 15,
    marginTop: 2,
    marginBottom: 10,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    borderRadius: 10,
    backgroundColor: '#F4F3EF',
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  tagText: {
    color: '#1C1612',
    fontFamily: 'DM_Sans_400Regular',
    fontSize: 11.5,
  },
  cardImageWrap: {
    borderRadius: 18,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  placeholderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  placeholderTitle: {
    textTransform: 'capitalize',
    color: '#1C1612',
    fontFamily: 'Playfair_Display_Italic',
    fontSize: 42,
    lineHeight: 50,
  },
  placeholderText: {
    marginTop: 6,
    color: '#3E3A35',
    fontFamily: 'DM_Sans_400Regular',
    fontSize: 18,
  },
  tabBarShell: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 16,
  },
  tabBar: {
    height: 70,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  tabOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(237, 222, 198, 0.35)',
  },
  activePill: {
    position: 'absolute',
    top: 6,
    left: 6,
    bottom: 6,
    borderRadius: 19,
    backgroundColor: 'rgba(250, 248, 244, 0.86)',
  },
  tabButton: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  tabTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tabIcon: {
    marginTop: 1,
  },
  tabLabel: {
    color: '#3E3A35',
    fontFamily: 'DM_Sans_400Regular',
    fontSize: 15.5,
  },
  tabLabelActive: {
    color: '#111111',
    fontFamily: 'DM_Sans_500Medium',
  },
  unreadDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#F23862',
    marginTop: -7,
  },
});
