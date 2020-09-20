module.exports = {
  purge: [],
  theme: {
    fontFamily: {
      sans: ['"public sans"', '-apple-system', 'BlinkMacSystemFont'],
      serif: ['Georgia', 'Cambria'],
      mono: ['SFMono-Regular', 'Menlo', 'monospace'],
      display: ['Oswald'],
      body: ['"pt sans"', 'Open Sans'],
    },
    extend: {
      colors: {
        background: '#eff0f3',
        'paragraph-inverted': '#fffffe',
        secondary: '#d9376e',
        headline: '#0d0d0d',
        paragraph: '#2a2a2a',
        primary: '#ff8e3c',
        'orange-magenta': ['#ff8e3c', '#d9376e'],
      },
      fontSize: {
        '7xl': '5rem',
      },
    },
    linearBorderGradients: (theme) => ({
      colors: theme('colors'),
    }),
  },
  variants: {
    backgroundClip: ['responsive', 'hover', 'focus'],
  },
  plugins: [require('tailwindcss-border-gradients')()],
};
