module.exports = {
  purge: [],
  theme: {
    fontFamily: {
      'sans': ['"public sans"', '-apple-system', 'BlinkMacSystemFont'],
      'serif': ['Georgia', 'Cambria'], 
      'mono': ['SFMono-Regular', 'Menlo', 'monospace'],
      'display': ['Oswald'], 
      'body': ['"pt sans"', 'Open Sans'],
    },
    extend: {
      colors: {
        background: '#eff0f3',
        secondary: '#fffffe',
        headline: '#0d0d0d',
        paragraph: '#2a2a2a',
        button: '#ff8e3c',
      },
      fontSize: {
        '7xl': '5rem',
      }
    },
  },
  variants: {},
  plugins: [],
}
