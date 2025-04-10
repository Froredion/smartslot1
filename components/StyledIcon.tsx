import React from 'react';
import { View, StyleSheet } from 'react-native';
import * as Icons from 'lucide-react-native';

interface StyledIconProps {
  name: keyof typeof Icons;
  size?: number;
  color?: string;
  style?: any;
}

export const StyledIcon: React.FC<StyledIconProps> = ({ name, size = 24, color = '#000', style }) => {
  const IconComponent = Icons[name];

  return (
    <View style={[styles.container, style]}>
      <IconComponent 
        size={size} 
        color={color}
        strokeWidth={2}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 