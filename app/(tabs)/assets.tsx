import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, AlertCircle } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { AssetEditModal } from '@/components/AssetEditModal';
import { CategoryManager } from '@/components/CategoryManager';
import { auth } from '@/lib/firebase/config';
import { subscribeToUserProfile, addCategory, removeCategory, subscribeToAssets, createAsset, updateAsset, deleteAsset } from '@/lib/firebase/firestore';
import type { Asset } from '@/lib/firebase/firestore';

export default function Assets() {
  const insets = useSafeAreaInsets();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isNewAsset, setIsNewAsset] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    let unsubscribeAssets: (() => void) | undefined;

    const setupSubscriptions = async () => {
      if (!auth.currentUser) return;

      try {
        setError(null);
        
        // Subscribe to user profile for categories
        unsubscribeProfile = subscribeToUserProfile(auth.currentUser.uid, (profile) => {
          if (profile) {
            setCategories(profile.categories || []);
          }
        });

        // Subscribe to assets
        unsubscribeAssets = subscribeToAssets((updatedAssets) => {
          setAssets(updatedAssets);
          setLoading(false);
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
        setLoading(false);
      }
    };

    setupSubscriptions();
    return () => {
      unsubscribeProfile?.();
      unsubscribeAssets?.();
    };
  }, []);

  const handleAddCategory = async (category: string) => {
    if (!auth.currentUser) return;

    try {
      setError(null);
      await addCategory(auth.currentUser.uid, category);
    } catch (err: any) {
      setError(err.message || 'Failed to add category');
    }
  };

  const handleDeleteCategory = async (category: string) => {
    if (!auth.currentUser) return;

    try {
      setError(null);
      await removeCategory(auth.currentUser.uid, category);
      if (selectedCategory === category) {
        setSelectedCategory(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to remove category');
    }
  };

  const handleEditAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsNewAsset(false);
    setEditModalVisible(true);
  };

  const handleCreateAsset = () => {
    setSelectedAsset(null);
    setIsNewAsset(true);
    setEditModalVisible(true);
  };

  const handleSaveAsset = async (updatedAsset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null);
      if (isNewAsset) {
        await createAsset(updatedAsset);
      } else if (selectedAsset) {
        await updateAsset(selectedAsset.id, updatedAsset);
      }
      setEditModalVisible(false);
      setSelectedAsset(null);
      setIsNewAsset(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save asset');
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);
      setError(null);
      console.log('Assets - Starting asset deletion:', assetId);
      
      await deleteAsset(assetId);
      console.log('Assets - Asset deleted successfully:', assetId);
      
      setEditModalVisible(false);
      setSelectedAsset(null);
    } catch (err: any) {
      console.error('Assets - Error deleting asset:', err);
      setError(err.message || 'Failed to delete asset');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredAssets = selectedCategory
    ? assets.filter(asset => asset.type === selectedCategory)
    : assets;

  const renderAssetItem = ({ item }: { item: Asset }) => (
    <TouchableOpacity 
      style={styles.assetCard}
      onPress={() => handleEditAsset(item)}
    >
      <View style={styles.assetHeader}>
        <Text style={styles.assetName}>{item.name}</Text>
        <Text style={[
          styles.assetStatus,
          { color: item.status === 'Available' ? '#34C759' : '#FF3B30' }
        ]}>
          {item.status}
        </Text>
      </View>
      <Text style={styles.assetType}>{item.type}</Text>
      <Text style={styles.assetPrice}>
        {item.currency} {item.pricePerDay} per day
      </Text>
      {item.description && (
        <Text style={styles.assetDescription}>{item.description}</Text>
      )}
      {item.bookingType === 'time-slots' && item.timeSlots && item.timeSlots.length > 0 && (
        <Text style={styles.timeSlots}>
          {item.timeSlots.length} time slot{item.timeSlots.length !== 1 ? 's' : ''} configured
        </Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading assets...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Assets</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleCreateAsset}
        >
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={20} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <CategoryManager
        categories={categories}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      <View style={styles.categoryFilter}>
        <TouchableOpacity
          style={[
            styles.categoryButton,
            !selectedCategory && styles.selectedCategory
          ]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[
            styles.categoryButtonText,
            !selectedCategory && styles.selectedCategoryText
          ]}>All</Text>
        </TouchableOpacity>
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.selectedCategory
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === category && styles.selectedCategoryText
            ]}>{category}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredAssets}
        renderItem={renderAssetItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />

      <AssetEditModal
        visible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedAsset(null);
          setIsNewAsset(false);
          setError(null);
        }}
        onSave={handleSaveAsset}
        onDelete={handleDeleteAsset}
        asset={selectedAsset}
        categories={categories}
        isNewAsset={isNewAsset}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#FF3B30',
    fontSize: 14,
  },
  categoryFilter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  selectedCategory: {
    backgroundColor: '#007AFF',
  },
  categoryButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: 'white',
  },
  listContainer: {
    padding: 20,
  },
  assetCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assetName: {
    fontSize: 18,
    fontWeight: '600',
  },
  assetStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  assetType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  assetPrice: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  assetDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  timeSlots: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
});