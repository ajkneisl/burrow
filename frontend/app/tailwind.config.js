/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: "class",
    content: [
        "./app/**/*.{js,jsx,ts,tsx}",
        "./components/**/*.{js,jsx,ts,tsx}",
        "./features/**/*.{js,jsx,ts,tsx}"
    ],
    presets: [require("nativewind/preset")],
    corePlugins: {
        backgroundOpacity: true,
        textOpacity: true,
        borderOpacity: true,
    },
    theme: {
        extend: {
            colors: {
                background: "var(--color-background)",
                primary: {
                    DEFAULT: "var(--color-primary)",
                    hover: "var(--color-primary-hover)"
                },
                secondary: {
                    DEFAULT: "var(--color-secondary)",
                    hover: "var(--color-secondary-hover)"
                },
                success: {
                    DEFAULT: "var(--color-success)",
                    hover: "var(--color-success-hover)"
                },
                error: {
                    DEFAULT: "var(--color-error)",
                    hover: "var(--color-error-hover)"
                },
                info: {
                    DEFAULT: "var(--color-info)",
                    hover: "var(--color-info-hover)"
                },
                warn: {
                    DEFAULT: "var(--color-warn)",
                    hover: "var(--color-warn-hover)"
                },
                text: "var(--color-text)",
                card: {
                    DEFAULT: "var(--color-card)",
                    border: "var(--color-card-border)"
                },
                hero: "var(--color-hero)"
            },
            fontFamily: {
                sans: ["Poppins-Regular", "system-ui", "sans-serif"],
                medium: ["Poppins-Medium"],
                semibold: ["Poppins-SemiBold"],
                bold: ["Poppins-Bold"],
                barlow: ["Barlow-Medium"]
            }
        }
    },
    plugins: []
}
