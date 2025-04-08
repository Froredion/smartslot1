import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { Plus, X, Check, Search } from 'lucide-react-native';

interface CategoryManagerProps {
  categories: string[];
  onAddCategory: (category: string) => void;
  onDeleteCategory: (category: string) => void;
}

export function CategoryManager({
  categories,
  onAddCategory,
  onDeleteCategory,
}: CategoryManagerProps) {
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [selectedToRemove, setSelectedToRemove] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      onAddCategory(newCategory.trim());
      setNewCategory('');
      setAddModalVisible(false);
    }
  };

  const handleToggleRemove = (category: string) => {
    const newSelected = new Set(selectedToRemove);
    if (newSelected.has(category)) {
      newSelected.delete(category);
    } else {
      newSelected.add(category);
    }
    setSelectedToRemove(newSelected);
  };

  const handleRemoveSelected = () => {
    selectedToRemove.forEach(category => onDeleteCategory(category));
    setSelectedToRemove(new Set());
    setRemoveModalVisible(false);
  };

  const filteredCategories = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return categories;
    return categories.filter(category => 
      category.toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

  const handleCloseRemoveModal = () => {
    setRemoveModalVisible(false);
    setSelectedToRemove(new Set());
    setSearchQuery('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => setRemoveModalVisible(true)}
          >
            <Text style={styles.removeButtonText}>Remove Categories</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setAddModalVisible(true)}
          >
            <Plus size={20} color="white" />
            <Text style={styles.addButtonText}>Add Category</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Add Category Modal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Category</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setAddModalVisible(false)}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={newCategory}
                onChangeText={setNewCategory}
                placeholder="Enter category name"
                autoFocus
              />
              <TouchableOpacity
                style={[styles.saveButton, !newCategory.trim() && styles.disabledButton]}
                onPress={handleAddCategory}
                disabled={!newCategory.trim()}
              >
                <Text style={styles.saveButtonText}>Add Category</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Remove Categories Modal */}
      <Modal
        visible={removeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseRemoveModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCloseRemoveModal}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Remove Categories</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseRemoveModal}
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
                    selectedToRemove.has(category) && styles.selectedToRemove
                  ]}
                  onPress={() => handleToggleRemove(category)}
                >
                  <Text style={[
                    styles.categoryText,
                    selectedToRemove.has(category) && styles.selectedToRemoveText
                  ]}>
                    {category}
                  </Text>
                  {selectedToRemove.has(category) && (
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

            <TouchableOpacity
              style={[
                styles.removeSelectedButton,
                selectedToRemove.size === 0 && styles.disabledButton
              ]}
              onPress={handleRemoveSelected}
              disabled={selectedToRemove.size === 0}
            >
              <Text style={styles.removeSelectedButtonText}>
                Remove Selected ({selectedToRemove.size})
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    marginLeft: 4,
    fontWeight: '500',
  },
  removeButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  inputContainer: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
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
  selectedToRemove: {
    backgroundColor: '#FF3B30',
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
  },
  selectedToRemoveText: {
    color: 'white',
  },
  removeSelectedButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  removeSelectedButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
  noResults: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    color: '#666',
    fontSize: 16,
  },
}); 