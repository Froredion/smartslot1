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
  Alert,
} from 'react-native';
import { X, Trash2, Search, Check, Clock } from 'lucide-react-native';
import { TimeSlotManagerModal } from './TimeSlotManagerModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import type { Asset, TimeSlot } from '@/lib/firebase/firestore';

interface AssetEditModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => void;
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
  const [editedAsset, setEditedAsset] = useState<Asset | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategorySearch, setShowCategorySearch] = useState(false);
  const [showTimeSlotManager, setShowTimeSlotManager] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  React.useEffect(() => {
    if (visible) {
      if (isNewAsset && categories.length > 0) {
        setEditedAsset({
          id: Date.now().toString(),
          name: '',
          type: categories[0],
          status: 'Available',
          description: '',
          pricePerDay: 0,
          agentFee: 10, // Default 10% agent fee
          currency: 'USD',
          bookingType: 'full-day',
          timeSlots: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        setEditedAsset(asset || {
          id: Date.now().toString(),
          name: '',
          type: '',
          status: 'Available',
          description: '',
          pricePerDay: 0,
          agentFee: 10,
          currency: 'USD',
          bookingType: 'full-day',
          timeSlots: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
  }, [asset, visible, isNewAsset, categories]);

  const handleSave = () => {
    if (!editedAsset) return;
    console.log('AssetEditModal - Saving asset:', editedAsset);

    const cleanAsset = {
      name: editedAsset.name || '',
      type: editedAsset.type || '',
      status: editedAsset.status || 'Available',
      description: editedAsset.description || '',
      pricePerDay: editedAsset.pricePerDay || 0,
      currency: editedAsset.currency || 'USD',
      bookingType: editedAsset.bookingType || 'full-day',
      timeSlots: editedAsset.timeSlots || [],
      maxBookingsPerDay: editedAsset.maxBookingsPerDay,
      agentFee: editedAsset.agentFee || 10,
    };

    onSave(cleanAsset);
    handleClose();
  };

  const handleDelete = () => {
    if (!editedAsset?.id) {
      console.error('AssetEditModal - Cannot delete: No asset ID');
      return;
    }
    setShowDeleteConfirmation(true);
  };

  const handleClose = () => {
    console.log('AssetEditModal - Closing modal');
    setShowCategorySearch(false);
    setSearchQuery('');
    setEditedAsset(null);
    onClose();
  };

  const filteredCategories = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return categories;
    return categories.filter(category => 
      category.toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

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
                value={editedAsset.name || ''}
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
                value={editedAsset.description || ''}
                onChangeText={(text) => setEditedAsset({ ...editedAsset, description: text })}
                placeholder="Asset description"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Price per Day</Text>
              <TextInput
                style={styles.input}
                value={editedAsset?.pricePerDay?.toString() || '0'}
                onChangeText={(text) => {
                  const price = parseFloat(text) || 0;
                  setEditedAsset(prev => prev ? ({ ...prev, pricePerDay: price }) : null);
                }}
                keyboardType="numeric"
                placeholder="Enter price per day"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Default Agent Fee (%)</Text>
              <TextInput
                style={styles.input}
                value={editedAsset?.agentFee?.toString() || '10'}
                onChangeText={(text) => {
                  const fee = parseFloat(text) || 0;
                  setEditedAsset(prev => prev ? ({ ...prev, agentFee: fee }) : null);
                }}
                keyboardType="numeric"
                placeholder="Enter default agent fee percentage"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Booking Type</Text>
              <View style={styles.bookingTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.bookingTypeButton,
                    editedAsset.bookingType === 'full-day' && styles.bookingTypeActive
                  ]}
                  onPress={() => setEditedAsset({ ...editedAsset, bookingType: 'full-day' })}
                >
                  <Text style={[
                    styles.bookingTypeText,
                    editedAsset.bookingType === 'full-day' && styles.bookingTypeTextActive
                  ]}>Full Day</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.bookingTypeButton,
                    editedAsset.bookingType === 'time-slots' && styles.bookingTypeActive
                  ]}
                  onPress={() => setEditedAsset({ ...editedAsset, bookingType: 'time-slots' })}
                >
                  <Text style={[
                    styles.bookingTypeText,
                    editedAsset.bookingType === 'time-slots' && styles.bookingTypeTextActive
                  ]}>Time Slots</Text>
                </TouchableOpacity>
              </View>
            </View>

            {editedAsset.bookingType === 'time-slots' && (
              <View style={styles.inputGroup}>
                <View style={styles.timeSlotHeader}>
                  <Text style={styles.label}>Time Slots</Text>
                  <TouchableOpacity
                    style={styles.manageTimeSlotsButton}
                    onPress={() => setShowTimeSlotManager(true)}
                  >
                    <Clock size={20} color="#007AFF" />
                    <Text style={styles.manageTimeSlotsText}>
                      {editedAsset.timeSlots?.length 
                        ? `Manage ${editedAsset.timeSlots.length} Slots`
                        : 'Add Time Slots'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {(!editedAsset.timeSlots || editedAsset.timeSlots.length === 0) && (
                  <Text style={styles.noTimeSlotsText}>
                    No time slots configured
                  </Text>
                )}
              </View>
            )}

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
              style={[
                styles.button, 
                styles.saveButton,
                (!editedAsset.name?.trim() || !editedAsset.type) && styles.disabledButton
              ]}
              onPress={handleSave}
              disabled={!editedAsset.name?.trim() || !editedAsset.type}
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
            <TouchableOpacity 
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowCategorySearch(false)}
            >
              <TouchableOpacity 
                style={styles.modalContent}
                activeOpacity={1}
                onPress={e => e.stopPropagation()}
              >
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
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>

          {/* Time Slot Manager Modal */}
          <TimeSlotManagerModal
            visible={showTimeSlotManager}
            onClose={() => setShowTimeSlotManager(false)}
            onSave={(timeSlots) => {
              setEditedAsset({ ...editedAsset, timeSlots });
              setShowTimeSlotManager(false);
            }}
            initialTimeSlots={editedAsset.timeSlots || []}
          />

          <DeleteConfirmationModal
            visible={showDeleteConfirmation}
            onClose={() => setShowDeleteConfirmation(false)}
            onConfirm={() => {
              console.log('AssetEditModal - Deleting asset:', editedAsset?.id);
              onDelete(editedAsset!.id);
              handleClose();
              setShowDeleteConfirmation(false);
            }}
            title="Delete Asset"
            message="Are you sure you want to delete this asset? This action cannot be undone and will remove all associated bookings."
          />
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
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    flex: 1,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  disabledButton: {
    backgroundColor: '#999',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: 20,
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
    paddingHorizontal: 20,
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
  bookingTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  bookingTypeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  bookingTypeActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  bookingTypeText: {
    fontSize: 16,
    color: '#666',
  },
  bookingTypeTextActive: {
    color: 'white',
  },
  timeSlotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  manageTimeSlotsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  manageTimeSlotsText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  noTimeSlotsText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export { AssetEditModal }