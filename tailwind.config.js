/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'tum-blue': '#3070b3',
                'tum-blue-dark': '#003359',
                'tum-blue-light': '#98c6ea',
                'tum-gray': '#333333',
                'tum-gray-light': '#e8e8e8',
                'surface-1': '#1e293b', // Slate 800
                'surface-2': '#334155', // Slate 700
                'accent-primary': '#3b82f6', // Blue 500
                'accent-secondary': '#10b981', // Emerald 500
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
                display: ['Outfit', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
