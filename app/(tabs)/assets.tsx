import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { AssetEditModal } from '@/components/AssetEditModal';
import { CategoryManager } from '@/components/CategoryManager';

interface Asset {
  id: string;
  name: string;
  type: string;
  description?: string;
  status: string;
}

const SAMPLE_ASSETS: Asset[] = [
  { id: '1', name: 'Car A-123', type: 'Vehicle', status: 'Available', description: 'Luxury sedan' },
  { id: '2', name: 'Room 201', type: 'Room', status: 'Booked', description: 'Conference room' },
  { id: '3', name: 'Villa Paradise', type: 'Property', status: 'Available', description: 'Beachfront property' },
];

const DEFAULT_CATEGORIES = ['Vehicle', 'Room', 'Property'];

export default function Assets() {
  const insets = useSafeAreaInsets();
  const [assets, setAssets] = useState<Asset[]>(SAMPLE_ASSETS);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const handleAddCategory = (category: string) => {
    if (!categories.includes(category)) {
      setCategories([...categories, category]);
    }
  };

  const handleDeleteCategory = (category: string) => {
    setCategories(categories.filter(c => c !== category));
    if (selectedCategory === category) {
      setSelectedCategory(null);
    }
  };

  const handleEditAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setEditModalVisible(true);
  };

  const handleSaveAsset = (updatedAsset: Asset) => {
    setAssets(assets.map(asset => 
      asset.id === updatedAsset.id ? updatedAsset : asset
    ));
  };

  const handleDeleteAsset = (assetId: string) => {
    setAssets(assets.filter(asset => asset.id !== assetId));
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
      {item.description && (
        <Text style={styles.assetDescription}>{item.description}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Assets</Text>
        <TouchableOpacity style={styles.addButton}>
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      <CategoryManager
        categories={categories}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      <ScrollView style={styles.categoryFilter}>
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
      </ScrollView>

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
        }}
        onSave={handleSaveAsset}
        onDelete={handleDeleteAsset}
        asset={selectedAsset}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  categoryFilter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
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
  assetDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});