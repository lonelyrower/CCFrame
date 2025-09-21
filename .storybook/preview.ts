import type { Preview } from '@storybook/react';
import '../app/styles/tokens.css';
import '../app/globals.css';
import { withThemeByClassName } from '@storybook/addon-themes';

declare const window: Window & { __STORYBOOK_SELECTED_THEME__?: string };

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/
      }
    },
    backgrounds: {
      default: 'surface',
      values: [
        { name: 'surface', value: '#f4f6f9' },
        { name: 'dark', value: '#0f1117' }
      ]
    },
    layout: 'centered'
  },
  decorators: [
    withThemeByClassName({
      themes: {
        light: 'light',
        dark: 'dark'
      },
      defaultTheme: 'light',
      parentSelector: 'body'
    })
  ]
};

export default preview;
