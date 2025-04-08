import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
} from 'react-native';
import { X, Search } from 'lucide-react-native';
import * as Localization from 'expo-localization';
import { getCurrencyFromCountry, getCountryFromLocation } from '../utils/currencyUtils';

interface Currency {
  code: string;
  symbol: string;
  name: string;
  country: string;
}

const CURRENCIES: Currency[] = [
  // Major Global Currencies
  { code: 'USD', symbol: '$', name: 'US Dollar', country: 'United States' },
  { code: 'EUR', symbol: '€', name: 'Euro', country: 'European Union' },
  { code: 'GBP', symbol: '£', name: 'British Pound', country: 'United Kingdom' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', country: 'Japan' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', country: 'Australia' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', country: 'Canada' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', country: 'Switzerland' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', country: 'China' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', country: 'India' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble', country: 'Russia' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', country: 'Brazil' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', country: 'South Korea' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', country: 'Singapore' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', country: 'New Zealand' },
  { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso', country: 'Mexico' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', country: 'Hong Kong' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', country: 'Turkey' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', country: 'Saudi Arabia' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', country: 'Sweden' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', country: 'Norway' },
  // Additional Major Currencies
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', country: 'South Africa' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Złoty', country: 'Poland' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', country: 'Thailand' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', country: 'Indonesia' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', country: 'Hungary' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', country: 'Czech Republic' },
  { code: 'ILS', symbol: '₪', name: 'Israeli New Shekel', country: 'Israel' },
  { code: 'CLP', symbol: 'CL$', name: 'Chilean Peso', country: 'Chile' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', country: 'Philippines' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', country: 'United Arab Emirates' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', country: 'Malaysia' },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu', country: 'Romania' },
  { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev', country: 'Bulgaria' },
  { code: 'HRK', symbol: 'kn', name: 'Croatian Kuna', country: 'Croatia' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone', country: 'Denmark' },
  { code: 'ISK', symbol: 'kr', name: 'Icelandic Króna', country: 'Iceland' },
  { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia', country: 'Ukraine' },
  { code: 'KZT', symbol: '₸', name: 'Kazakhstani Tenge', country: 'Kazakhstan' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', country: 'Pakistan' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', country: 'Bangladesh' },
  { code: 'LKR', symbol: '₨', name: 'Sri Lankan Rupee', country: 'Sri Lanka' },
];

interface CurrencySelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (currency: string) => void;
  currentCurrency: string;
}

export function CurrencySelector({
  visible,
  onClose,
  onSelect,
  currentCurrency,
}: CurrencySelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [sortedCurrencies, setSortedCurrencies] = useState<Currency[]>([]);

  useEffect(() => {
    const detectUserCountry = async () => {
      try {
        // First try to get country from location
        const countryFromLocation = await getCountryFromLocation();
        console.log('CurrencySelector - Country from location:', countryFromLocation);

        if (countryFromLocation) {
          setUserCountry(countryFromLocation);
          const userCurrency = getCurrencyFromCountry(countryFromLocation);
          console.log('CurrencySelector - Setting currency based on location:', userCurrency);
          
          // Sort currencies based on user's country and USD preference
          const sorted = [...CURRENCIES].sort((a, b) => {
            if (a.code === userCurrency) return -1;
            if (b.code === userCurrency) return 1;
            if (a.code === 'USD') return -1;
            if (b.code === 'USD') return 1;
            return a.name.localeCompare(b.name);
          });
          setSortedCurrencies(sorted);
          return;
        }

        // If location detection fails, fall back to locale detection
        const locales = await Localization.getLocales();
        console.log('CurrencySelector - Falling back to locale detection:', locales);
        
        if (locales && locales.length > 0) {
          // First try to find a US locale
          const usLocale = locales.find(locale => locale.regionCode === 'US');
          const primaryLocale = usLocale || locales[0];
          console.log('CurrencySelector - Primary locale:', primaryLocale);
          
          // Try to get country code from regionCode first
          let countryCode = primaryLocale.regionCode;
          
          // If regionCode is not available, try to extract from languageCode
          if (!countryCode && primaryLocale.languageCode) {
            const parts = primaryLocale.languageCode.split('-');
            if (parts.length > 1) {
              countryCode = parts[1].toUpperCase();
            }
          }
          
          console.log('CurrencySelector - Detected country code:', countryCode);
          
          if (countryCode) {
            setUserCountry(countryCode);
            const userCurrency = getCurrencyFromCountry(countryCode);
            console.log('CurrencySelector - Setting currency based on locale:', userCurrency);
            
            // Sort currencies based on user's country and USD preference
            const sorted = [...CURRENCIES].sort((a, b) => {
              if (a.code === userCurrency) return -1;
              if (b.code === userCurrency) return 1;
              if (a.code === 'USD') return -1;
              if (b.code === 'USD') return 1;
              return a.name.localeCompare(b.name);
            });
            setSortedCurrencies(sorted);
          } else {
            console.log('CurrencySelector - No country code detected, using USD as default');
            const sorted = [...CURRENCIES].sort((a, b) => {
              if (a.code === 'USD') return -1;
              if (b.code === 'USD') return 1;
              return a.name.localeCompare(b.name);
            });
            setSortedCurrencies(sorted);
          }
        } else {
          console.log('CurrencySelector - No locales detected, using USD as default');
          const sorted = [...CURRENCIES].sort((a, b) => {
            if (a.code === 'USD') return -1;
            if (b.code === 'USD') return 1;
            return a.name.localeCompare(b.name);
          });
          setSortedCurrencies(sorted);
        }
      } catch (error) {
        console.error('CurrencySelector - Error detecting country:', error);
        // If country detection fails, sort with USD first
        const sorted = [...CURRENCIES].sort((a, b) => {
          if (a.code === 'USD') return -1;
          if (b.code === 'USD') return 1;
          return a.name.localeCompare(b.name);
        });
        setSortedCurrencies(sorted);
      }
    };
    detectUserCountry();
  }, []);

  const filteredCurrencies = sortedCurrencies.filter(currency =>
    currency.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    currency.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    currency.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCurrencyItem = ({ item }: { item: Currency }) => (
    <TouchableOpacity
      style={[
        styles.currencyItem,
        currentCurrency === item.code && styles.selectedCurrency
      ]}
      onPress={() => {
        onSelect(item.code);
        onClose();
      }}
    >
      <View style={styles.currencyInfo}>
        <Text style={styles.currencyCode}>{item.code}</Text>
        <Text style={styles.currencySymbol}>{item.symbol}</Text>
      </View>
      <View style={styles.currencyDetails}>
        <Text style={styles.currencyName}>{item.name}</Text>
        <Text style={styles.currencyCountry}>{item.country}</Text>
      </View>
    </TouchableOpacity>
  );

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
            <Text style={styles.modalTitle}>Select Currency</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Search size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search currency or country..."
              placeholderTextColor="#999"
            />
          </View>

          <FlatList
            data={filteredCurrencies}
            renderItem={renderCurrencyItem}
            keyExtractor={item => item.code}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
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
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    height: '80%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#333',
  },
  listContent: {
    paddingHorizontal: 20,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  selectedCurrency: {
    backgroundColor: '#F0F8FF',
    borderColor: '#007AFF',
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  currencySymbol: {
    fontSize: 16,
    color: '#666',
  },
  currencyDetails: {
    flex: 1,
  },
  currencyName: {
    fontSize: 14,
    color: '#333',
  },
  currencyCountry: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
}); 