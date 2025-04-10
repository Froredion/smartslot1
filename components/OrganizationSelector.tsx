import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { X, Building2, ChevronRight, Plus, CreditCard as Edit2 } from 'lucide-react-native';
import { Organization } from '@/lib/firebase/firestore';

interface OrganizationSelectorProps {
  visible: boolean;
  onClose: () => void;
  organizations: Organization[];
  selectedOrg: Organization | null;
  onSelectOrg: (org: Organization) => void;
  onCreateOrg: () => void;
  onEditOrg: (org: Organization) => void;
}

export function OrganizationSelector({
  visible,
  onClose,
  organizations,
  selectedOrg,
  onSelectOrg,
  onCreateOrg,
  onEditOrg,
}: OrganizationSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Organizations</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.createButton}
            onPress={onCreateOrg}
          >
            <Plus size={20} color="#007AFF" />
            <Text style={styles.createButtonText}>Create Organization</Text>
          </TouchableOpacity>

          <ScrollView style={styles.orgList}>
            {filteredOrgs.map(org => (
              <View key={org.id} style={styles.orgItem}>
                <TouchableOpacity
                  style={[
                    styles.orgButton,
                    selectedOrg?.id === org.id && styles.selectedOrgButton
                  ]}
                  onPress={() => {
                    onSelectOrg(org);
                    onClose();
                  }}
                >
                  <Building2 
                    size={20} 
                    color={selectedOrg?.id === org.id ? 'white' : '#666'} 
                  />
                  <Text style={[
                    styles.orgName,
                    selectedOrg?.id === org.id && styles.selectedOrgName
                  ]}>
                    {org.name}
                  </Text>
                  {selectedOrg?.id === org.id && (
                    <ChevronRight size={20} color="white" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => onEditOrg(org)}
                >
                  <Edit2 size={16} color="#007AFF" />
                </TouchableOpacity>
              </View>
            ))}

            {filteredOrgs.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No organizations found</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5F1FF',
    margin: 20,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  orgList: {
    padding: 20,
  },
  orgItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  orgButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  selectedOrgButton: {
    backgroundColor: '#007AFF',
  },
  orgName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  selectedOrgName: {
    color: 'white',
  },
  editButton: {
    padding: 8,
    backgroundColor: '#E5F1FF',
    borderRadius: 8,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
  },
});