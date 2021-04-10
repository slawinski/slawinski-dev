module.exports = {
  purge: [
    './src/**/*.html',
    './src/**/*.vue',
    './src/**/*.jsx',
    './dist/**/*.html',
  ],
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
      // typography: {
      //   DEFAULT: {
      //     css: {
      //       pre: {
      //       color: "#1F2933",
      //       backgroundColor: '#F5F7FA,'
      //     },
      //     "pre code::before": {
      //       "padding-left": "unset"
      //     },
      //     "pre code::after": {
      //       "padding-right": "unset"
      //     },
      //     code: {
      //       backgroundColor: "#F5F7FA",
      //       color: "#DD1144",
      //       fontWeight: "400",
      //       "border-radius": "0.25rem"
      //     },
      //     "code::before": {
      //       content: '""',
      //       "padding-left": "0.25rem"
      //     },
      //     "code::after": {
      //       content: '""',
      //       "padding-right": "0.25rem"
      //     }
      //     },
      //   },
      // },
    },
    linearBorderGradients: (theme) => ({
      colors: theme('colors'),
    }),
  },
  variants: {
    backgroundClip: ['responsive', 'hover', 'focus'],
  },
  plugins: [
    require('tailwindcss-border-gradients')(),
    require('@tailwindcss/typography'),
  ],
};
