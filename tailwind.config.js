/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/flowbite-react/**/*.js',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      boxShadow: {
        'soft-md': '0px 0px 20px 0px rgba(0,0,0,0.2)',
        'soft-lg': '0px 0px 20px 0px rgba(176, 48, 11, 0.4)',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        'primary-500': '#B0300B',
        'primary-700': '#952507',
        'primary-900': '#77250C',
      },
      screens: {
        widescreen: {
          raw: '(min-aspect-ratio: 3/2)',
        },
        tallscreen: {
          raw: '(max-aspect-ratio: 13/20)',
        },
      },
      keyframes: {
        'accordion-down': {
          from: {height: 0},
          to: {height: 'var(--radix-accordion-content-height)'},
        },
        'accordion-up': {
          from: {height: 'var(--radix-accordion-content-height)'},
          to: {height: 0},
        },
        'open-menu': {
          '0%': {transform: 'scaleY(0)'},
          '80%': {transform: 'scaleY(1.2)'},
          '100%': {transform: 'scaleY(1)'},
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'open-menu': 'open-menu 0.3s ease-in-out forwards',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
