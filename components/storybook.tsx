import { getStorybookUI, configure, addDecorator } from '@storybook/react-native';
import { withKnobs } from '@storybook/addon-knobs';

// Import stories
configure(() => {
  require('./stories/TimeSlot.stories');
  require('./stories/BookingModal.stories');
}, module);

// Enable knobs for all stories
addDecorator(withKnobs);

// Refer to https://github.com/storybookjs/react-native/tree/main/app/react-native#getstorybookui-options
// to learn more about the options
const StorybookUIRoot = getStorybookUI({
  asyncStorage: null,
});

export default StorybookUIRoot; 