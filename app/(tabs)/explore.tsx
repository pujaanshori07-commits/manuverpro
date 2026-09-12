import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, Typography, BorderRadius, Spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - Spacing.base * 2;
const CARD_HEIGHT = 160;

const ACTIVITY_CATEGORIES = [
  'Semua',
  'Running',
  'Gym',
  'Badminton',
  'Basket',
  'Yoga',
  'Tennis',
];

interface ExploreCardItem {
  id: string;
  nama: string;
  umur: number;
  aktivitas: string;
  jarak: string;
  foto_url: string;
  isLiked?: boolean;
}

const DEMO_EXPLORE_ITEMS: ExploreCardItem[] = [
  {
    id: 'exp-1',
    nama: 'Nadia',
    umur: 26,
    aktivitas: 'Running',
    jarak: '2 km',
    foto_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'exp-2',
    nama: 'Raka',
    umur: 27,
    aktivitas: 'Gym',
    jarak: '4 km',
    foto_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'exp-3',
    nama: 'Dinda',
    umur: 24,
    aktivitas: 'Badminton',
    jarak: '3 km',
    foto_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'exp-4',
    nama: 'Budi',
    umur: 28,
    aktivitas: 'Basket',
    jarak: '5 km',
    foto_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
  },
];

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [items, setItems] = useState<ExploreCardItem[]>(DEMO_EXPLORE_ITEMS);
  const [loading, setLoading] = useState(false);

  // Filter Modal selections
  const [modalCategory, setModalCategory] = useState('Semua');
  const [modalGender, setModalGender] = useState('Semua');

  const fetchExploreUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(20);

      if (error || !data || data.length === 0) {
        setItems(DEMO_EXPLORE_ITEMS);
      } else {
        const formatted: ExploreCardItem[] = data.map((d: any, idx: number) => ({
          id: d.id,
          nama: d.nama || `User ${idx + 1}`,
          umur: d.umur || 25,
          aktivitas: Array.isArray(d.hobi) && d.hobi.length > 0 ? d.hobi[0] : (d.hobi || 'Running'),
          jarak: `${(idx + 1) * 2} km`,
          foto_url: d.foto_url || DEMO_EXPLORE_ITEMS[idx % DEMO_EXPLORE_ITEMS.length].foto_url,
        }));
        setItems(formatted);
      }
    } catch {
      setItems(DEMO_EXPLORE_ITEMS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExploreUsers();
  }, [fetchExploreUsers]);

  const toggleLike = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isLiked: !item.isLiked } : item
      )
    );
  };

  const filteredItems = items.filter((item) => {
    if (selectedCategory === 'Semua') return true;
    return item.aktivitas.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <TouchableOpacity
          style={styles.filterIconButton}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="options-outline" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Activity Filter Pills (Horizontal Scroll) */}
      <View style={styles.categoryScrollWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          {ACTIVITY_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Profiles Cards List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.exploreCard}
              activeOpacity={0.9}
              onPress={() =>
                router.push({
                  pathname: '/chat/[id]',
                  params: { id: item.id, name: item.nama, avatar: item.foto_url },
                })
              }
            >
              <Image source={{ uri: item.foto_url }} style={styles.cardImage} />

              {/* Gradient Dark Overlay */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(9,10,13,0.92)']}
                locations={[0.2, 0.6, 1.0]}
                style={styles.cardGradient}
              >
                <View style={styles.cardBottomRow}>
                  {/* Name, Verified, and Details */}
                  <View style={styles.cardInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.cardName}>{item.nama}, {item.umur}</Text>
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-sharp" size={10} color={Colors.white} />
                      </View>
                    </View>
                    <Text style={styles.cardSubtitle}>
                      {item.aktivitas} • {item.jarak}
                    </Text>
                  </View>

                  {/* Heart Like Circle */}
                  <TouchableOpacity
                    style={[styles.heartBtn, item.isLiked && styles.heartBtnActive]}
                    onPress={() => toggleLike(item.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={item.isLiked ? 'heart' : 'heart-outline'}
                      size={20}
                      color={item.isLiked ? Colors.white : Colors.primary}
                    />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Bottom Filter Sheet Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter</Text>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              {/* Filter Aktivitas */}
              <Text style={styles.modalSectionLabel}>Aktivitas</Text>
              <View style={styles.modalPillsWrap}>
                {['Semua', 'Running', 'Gym', 'Badminton', 'Basket', 'Yoga'].map((item) => {
                  const active = modalCategory === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                      onPress={() => setModalCategory(item)}
                    >
                      <Text
                        style={[styles.filterChipText, active && styles.filterChipTextActive]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Filter Jarak */}
              <View style={styles.rangeRow}>
                <Text style={styles.modalSectionLabel}>Jarak</Text>
                <Text style={styles.rangeValue}>0 - 10 km</Text>
              </View>
              <View style={styles.dummyTrack}>
                <View style={[styles.dummyFill, { width: '60%' }]} />
              </View>

              {/* Filter Usia */}
              <View style={styles.rangeRow}>
                <Text style={styles.modalSectionLabel}>Usia</Text>
                <Text style={styles.rangeValue}>18 - 35 tahun</Text>
              </View>
              <View style={styles.dummyTrack}>
                <View style={[styles.dummyFill, { width: '75%' }]} />
              </View>

              {/* Filter Gender */}
              <Text style={styles.modalSectionLabel}>Gender</Text>
              <View style={styles.genderRow}>
                {['Semua', 'Pria', 'Wanita'].map((g) => {
                  const active = modalGender === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[styles.genderBtn, active && styles.genderBtnActive]}
                      onPress={() => setModalGender(g)}
                    >
                      <Text
                        style={[styles.genderBtnText, active && styles.genderBtnTextActive]}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Modal Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => {
                  setSelectedCategory(modalCategory);
                  setFilterModalVisible(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.applyBtnText}>Terapkan</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                  setModalCategory('Semua');
                  setModalGender('Semua');
                }}
              >
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  headerTitle: {
    fontFamily: Typography.fontHeading,
    fontSize: 22,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  filterIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  categoryScrollWrap: {
    paddingVertical: 12,
  },
  categoryList: {
    paddingHorizontal: Spacing.base,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  categoryPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryPillText: {
    fontFamily: Typography.fontMedium,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  categoryPillTextActive: {
    color: Colors.white,
    fontFamily: Typography.fontSemiBold,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxl + 20,
    gap: 16,
  },
  exploreCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.base,
    paddingBottom: 14,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardName: {
    fontFamily: Typography.fontHeading,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSubtitle: {
    fontFamily: Typography.fontRegular,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  heartBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  heartBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#12141A',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.base,
    paddingHorizontal: Spacing.base,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  modalTitle: {
    fontFamily: Typography.fontHeading,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  modalBody: {
    paddingVertical: Spacing.base,
  },
  modalSectionLabel: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 10,
    marginTop: 8,
  },
  modalPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontFamily: Typography.fontRegular,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.white,
    fontFamily: Typography.fontSemiBold,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rangeValue: {
    fontFamily: Typography.fontRegular,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  dummyTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surfaceBorder,
    marginVertical: 12,
  },
  dummyFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  genderBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genderBtnText: {
    fontFamily: Typography.fontRegular,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  genderBtnTextActive: {
    color: Colors.white,
    fontFamily: Typography.fontSemiBold,
  },
  modalActions: {
    gap: 10,
    paddingTop: 10,
  },
  applyBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
  },
  applyBtnText: {
    fontFamily: Typography.fontHeading,
    fontSize: 15,
    color: Colors.white,
  },
  resetBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  resetBtnText: {
    fontFamily: Typography.fontRegular,
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
