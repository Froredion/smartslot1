import { View, Text } from 'react-native';
import { ComponentMeta, ComponentStory } from '@storybook/react-native';

const AppComponent = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Welcome to SmartSlot!</Text>
    </View>
  );
};

const AppMeta: ComponentMeta<typeof AppComponent> = {
  title: 'App',
  component: AppComponent,
};

export default AppMeta;

type AppStory = ComponentStory<typeof AppComponent>;

export const Default: AppStory = () => <AppComponent />; 