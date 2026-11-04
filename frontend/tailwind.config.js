module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream: '#f5f3ef',
        ink: '#111111',
        muted: '#5c5850',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,.04)',
      },
    },
  },
  plugins: [],
};
