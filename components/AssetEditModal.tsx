import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ScrollView,
} from 'react-native';
import { X, Trash2, Search, Check } from 'lucide-react-native';

interface Asset {
  id: string;
  name: string;
  type: string;
  description?: string;
  status: 'Available' | 'Unavailable';
}

interface AssetEditModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (asset: Asset) => void;
  onDelete: (assetId: string) => void;
  asset: Asset | null;
  categories: string[];
  isNewAsset?: boolean;
}

export function AssetEditModal({
  visible,
  onClose,
  onSave,
  onDelete,
  asset,
  categories,
  isNewAsset = false,
}: AssetEditModalProps) {
  const [editedAsset, setEditedAsset] = useState<Asset | null>(
    asset || {
      id: Date.now().toString(),
      name: '',
      type: '',
      status: 'Available',
    }
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategorySearch, setShowCategorySearch] = useState(false);

  React.useEffect(() => {
    setEditedAsset(
      asset || {
        id: Date.now().toString(),
        name: '',
        type: '',
        status: 'Available',
      }
    );
  }, [asset]);

  const handleSave = () => {
    if (editedAsset) {
      onSave(editedAsset);
      onClose();
    }
  };

  const handleDelete = () => {
    if (editedAsset) {
      onDelete(editedAsset.id);
      onClose();
    }
  };

  const filteredCategories = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return categories;
    return categories.filter(category => 
      category.toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

  const handleClose = () => {
    setShowCategorySearch(false);
    setSearchQuery('');
    onClose();
  };

  if (!editedAsset) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <TouchableOpacity
          style={styles.modalContent}
          activeOpacity={1}
          onPress={e => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isNewAsset ? 'New Asset' : 'Edit Asset'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={editedAsset.name}
                onChangeText={(text) => setEditedAsset({ ...editedAsset, name: text })}
                placeholder="Asset name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type</Text>
              <TouchableOpacity
                style={styles.categoryButton}
                onPress={() => setShowCategorySearch(true)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  !editedAsset.type && styles.placeholderText
                ]}>
                  {editedAsset.type || 'Select category'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editedAsset.description}
                onChangeText={(text) => setEditedAsset({ ...editedAsset, description: text })}
                placeholder="Asset description"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.statusContainer}>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    editedAsset.status === 'Available' && styles.statusButtonActive
                  ]}
                  onPress={() => setEditedAsset({ ...editedAsset, status: 'Available' })}
                >
                  <Text style={[
                    styles.statusButtonText,
                    editedAsset.status === 'Available' && styles.statusButtonTextActive
                  ]}>Available</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    editedAsset.status === 'Unavailable' && styles.statusButtonActive
                  ]}
                  onPress={() => setEditedAsset({ ...editedAsset, status: 'Unavailable' })}
                >
                  <Text style={[
                    styles.statusButtonText,
                    editedAsset.status === 'Unavailable' && styles.statusButtonTextActive
                  ]}>Unavailable</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            {!isNewAsset && (
              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={handleDelete}
              >
                <Trash2 size={20} color="white" />
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={!editedAsset.name.trim() || !editedAsset.type}
            >
              <Text style={styles.buttonText}>
                {isNewAsset ? 'Create Asset' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Category Search Modal */}
          <Modal
            visible={showCategorySearch}
            transparent
            animationType="slide"
            onRequestClose={() => setShowCategorySearch(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Category</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowCategorySearch(false)}
                  >
                    <X size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                  <Search size={20} color="#666" />
                  <TextInput
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search categories..."
                    placeholderTextColor="#999"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      style={styles.clearSearch}
                      onPress={() => setSearchQuery('')}
                    >
                      <X size={16} color="#666" />
                    </TouchableOpacity>
                  )}
                </View>

                <ScrollView style={styles.categoryList}>
                  {filteredCategories.map(category => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryItem,
                        editedAsset.type === category && styles.selectedCategory
                      ]}
                      onPress={() => {
                        setEditedAsset({ ...editedAsset, type: category });
                        setShowCategorySearch(false);
                        setSearchQuery('');
                      }}
                    >
                      <Text style={[
                        styles.categoryText,
                        editedAsset.type === category && styles.selectedCategoryText
                      ]}>
                        {category}
                      </Text>
                      {editedAsset.type === category && (
                        <Check size={20} color="white" />
                      )}
                    </TouchableOpacity>
                  ))}
                  {filteredCategories.length === 0 && (
                    <View style={styles.noResults}>
                      <Text style={styles.noResultsText}>No categories found</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    height: '80%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    position: 'relative',
    zIndex: 1001,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 8,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  categoryButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryButtonText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  statusButtonText: {
    fontSize: 16,
    color: '#666',
  },
  statusButtonTextActive: {
    color: 'white',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#333',
  },
  clearSearch: {
    padding: 4,
  },
  categoryList: {
    maxHeight: 400,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  selectedCategory: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
  },
  selectedCategoryText: {
    color: 'white',
  },
  noResults: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    color: '#666',
    fontSize: 16,
  },
}); 