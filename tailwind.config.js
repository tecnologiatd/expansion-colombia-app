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
        primary: '#1D1D1B',
        secondary: '#a855f7',
        medellin: '#292750',
        caribe: '#008D36',
        bogota: '#BE1622',
        cafetero: '#F9B233',
      },

      fontFamily: {
        'fortuna': ['FortunaDotRegular', 'sans-serif'],
        "design-systemc": ['DesignSystemC', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
