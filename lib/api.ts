const API_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:8000/api'
  : 'https://your-production-api.com/api';

export const api = {
  assets: {
    getAll: async () => {
      const response = await fetch(`${API_URL}/assets`);
      if (!response.ok) throw new Error('Failed to fetch assets');
      return response.json();
    },
    create: async (asset: any) => {
      const response = await fetch(`${API_URL}/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(asset),
      });
      if (!response.ok) throw new Error('Failed to create asset');
      return response.json();
    },
  },
  bookings: {
    getByUser: async (userId: string) => {
      const response = await fetch(`${API_URL}/bookings/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch bookings');
      return response.json();
    },
    create: async (booking: any) => {
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(booking),
      });
      if (!response.ok) throw new Error('Failed to create booking');
      return response.json();
    },
  },
};