module.exports = {
  content: [
    "./src/app/**/*.{ts,tsx,js,jsx,css}",
    "./src/components/**/*.{ts,tsx,js,jsx,css}",
    "./src/**/*.{ts,tsx,js,jsx,css}",
    "./src/app/globals.css",
    "./public/**/*.html"
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem"
    },
    extend: {
      colors: {
        primary: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a"
        }
      },
      boxShadow: {
        card: "0 6px 18px rgba(15, 23, 42, 0.06)"
      },
      borderRadius: {
        xl: "12px"
      }
    }
  },
  plugins: []
};