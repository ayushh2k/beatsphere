/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#121212",
        green:{
          DEFAULT: "#1ED760"
        }
      },
      fontFamily: {
        abold: ["AvenirNextLTPro-Bold", "sans-serif"],
        aitlaics: ["AvenirNextLTPro-It", "sans-serif"],
        aregular: ["AvenirNextLTPro-Regular", "sans-serif"],
      },
    },
    plugins: [],
  }
}