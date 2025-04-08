import * as Location from 'expo-location';

// Import environment variables
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export const getCurrencyFromCountry = (countryCode: string): string => {
  // Map of country codes to currency codes
  const countryToCurrency: { [key: string]: string } = {
    'US': 'USD',
    'GB': 'GBP',
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
    'ZA': 'ZAR',
    'PL': 'PLN',
    'TH': 'THB',
    'ID': 'IDR',
    'HU': 'HUF',
    'CZ': 'CZK',
    'IL': 'ILS',
    'CL': 'CLP',
    'PH': 'PHP',
    'AE': 'AED',
    'MY': 'MYR',
    'RO': 'RON',
    'BG': 'BGN',
    'HR': 'HRK',
    'DK': 'DKK',
    'IS': 'ISK',
    'UA': 'UAH',
    'KZ': 'KZT',
    'PK': 'PKR',
    'BD': 'BDT',
    'LK': 'LKR',
  };
  return countryToCurrency[countryCode] || 'USD';
};

export const getCountryFromLocation = async (): Promise<string | null> => {
  try {
    console.log('Starting location detection...');
    
    // Request location permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    console.log('Location permission status:', status);
    
    if (status !== 'granted') {
      console.log('Location permission not granted');
      return null;
    }

    // Get current location
    console.log('Getting current position...');
    const location = await Location.getCurrentPositionAsync({});
    console.log('Location coordinates:', {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      altitude: location.coords.altitude,
      altitudeAccuracy: location.coords.altitudeAccuracy,
      heading: location.coords.heading,
      speed: location.coords.speed,
    });

    // Use Google Places API for reverse geocoding
    if (!GOOGLE_MAPS_API_KEY) {
      console.log('Google Maps API key not found in environment variables');
      return null;
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.coords.latitude},${location.coords.longitude}&key=${GOOGLE_MAPS_API_KEY}`;
    console.log('Fetching from Google Places API...');
    console.log('URL:', url.replace(GOOGLE_MAPS_API_KEY, 'API_KEY_HIDDEN')); // Log URL without exposing the API key
    
    const response = await fetch(url);
    const data = await response.json();
    console.log('Google Places API response:', data);

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      // Look for country in address components
      const addressComponents = data.results[0].address_components;
      const countryComponent = addressComponents.find(
        (component: any) => component.types.includes('country')
      );

      if (countryComponent) {
        const countryCode = countryComponent.short_name;
        console.log('Successfully detected country from location:', countryCode);
        return countryCode;
      }
    }

    console.log('No country code found in response');
    return null;
  } catch (error) {
    console.error('Error in getCountryFromLocation:', error);
    return null;
  }
}; 