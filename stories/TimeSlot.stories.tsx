import React from 'react';
import { View } from 'react-native';
import { TimeSlot } from '../components/TimeSlot';

export default {
  title: 'Components/TimeSlot',
  component: TimeSlot,
  decorators: [
    (Story) => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
};

const Template = (args) => <TimeSlot {...args} />;

export const Available = Template.bind({});
Available.args = {
  time: new Date('2024-04-08T10:00:00'),
  isBooked: false,
  onPress: () => console.log('Time slot pressed'),
};

export const Booked = Template.bind({});
Booked.args = {
  time: new Date('2024-04-08T11:00:00'),
  isBooked: true,
  onPress: () => console.log('Time slot pressed'),
}; 