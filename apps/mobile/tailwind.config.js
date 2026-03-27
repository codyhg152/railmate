/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        card: '#1C1C1E',
        'card-secondary': '#2C2C2E',
        border: '#3A3A3C',
        text: '#FFFFFF',
        'text-secondary': '#8E8E93',
        'text-tertiary': '#636366',
        primary: '#007AFF',
        success: '#34C759',
        warning: '#FF9500',
        danger: '#FF3B30',
        info: '#5AC8FA',
      },
    },
  },
  plugins: [],
};
