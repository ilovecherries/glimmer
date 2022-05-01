module.exports = {
  content: ["./src/**/*.vue"],
  darkMode: 'class',
  theme: {
    extend: {
      backgroundImage: {
        sbPattern: "url('./Sb-bg-tile.png')",
        "sidebar-splash": "var(--splash-image)",
      },
      colors: {
        document: "var(--color-document)",
        // document: "#E0F4EE",
        "item-hover": "var(--color-item-hover)",
        accent: "var(--color-accent)",
        "accent-2": "var(--color-accent-2)",
        link: "var(--color-link)",
        "link-hover": "var(--color-link-hover)",
        notification: "var(--color-notification)",
        "notification-hover": "var(--color-notification-hover)",
        textColor: "var(--color-text)",
        "accent-text": "var(--color-text-accent)",
        bcol: "var(--color-border)",
      },
    },
  },
  plugins: [],
};
