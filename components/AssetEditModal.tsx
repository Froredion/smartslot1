import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { X, Trash2 } from 'lucide-react-native';

interface Asset {
  id: string;
  name: string;
  type: string;
  description?: string;
  status: string;
}

interface AssetEditModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (asset: Asset) => void;
  onDelete: (assetId: string) => void;
  asset: Asset | null;
}

export function AssetEditModal({
  visible,
  onClose,
  onSave,
  onDelete,
  asset,
}: AssetEditModalProps) {
  const [editedAsset, setEditedAsset] = useState<Asset | null>(asset);

  React.useEffect(() => {
    setEditedAsset(asset);
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

  if (!editedAsset) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Asset</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
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
              <TextInput
                style={styles.input}
                value={editedAsset.type}
                onChangeText={(text) => setEditedAsset({ ...editedAsset, type: text })}
                placeholder="Asset type"
              />
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
              <TextInput
                style={styles.input}
                value={editedAsset.status}
                onChangeText={(text) => setEditedAsset({ ...editedAsset, status: text })}
                placeholder="Asset status"
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={handleDelete}
            >
              <Trash2 size={20} color="white" />
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
}); 