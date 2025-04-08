import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';

const SAMPLE_ASSETS = [
  { id: '1', name: 'Car A-123', type: 'Vehicle', status: 'Available' },
  { id: '2', name: 'Room 201', type: 'Room', status: 'Booked' },
  { id: '3', name: 'Villa Paradise', type: 'Property', status: 'Available' },
];

export default function Assets() {
  const insets = useSafeAreaInsets();

  const renderAssetItem = ({ item }) => (
    <TouchableOpacity style={styles.assetCard}>
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

      <FlatList
        data={SAMPLE_ASSETS}
        renderItem={renderAssetItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
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
  },
});