import * as Location from 'expo-location';

const COUNTRY_CURRENCY_MAP: { [key: string]: string } = {
  'US': 'USD',
  'GB': 'GBP',
  'EU': 'EUR',
  'JP': 'JPY',
  'AU': 'AUD',
  'CA': 'CAD',
  'CH': 'CHF',
  'CN': 'CNY',
  'IN': 'INR',
  'RU': 'RUB',
  'BR': 'BRL',
  'KR': 'KRW',
  'SG': 'SGD',
  'NZ': 'NZD',
  'MX': 'MXN',
  'HK': 'HKD',
  'TR': 'TRY',
  'SA': 'SAR',
  'SE': 'SEK',
  'NO': 'NOK',
  'DK': 'DKK',
  // Add more country-currency mappings as needed
};

export const getCurrencyFromCountry = (countryCode: string): string => {
  return COUNTRY_CURRENCY_MAP[countryCode] || 'USD';
};

export const getCountryFromLocation = async (): Promise<string | null> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Location permission denied');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({});
    const geocode = await Location.reverseGeocodeAsync({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

    if (geocode.length > 0 && geocode[0].isoCountryCode) {
      return geocode[0].isoCountryCode;
    }

    return null;
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
};