import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  LayoutAnimation,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type PanResponderGestureState,
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
import { useUser } from '@/context/UserContext';
import { supabase } from '@/utils/supabase';

type TabKey = 'home' | 'chats' | 'events';

type UserProfile = {
  id: string;
  name: string;
  pronouns: string;
  tags: string[];
  about: string;
  image: string;
  compatibilityScore: number;
};

type TabItem = {
  key: TabKey;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1542206395-9feb3edaa68d?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1546961329-78bef0414d7c?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=80',
];

const TABS: TabItem[] = [
  { key: 'home', label: 'home', icon: 'sparkles' },
  { key: 'chats', label: 'chats' },
  { key: 'events', label: 'events' },
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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

type SwipeableProfileCardProps = {
  user: UserProfile;
  index: number;
  expanded: boolean;
  onToggle: (id: string) => void;
  cardImageWidth: number;
  cardRowHeight: number;
};

function SwipeableProfileCard({
  user,
  index,
  expanded,
  onToggle,
  cardImageWidth,
  cardRowHeight,
}: SwipeableProfileCardProps) {
  const swipeX = useRef(new Animated.Value(0)).current;
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 420,
      delay: index * 55,
      useNativeDriver: true,
    }).start();
  }, [entrance, index]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture: PanResponderGestureState) =>
          Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderMove: (_, gesture: PanResponderGestureState) => {
          swipeX.setValue(clamp(gesture.dx, -120, 120));
        },
        onPanResponderRelease: (_, gesture: PanResponderGestureState) => {
          const releaseTo = Math.abs(gesture.dx) > 72 ? (gesture.dx > 0 ? 90 : -90) : 0;
          Animated.sequence([
            Animated.timing(swipeX, {
              toValue: releaseTo,
              duration: 110,
              useNativeDriver: true,
            }),
            Animated.spring(swipeX, {
              toValue: 0,
              speed: 18,
              bounciness: 10,
              useNativeDriver: true,
            }),
          ]).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(swipeX, {
            toValue: 0,
            speed: 18,
            bounciness: 10,
            useNativeDriver: true,
          }).start();
        },
      }),
    [swipeX]
  );

  const likeOpacity = swipeX.interpolate({
    inputRange: [0, 20, 95],
    outputRange: [0, 0.35, 0.9],
    extrapolate: 'clamp',
  });
  const passOpacity = swipeX.interpolate({
    inputRange: [-95, -20, 0],
    outputRange: [0.9, 0.35, 0],
    extrapolate: 'clamp',
  });
  const cardScale = swipeX.interpolate({
    inputRange: [-120, 0, 120],
    outputRange: [0.985, 1, 0.985],
    extrapolate: 'clamp',
  });
  const cardRotate = swipeX.interpolate({
    inputRange: [-120, 0, 120],
    outputRange: ['-3deg', '0deg', '3deg'],
    extrapolate: 'clamp',
  });

  const previewTags = user.tags.slice(0, 3);
  const extraTags = user.tags.slice(3);

  return (
    <Animated.View
      style={[
        styles.cardAnimationWrap,
        {
          opacity: entrance,
          transform: [
            {
              translateY: entrance.interpolate({
                inputRange: [0, 1],
                outputRange: [24, 0],
              }),
            },
          ],
        },
      ]}>
      <Animated.View style={[styles.swipeHint, styles.swipeHintLike, { opacity: likeOpacity }]}> 
        <Text style={styles.swipeHintText}>LIKE</Text>
      </Animated.View>
      <Animated.View style={[styles.swipeHint, styles.swipeHintPass, { opacity: passOpacity }]}> 
        <Text style={styles.swipeHintText}>PASS</Text>
      </Animated.View>

      <Animated.View
        {...panResponder.panHandlers}
        style={{
          transform: [{ translateX: swipeX }, { rotate: cardRotate }, { scale: cardScale }],
        }}>
        <Pressable onPress={() => onToggle(user.id)} style={styles.card}>
          <View style={[styles.cardTop, { height: cardRowHeight }]}> 
            <View style={styles.cardLeft}>
              <Text numberOfLines={1} style={styles.cardName}>
                {user.name}
              </Text>
              <Text style={styles.cardPronouns}>{user.pronouns}</Text>

              <View style={styles.tagsWrap}>
                {previewTags.map((tag) => (
                  <View key={`${user.id}-${tag}`} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
                {!expanded && extraTags.length > 0 ? (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>+{extraTags.length} more</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={[styles.cardImageWrap, { width: cardImageWidth }]}> 
              <Image source={{ uri: user.image }} style={styles.cardImage} resizeMode="cover" />
            </View>
          </View>

          {expanded ? (
            <View style={styles.cardExpanded}> 
              <Text style={styles.cardAbout}>{user.about}</Text>
              {extraTags.length > 0 ? (
                <View style={styles.tagsWrapExpanded}>
                  {extraTags.map((tag) => (
                    <View key={`${user.id}-${tag}-expanded`} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const { profile, matches, refreshMatches, isRefreshingMatches } = useUser();
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [barWidth, setBarWidth] = useState(width - 64);
  const [isInitialFeedLoading, setIsInitialFeedLoading] = useState(true);
  const [fontsLoaded] = useFonts({
    Playfair_Display_Italic: PlayfairDisplay_400Regular_Italic,
    Playfair_Display_Black: PlayfairDisplay_900Black,
    DM_Sans_400Regular: DMSans_400Regular,
    DM_Sans_500Medium: DMSans_500Medium,
  });

  const indicatorX = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const activeIndex = TABS.findIndex((tab) => tab.key === activeTab);
  const singleTabWidth = useMemo(() => Math.max(96, (barWidth - 12) / TABS.length), [barWidth]);
  const cardImageWidth = Math.max(126, Math.min(154, Math.floor(width * 0.34)));
  const cardRowHeight = Math.round(cardImageWidth * 1.38);
  const cards = useMemo<UserProfile[]>(
    () =>
      [...matches]
        .sort((a, b) => b.compatibility_score - a.compatibility_score)
        .map((candidate, index) => {
          const tags = [...new Set([...(candidate.intentions || []), ...(candidate.match_types || [])])].slice(0, 6);

          return {
            id: candidate.clerk_id || candidate.id || `match-${index}`,
            name: (candidate.name || 'FLURR USER').toUpperCase(),
            pronouns: candidate.pronouns || 'pronouns undisclosed',
            tags: tags.length > 0 ? tags : ['open to connect'],
            about: `${candidate.compatibility_score}% compatibility`,
            image: candidate.avatar_url || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length],
            compatibilityScore: candidate.compatibility_score,
          };
        }),
    [matches]
  );
  const heroName = profile.name.trim().length > 0 ? profile.name : 'there';
  const headerAvatar = profile.avatar_url || cards[0]?.image || FALLBACK_IMAGES[0];

  const refreshMatchesInPlace = useCallback(async () => {
    await refreshMatches();
  }, [refreshMatches]);

  useEffect(() => {
    Animated.spring(indicatorX, {
      toValue: activeIndex * singleTabWidth,
      speed: 20,
      bounciness: 8,
      useNativeDriver: true,
    }).start();
  }, [activeIndex, indicatorX, singleTabWidth]);

  useEffect(() => {
    let isMounted = true;

    const loadInitialMatches = async () => {
      setIsInitialFeedLoading(true);
      await refreshMatchesInPlace();
      if (isMounted) {
        setIsInitialFeedLoading(false);
      }
    };

    void loadInitialMatches();

    return () => {
      isMounted = false;
    };
  }, [refreshMatchesInPlace]);

  useEffect(() => {
    const channel = supabase
      .channel('feed-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        void refreshMatchesInPlace();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'preferences' }, () => {
        void refreshMatchesInPlace();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refreshMatchesInPlace]);

  useEffect(() => {
    if (expandedCardId && !cards.some((card) => card.id === expandedCardId)) {
      setExpandedCardId(null);
    }
  }, [cards, expandedCardId]);

  const switchTab = (nextTab: TabKey) => {
    if (nextTab === activeTab) {
      return;
    }
    Animated.timing(contentOpacity, {
      toValue: 0,
      duration: 130,
      useNativeDriver: true,
    }).start(() => {
      setActiveTab(nextTab);
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
  };

  const toggleCard = (id: string) => {
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
        <Animated.View
          style={{
            flex: 1,
            opacity: contentOpacity,
            transform: [
              {
                translateY: contentOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
            ],
          }}>
          {activeTab === 'home' ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <View style={styles.headerRow}>
                <Image source={{ uri: headerAvatar }} style={styles.avatar} />
                <Pressable style={styles.settingsButton}>
                  <Ionicons name="settings-outline" size={22} color="#1C1612" />
                </Pressable>
              </View>

              <Text style={styles.heroText}>hey {heroName}, looking to{`\n`}meet ur twin flame?</Text>

              {(isInitialFeedLoading || isRefreshingMatches) && (
                <View style={styles.refreshRow}>
                  <ActivityIndicator size="small" color="#8E887F" />
                  <Text style={styles.refreshLabel}>refreshing feed</Text>
                </View>
              )}

              <View style={styles.cardStack}>
                {cards.map((user, index) => (
                  <SwipeableProfileCard
                    key={user.id}
                    user={user}
                    index={index}
                    expanded={expandedCardId === user.id}
                    onToggle={toggleCard}
                    cardImageWidth={cardImageWidth}
                    cardRowHeight={cardRowHeight}
                  />
                ))}
                {cards.length === 0 && !isInitialFeedLoading ? (
                  <View style={styles.emptyStateWrap}>
                    <Text style={styles.emptyStateText}>No matches yet — check back soon</Text>
                  </View>
                ) : null}
              </View>
            </ScrollView>
          ) : (
            <View style={styles.placeholderWrap}>
              <Text style={styles.placeholderTitle}>{activeTab}</Text>
              <Text style={styles.placeholderText}>To be added soon</Text>
            </View>
          )}
        </Animated.View>

        <View style={styles.tabBarShell}>
          <View
            style={styles.tabBar}
            onLayout={(event) => {
              const nextWidth = event.nativeEvent.layout.width;
              setBarWidth(nextWidth);
            }}>
            <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
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

            {TABS.map((tab) => {
              const isActive = tab.key === activeTab;
              return (
                <Pressable
                  key={tab.key}
                  style={[styles.tabButton, { width: singleTabWidth }]}
                  onPress={() => switchTab(tab.key)}>
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
  refreshRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    borderRadius: 12,
    backgroundColor: '#EEEBE4',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  refreshLabel: {
    color: '#8E887F',
    fontFamily: 'DM_Sans_400Regular',
    fontSize: 12,
  },
  cardStack: {
    marginTop: 26,
    gap: 12,
  },
  emptyStateWrap: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#EFECE5',
    paddingHorizontal: 18,
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#A8A29A',
    fontFamily: 'Playfair_Display_Italic',
    fontSize: 26,
    lineHeight: 36,
  },
  cardAnimationWrap: {
    position: 'relative',
  },
  swipeHint: {
    position: 'absolute',
    top: 10,
    zIndex: 0,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  swipeHintLike: {
    right: 20,
    borderColor: '#2B8A5C',
    backgroundColor: 'rgba(43, 138, 92, 0.12)',
  },
  swipeHintPass: {
    left: 20,
    borderColor: '#BA3A4A',
    backgroundColor: 'rgba(186, 58, 74, 0.12)',
  },
  swipeHintText: {
    fontFamily: 'DM_Sans_500Medium',
    fontSize: 11,
    color: '#1C1612',
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
  tagsWrapExpanded: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    borderRadius: 10,
    backgroundColor: '#F4F3EF',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    color: '#1C1612',
    fontFamily: 'DM_Sans_400Regular',
    fontSize: 10.5,
  },
  cardExpanded: {
    marginTop: 10,
  },
  cardAbout: {
    color: '#544F47',
    fontFamily: 'DM_Sans_400Regular',
    fontSize: 12,
    lineHeight: 17,
  },
  cardImageWrap: {
    height: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#D7D2C9',
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
