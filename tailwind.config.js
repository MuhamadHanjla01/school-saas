/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
      extend: {
          "colors": {
              "on-secondary-container": "#003e73",
              "on-tertiary-container": "#752509",
              "error": "#ba1a1a",
              "inverse-primary": "#41ddc2",
              "on-secondary-fixed": "#001c39",
              "primary-fixed": "#65fade",
              "on-primary-container": "#00493e",
              "surface-container-high": "#e8e8ea",
              "on-primary": "#ffffff",
              "on-secondary": "#ffffff",
              "tertiary": "#9d4224",
              "primary-fixed-dim": "#41ddc2",
              "secondary": "#0060ac",
              "secondary-fixed-dim": "#a4c9ff",
              "surface-dim": "#dadadc",
              "surface-bright": "#f9f9fc",
              "primary": "#006b5c",
              "on-error-container": "#93000a",
              "surface-container-low": "#f3f3f6",
              "tertiary-fixed-dim": "#ffb59e",
              "error-container": "#ffdad6",
              "tertiary-fixed": "#ffdbd0",
              "on-background": "#1a1c1e",
              "outline": "#6c7a76",
              "on-secondary-fixed-variant": "#004883",
              "tertiary-container": "#ff8d69",
              "secondary-container": "#68abff",
              "primary-container": "#00c2a8",
              "on-primary-fixed": "#00201b",
              "surface-tint": "#006b5c",
              "on-tertiary": "#ffffff",
              "surface": "#f9f9fc",
              "inverse-on-surface": "#f0f0f3",
              "surface-container": "#eeeef0",
              "outline-variant": "#bbcac4",
              "on-tertiary-fixed-variant": "#7e2c0f",
              "inverse-surface": "#2f3133",
              "surface-container-lowest": "#ffffff",
              "on-primary-fixed-variant": "#005045",
              "on-surface": "#1a1c1e",
              "on-error": "#ffffff",
              "surface-container-highest": "#e2e2e5",
              "on-tertiary-fixed": "#3a0b00",
              "on-surface-variant": "#3c4a46",
              "secondary-fixed": "#d4e3ff",
              "surface-variant": "#e2e2e5",
              "background": "#f9f9fc"
          },
          "borderRadius": {
              "DEFAULT": "0.25rem",
              "lg": "0.5rem",
              "xl": "0.75rem",
              "full": "9999px",
              "2xl": "1.5rem",
              "card": "24px"
          },
          "spacing": {
              "container-padding-mob": "20px",
              "base": "8px",
              "container-padding-desk": "40px",
              "card-gap": "24px",
              "gutter": "16px"
          },
          "fontFamily": {
              "label-lg": ["Inter"],
              "headline-md": ["Inter"],
              "display-mobile": ["Inter"],
              "display": ["Inter"],
              "body-md": ["Inter"],
              "body-lg": ["Inter"],
              "label-sm": ["Inter"],
              "headline-lg": ["Inter"]
          },
          "fontSize": {
              "label-lg": ["14px", { "lineHeight": "20px", "letterSpacing": "0.01em", "fontWeight": "600" }],
              "headline-md": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
              "display-mobile": ["28px", { "lineHeight": "36px", "fontWeight": "700" }],
              "display": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
              "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
              "body-lg": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
              "label-sm": ["12px", { "lineHeight": "16px", "fontWeight": "500" }],
              "headline-lg": ["24px", { "lineHeight": "32px", "fontWeight": "600" }]
          },
          keyframes: {
            fadeIn: {
              '0%': { opacity: '0' },
              '100%': { opacity: '1' },
            }
          },
          animation: {
            fadeIn: 'fadeIn 0.5s ease-in-out',
          }
      }
  },
  plugins: [],
}
