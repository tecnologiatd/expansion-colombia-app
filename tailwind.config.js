/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./presentation/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {

      colors: {
        // Tokens del tema (mantener en sync con presentation/theme/Colors.ts)
        background: '#0F1422',
        surface: '#171D2E',
        'surface-raised': '#222A42',
        line: '#2A3350',
        brand: '#a855f7',
        'brand-pressed': '#9333ea',
        muted: '#9AA3B5',

        primary: '#0F1422',
        secondary: '#a855f7',
        medellin: '#292750',
        caribe: '#008D36',
        bogota: '#BE1622',
        cafetero: '#F9B233',

        // Las clases gray existentes (incluida el área admin) heredan
        // la paleta nueva sin tocar cada pantalla.
        gray: {
          700: '#222A42',
          800: '#171D2E',
          900: '#0F1422',
        },
      },

      fontFamily: {
        'fortuna': ['FortunaDotRegular', 'sans-serif'],
        "design-systemc": ['DesignSystemC', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
