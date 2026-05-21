/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}", "./src/**/*.css"],
  important: "#auth-root",
  corePlugins: {
    preflight: false
  },
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ["Fredoka", "cursive"],
        body: ["Quicksand", "system-ui", "sans-serif"]
      },
      colors: {
        candy: {
          sky: "#E8F4FD",
          pink: "#FF6B9D",
          berry: "#E85D75",
          purple: "#A78BFA",
          cream: "#FFF8F0",
          navy: "#1E293B",
          slate: "#64748B",
          mint: "#6EE7B7",
          lemon: "#FCD34D",
          "pink-soft": "#FFE4EC",
          "lemon-soft": "#FEF9C3"
        }
      },
      boxShadow: {
        candy: "0 8px 32px rgba(255, 107, 157, 0.15)",
        "candy-lg": "0 12px 32px rgba(255, 107, 157, 0.22)"
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 2s infinite",
        shimmer: "shimmer 2.5s linear infinite"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" }
        }
      }
    }
  },
  plugins: []
};
