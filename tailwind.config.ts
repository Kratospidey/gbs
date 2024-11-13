// tailwind.config.ts
import type { Config } from "tailwindcss";
const defaultTheme = require("tailwindcss/defaultTheme");
const svgToDataUri = require("mini-svg-data-uri");
const colors = require("tailwindcss/colors");
const {
	default: flattenColorPalette,
} = require("tailwindcss/lib/util/flattenColorPalette");

/** @type {import('tailwindcss').Config} */
const config: Config = {
	darkMode: ["class"],
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			colors: {
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
				popover: "hsl(var(--popover))",
				"popover-foreground": "hsl(var(--popover-foreground))",
				"card-foreground": "hsl(var(--card-foreground))",
				"primary-foreground": "hsl(var(--primary-foreground))",
				"secondary-foreground": "hsl(var(--secondary-foreground))",
				"muted-foreground": "hsl(var(--muted-foreground))",
				"accent-foreground": "hsl(var(--accent-foreground))",
				"destructive-foreground": "hsl(var(--destructive-foreground))",
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			fontFamily: {
				sans: ["var(--font-sans)", "system-ui", "sans-serif"],
			},
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: "0" },
				},
				moveHorizontal: {
					"0%": {
						transform: "translateX(-50%) translateY(-10%)",
					},
					"50%": {
						transform: "translateX(50%) translateY(10%)",
					},
					"100%": {
						transform: "translateX(-50%) translateY(-10%)",
					},
				},
				moveInCircle: {
					"0%": {
						transform: "rotate(0deg)",
					},
					"50%": {
						transform: "rotate(180deg)",
					},
					"100%": {
						transform: "rotate(360deg)",
					},
				},
				moveVertical: {
					"0%": {
						transform: "translateY(-50%)",
					},
					"50%": {
						transform: "translateY(50%)",
					},
					"100%": {
						transform: "translateY(-50%)",
					},
				},
				rotateSmall: {
					"0%": { transform: "rotate(0deg) scale(1)" },
					"50%": { transform: "rotate(180deg) scale(1.1)" },
					"100%": { transform: "rotate(360deg) scale(1)" },
				},
				moveXSmall: {
					"0%, 100%": { transform: "translateX(-10%)" },
					"50%": { transform: "translateX(10%)" },
				},
				gradientBackground: {
					"0%, 100%": { "background-position": "0% 50%" },
					"50%": { "background-position": "100% 50%" },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
				first: "moveVertical 30s ease infinite",
				second: "moveInCircle 20s reverse infinite",
				third: "moveInCircle 40s linear infinite",
				fourth: "moveHorizontal 40s ease infinite",
				fifth: "moveInCircle 20s ease infinite",
				"small-circle-rotation": "rotateSmall 15s linear infinite",
				"small-circle-move-x": "moveXSmall 20s ease-in-out infinite",
				"gradient-slow": "gradientBackground 15s ease infinite",
			},
			backdropBlur: {
				xs: "2px",
				sm: "4px",
				md: "8px",
				lg: "12px",
				xl: "16px",
				"2xl": "24px",
			},

			height: {
				6: "1.5rem", // 24px
				5: "1.25rem", // 20px
			},
			width: {
				6: "1.5rem", // 24px
				5: "1.25rem", // 20px
			},
			backgroundSize: {
				"size-200": "200% 200%",
			},
			backgroundImage: {
				"gradient-animated": "linear-gradient(-45deg, #1e3a8a, #2563eb, #7c3aed, #22d3ee)",
			},
		},
	},
	variants: {
		extend: {
			backdropBlur: ["responsive"],
		},
	},
	plugins: [
		require("tailwindcss-animate"),
		function ({ addBase, theme }: any) {
			const allColors = flattenColorPalette(theme("colors"));
			const newVars = Object.fromEntries(
				Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
			);

			addBase({
				":root": newVars,
			});
		},
		function ({ matchUtilities, theme }: any) {
			matchUtilities(
				{
					"bg-grid": (value: any) => ({
						backgroundImage: `url("${svgToDataUri(
							`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="${value}"><path d="M0 .5H31.5V32"/></svg>`
						)}")`,
					}),
					"bg-grid-small": (value: any) => ({
						backgroundImage: `url("${svgToDataUri(
							`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="8" height="8" fill="none" stroke="${value}"><path d="M0 .5H31.5V32"/></svg>`
						)}")`,
					}),
					"bg-dot": (value: any) => ({
						backgroundImage: `url("${svgToDataUri(
							`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" fill="none"><circle fill="${value}" cx="10" cy="10" r="1.6257"></circle></svg>`
						)}")`,
					}),
				},
				{ values: flattenColorPalette(theme("backgroundColor")), type: "color" }
			);
		},
	],
};

export default config;
