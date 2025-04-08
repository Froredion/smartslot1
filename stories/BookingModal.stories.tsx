import React from 'react';
import { View } from 'react-native';
import { BookingModal } from '../components/BookingModal';

export default {
  title: 'Components/BookingModal',
  component: BookingModal,
  decorators: [
    (Story) => (
      <View style={{ flex: 1 }}>
        <Story />
      </View>
    ),
  ],
};

const mockAssets = [
  {
    id: '1',
    name: 'Luxury Car',
    type: 'Vehicle',
    pricePerDay: 100,
  },
  {
    id: '2',
    name: 'Conference Room A',
    type: 'Room',
    pricePerDay: 200,
  },
  {
    id: '3',
    name: 'Beach House',
    type: 'Property',
    pricePerDay: 500,
  },
];

const mockBookings = [
  {
    id: '1',
    assetId: '2',
    date: new Date('2024-04-08'),
  },
];

const Template = (args) => <BookingModal {...args} />;

export const Default = Template.bind({});
Default.args = {
  visible: true,
  onClose: () => console.log('Modal closed'),
  onConfirm: (assetId) => console.log('Booking confirmed for asset:', assetId),
  selectedDate: new Date('2024-04-08'),
  assets: mockAssets,
  bookings: mockBookings,
};

export const WithNoBookings = Template.bind({});
WithNoBookings.args = {
  visible: true,
  onClose: () => console.log('Modal closed'),
  onConfirm: (assetId) => console.log('Booking confirmed for asset:', assetId),
  selectedDate: new Date('2024-04-08'),
  assets: mockAssets,
  bookings: [],
}; 