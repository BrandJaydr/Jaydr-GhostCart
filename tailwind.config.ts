import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";
import { theme } from "./src/lib/theme";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/react/node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/react/dist/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/**/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "color-mix(in srgb, var(--heroui-primary-50) 100%, transparent)",
          100: "color-mix(in srgb, var(--heroui-primary-100) 100%, transparent)",
          200: "color-mix(in srgb, var(--heroui-primary-200) 100%, transparent)",
          300: "color-mix(in srgb, var(--heroui-primary-300) 100%, transparent)",
          400: "color-mix(in srgb, var(--heroui-primary-400) 100%, transparent)",
          500: "color-mix(in srgb, var(--heroui-primary-500) 100%, transparent)",
          600: "color-mix(in srgb, var(--heroui-primary-600) 100%, transparent)",
          700: "color-mix(in srgb, var(--heroui-primary-700) 100%, transparent)",
          800: "color-mix(in srgb, var(--heroui-primary-800) 100%, transparent)",
          900: "color-mix(in srgb, var(--heroui-primary-900) 100%, transparent)",
          DEFAULT: "color-mix(in srgb, var(--heroui-primary) 100%, transparent)",
        },
        secondary: {
          50: "color-mix(in srgb, var(--heroui-secondary-50) 100%, transparent)",
          100: "color-mix(in srgb, var(--heroui-secondary-100) 100%, transparent)",
          200: "color-mix(in srgb, var(--heroui-secondary-200) 100%, transparent)",
          300: "color-mix(in srgb, var(--heroui-secondary-300) 100%, transparent)",
          400: "color-mix(in srgb, var(--heroui-secondary-400) 100%, transparent)",
          500: "color-mix(in srgb, var(--heroui-secondary-500) 100%, transparent)",
          600: "color-mix(in srgb, var(--heroui-secondary-600) 100%, transparent)",
          700: "color-mix(in srgb, var(--heroui-secondary-700) 100%, transparent)",
          800: "color-mix(in srgb, var(--heroui-secondary-800) 100%, transparent)",
          900: "color-mix(in srgb, var(--heroui-secondary-900) 100%, transparent)",
          DEFAULT: "color-mix(in srgb, var(--heroui-secondary) 100%, transparent)",
        },
        success: {
          50: "color-mix(in srgb, var(--heroui-success-50) 100%, transparent)",
          100: "color-mix(in srgb, var(--heroui-success-100) 100%, transparent)",
          200: "color-mix(in srgb, var(--heroui-success-200) 100%, transparent)",
          300: "color-mix(in srgb, var(--heroui-success-300) 100%, transparent)",
          400: "color-mix(in srgb, var(--heroui-success-400) 100%, transparent)",
          500: "color-mix(in srgb, var(--heroui-success-500) 100%, transparent)",
          600: "color-mix(in srgb, var(--heroui-success-600) 100%, transparent)",
          700: "color-mix(in srgb, var(--heroui-success-700) 100%, transparent)",
          800: "color-mix(in srgb, var(--heroui-success-800) 100%, transparent)",
          900: "color-mix(in srgb, var(--heroui-success-900) 100%, transparent)",
          DEFAULT: "color-mix(in srgb, var(--heroui-success) 100%, transparent)",
        },
        warning: {
          50: "color-mix(in srgb, var(--heroui-warning-50) 100%, transparent)",
          100: "color-mix(in srgb, var(--heroui-warning-100) 100%, transparent)",
          200: "color-mix(in srgb, var(--heroui-warning-200) 100%, transparent)",
          300: "color-mix(in srgb, var(--heroui-warning-300) 100%, transparent)",
          400: "color-mix(in srgb, var(--heroui-warning-400) 100%, transparent)",
          500: "color-mix(in srgb, var(--heroui-warning-500) 100%, transparent)",
          600: "color-mix(in srgb, var(--heroui-warning-600) 100%, transparent)",
          700: "color-mix(in srgb, var(--heroui-warning-700) 100%, transparent)",
          800: "color-mix(in srgb, var(--heroui-warning-800) 100%, transparent)",
          900: "color-mix(in srgb, var(--heroui-warning-900) 100%, transparent)",
          DEFAULT: "color-mix(in srgb, var(--heroui-warning) 100%, transparent)",
        },
        danger: {
          50: "color-mix(in srgb, var(--heroui-danger-50) 100%, transparent)",
          100: "color-mix(in srgb, var(--heroui-danger-100) 100%, transparent)",
          200: "color-mix(in srgb, var(--heroui-danger-200) 100%, transparent)",
          300: "color-mix(in srgb, var(--heroui-danger-300) 100%, transparent)",
          400: "color-mix(in srgb, var(--heroui-danger-400) 100%, transparent)",
          500: "color-mix(in srgb, var(--heroui-danger-500) 100%, transparent)",
          600: "color-mix(in srgb, var(--heroui-danger-600) 100%, transparent)",
          700: "color-mix(in srgb, var(--heroui-danger-700) 100%, transparent)",
          800: "color-mix(in srgb, var(--heroui-danger-800) 100%, transparent)",
          900: "color-mix(in srgb, var(--heroui-danger-900) 100%, transparent)",
          DEFAULT: "color-mix(in srgb, var(--heroui-danger) 100%, transparent)",
        },
        default: {
          50: "color-mix(in srgb, var(--heroui-default-50) 100%, transparent)",
          100: "color-mix(in srgb, var(--heroui-default-100) 100%, transparent)",
          200: "color-mix(in srgb, var(--heroui-default-200) 100%, transparent)",
          300: "color-mix(in srgb, var(--heroui-default-300) 100%, transparent)",
          400: "color-mix(in srgb, var(--heroui-default-400) 100%, transparent)",
          500: "color-mix(in srgb, var(--heroui-default-500) 100%, transparent)",
          600: "color-mix(in srgb, var(--heroui-default-600) 100%, transparent)",
          700: "color-mix(in srgb, var(--heroui-default-700) 100%, transparent)",
          800: "color-mix(in srgb, var(--heroui-default-800) 100%, transparent)",
          900: "color-mix(in srgb, var(--heroui-default-900) 100%, transparent)",
          DEFAULT: "color-mix(in srgb, var(--heroui-default) 100%, transparent)",
        },
        error: theme.colors.error,
        info: theme.colors.info,
        neutral: theme.colors.neutral,
        background: 'var(--background)',
        surface: 'var(--surface)',
        'surface-elevated': 'var(--surface-elevated)',
        foreground: 'var(--foreground)',
        'muted-foreground': 'var(--muted-foreground)',
        border: 'var(--border)',
      },
      spacing: theme.spacing,
      borderRadius: theme.borderRadius,
      boxShadow: theme.shadows,
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        "warm-cream-burgundy-2": {
          extend: "light",
          colors: {
            background: "#ffffff",
            foreground: "#000000",
            default: {
              "50": "#eee1e4",
              "100": "#d7b8bf",
              "200": "#bf8e99",
              "300": "#a86573",
              "400": "#903b4e",
              "500": "#791228",
              "600": "#640f21",
              "700": "#4f0c1a",
              "800": "#390913",
              "900": "#24050c",
              foreground: "#ffffff",
              DEFAULT: "#791228"
            },
            primary: {
              "50": "#eae1e3",
              "100": "#ccb8bc",
              "200": "#ae8e94",
              "300": "#91656d",
              "400": "#733b45",
              "500": "#55121e",
              "600": "#460f19",
              "700": "#370c14",
              "800": "#28090e",
              "900": "#1a0509",
              foreground: "#ffffff",
              DEFAULT: "#55121e"
            },
            secondary: {
              "50": "#fbfbfa",
              "100": "#f6f4f3",
              "200": "#f0eeec",
              "300": "#ebe8e6",
              "400": "#e5e1df",
              "500": "#e0dbd8",
              "600": "#b9b5b2",
              "700": "#928e8c",
              "800": "#6a6867",
              "900": "#434241",
              foreground: "#000000",
              DEFAULT: "#e0dbd8"
            },
            success: {
              "50": "#fefdfd",
              "100": "#fbfbfa",
              "200": "#f9f8f7",
              "300": "#f7f6f5",
              "400": "#f5f3f2",
              "500": "#f3f1ef",
              "600": "#c8c7c5",
              "700": "#9e9d9b",
              "800": "#737272",
              "900": "#494848",
              foreground: "#000000",
              DEFAULT: "#f3f1ef"
            },
            warning: {
              "50": "#ededef",
              "100": "#d3d5d9",
              "200": "#b9bcc3",
              "300": "#9fa3ac",
              "400": "#858b96",
              "500": "#6b7280",
              "600": "#585e6a",
              "700": "#464a53",
              "800": "#33363d",
              "900": "#202226",
              foreground: "#ffffff",
              DEFAULT: "#6b7280"
            },
            danger: {
              "50": "#fee1eb",
              "100": "#fbb8cf",
              "200": "#f98eb3",
              "300": "#f76598",
              "400": "#f53b7c",
              "500": "#f31260",
              "600": "#c80f4f",
              "700": "#9e0c3e",
              "800": "#73092e",
              "900": "#49051d",
              foreground: "#000000",
              DEFAULT: "#f31260"
            },
            content1: {
              DEFAULT: "#ffffff",
              foreground: "#000000"
            },
            content2: {
              DEFAULT: "#f4f4f5",
              foreground: "#000000"
            },
            content3: {
              DEFAULT: "#e4e4e7",
              foreground: "#000000"
            },
            content4: {
              DEFAULT: "#d4d4d8",
              foreground: "#000000"
            },
            focus: "#006FEE",
            overlay: "#ffffff"
          }
        },
        "cherry-blossom": {
          extend: "light",
          colors: {
            background: "#faf8f6",
            foreground: "#1a0509",
            default: {
              "50": "#e8d4d8",
              "100": "#d1a9b0",
              "200": "#ba7e88",
              "300": "#a35360",
              "400": "#8c2838",
              "500": "#55121e",
              "600": "#440e18",
              "700": "#330a12",
              "800": "#22060c",
              "900": "#110206",
              foreground: "#ffffff",
              DEFAULT: "#55121e"
            },
            primary: {
              "50": "#f5e6e8",
              "100": "#ebd0d4",
              "200": "#e0bac0",
              "300": "#d5a4ac",
              "400": "#ca8e98",
              "500": "#55121e",
              "600": "#440e18",
              "700": "#330a12",
              "800": "#22060c",
              "900": "#110206",
              foreground: "#ffffff",
              DEFAULT: "#55121e"
            },
            secondary: {
              "50": "#fdfbfa",
              "100": "#f9f6f4",
              "200": "#f5f1ed",
              "300": "#f1ece7",
              "400": "#ede7e0",
              "500": "#e9e2d9",
              "600": "#beb5aa",
              "700": "#93887b",
              "800": "#685b4c",
              "900": "#3d2e1d",
              foreground: "#1a0509",
              DEFAULT: "#e9e2d9"
            },
            success: {
              "50": "#fdfcfa",
              "100": "#faf8f4",
              "200": "#f7f4ed",
              "300": "#f4f0e6",
              "400": "#f1ecdf",
              "500": "#ede8d8",
              "600": "#c4bbae",
              "700": "#9b8e84",
              "800": "#72615a",
              "900": "#493430",
              foreground: "#1a0509",
              DEFAULT: "#ede8d8"
            },
            warning: {
              "50": "#ebe8e6",
              "100": "#d7d2cd",
              "200": "#c3bcb4",
              "300": "#afa69b",
              "400": "#9b9082",
              "500": "#877a69",
              "600": "#6f6355",
              "700": "#574c41",
              "800": "#3f352d",
              "900": "#271a19",
              foreground: "#ffffff",
              DEFAULT: "#877a69"
            },
            danger: {
              "50": "#fde8e8",
              "100": "#fbd2d2",
              "200": "#f9bcbc",
              "300": "#f7a6a6",
              "400": "#f59090",
              "500": "#f37a7a",
              "600": "#c26262",
              "700": "#914a4a",
              "800": "#603232",
              "900": "#2f1a19",
              foreground: "#1a0509",
              DEFAULT: "#f37a7a"
            },
            content1: {
              DEFAULT: "#ffffff",
              foreground: "#1a0509"
            },
            content2: {
              DEFAULT: "#f8f4f0",
              foreground: "#1a0509"
            },
            content3: {
              DEFAULT: "#f0e8e0",
              foreground: "#1a0509"
            },
            content4: {
              DEFAULT: "#e8dcd0",
              foreground: "#1a0509"
            },
            focus: "#55121e",
            overlay: "#ffffff"
          }
        },
        "warm-cream-burgundy-2-dark": {
          extend: "dark",
          colors: {
            background: "#000000",
            foreground: "#ffffff",
            default: {
              "50": "#0d0d0e",
              "100": "#19191c",
              "200": "#26262a",
              "300": "#323238",
              "400": "#3f3f46",
              "500": "#65656b",
              "600": "#8c8c90",
              "700": "#b2b2b5",
              "800": "#d9d9da",
              "900": "#ffffff",
              foreground: "#ffffff",
              DEFAULT: "#3f3f46"
            },
            primary: {
              "50": "#1a0509",
              "100": "#28090e",
              "200": "#370c14",
              "300": "#460f19",
              "400": "#55121e",
              "500": "#733b45",
              "600": "#91656d",
              "700": "#ae8e94",
              "800": "#ccb8bc",
              "900": "#eae1e3",
              foreground: "#ffffff",
              DEFAULT: "#55121e"
            },
            secondary: {
              "50": "#434241",
              "100": "#6a6867",
              "200": "#928e8c",
              "300": "#b9b5b2",
              "400": "#e0dbd8",
              "500": "#e5e1df",
              "600": "#ebe8e6",
              "700": "#f0eeec",
              "800": "#f6f4f3",
              "900": "#fbfbfa",
              foreground: "#000000",
              DEFAULT: "#e0dbd8"
            },
            success: {
              "50": "#494848",
              "100": "#737272",
              "200": "#9e9d9b",
              "300": "#c8c7c5",
              "400": "#f3f1ef",
              "500": "#f5f3f2",
              "600": "#f7f6f5",
              "700": "#f9f8f7",
              "800": "#fbfbfa",
              "900": "#fefdfd",
              foreground: "#000000",
              DEFAULT: "#f3f1ef"
            },
            warning: {
              "50": "#202226",
              "100": "#33363d",
              "200": "#464a53",
              "300": "#585e6a",
              "400": "#6b7280",
              "500": "#858b96",
              "600": "#9fa3ac",
              "700": "#b9bcc3",
              "800": "#d3d5d9",
              "900": "#ededef",
              foreground: "#ffffff",
              DEFAULT: "#6b7280"
            },
            danger: {
              "50": "#49051d",
              "100": "#73092e",
              "200": "#9e0c3e",
              "300": "#c80f4f",
              "400": "#f31260",
              "500": "#f53b7c",
              "600": "#f76598",
              "700": "#f98eb3",
              "800": "#fbb8cf",
              "900": "#fee1eb",
              foreground: "#000000",
              DEFAULT: "#f31260"
            },
            content1: {
              DEFAULT: "#18181b",
              foreground: "#ffffff"
            },
            content2: {
              DEFAULT: "#27272a",
              foreground: "#ffffff"
            },
            content3: {
              DEFAULT: "#3f3f46",
              foreground: "#ffffff"
            },
            content4: {
              DEFAULT: "#52525b",
              foreground: "#ffffff"
            },
            focus: "#006FEE",
            overlay: "#000000"
          }
        },
        "cherry-blossom-dark": {
          extend: "dark",
          colors: {
            background: "#0d0708",
            foreground: "#f5e6e8",
            default: {
              "50": "#1a0509",
              "100": "#2a0a10",
              "200": "#3a0f17",
              "300": "#4a141e",
              "400": "#5a1925",
              "500": "#6a1e2c",
              "600": "#8a3a45",
              "700": "#aa565e",
              "800": "#ca7277",
              "900": "#ea8e90",
              foreground: "#ffffff",
              DEFAULT: "#6a1e2c"
            },
            primary: {
              "50": "#110206",
              "100": "#22060c",
              "200": "#330a12",
              "300": "#440e18",
              "400": "#55121e",
              "500": "#773b45",
              "600": "#99656d",
              "700": "#bb8e94",
              "800": "#ddb8bc",
              "900": "#ffe1e3",
              foreground: "#ffffff",
              DEFAULT: "#55121e"
            },
            secondary: {
              "50": "#3d2e1d",
              "100": "#5b4a35",
              "200": "#79664d",
              "300": "#978265",
              "400": "#b59e7d",
              "500": "#d3ba95",
              "600": "#e5d1b0",
              "700": "#f0e3c8",
              "800": "#f7efe0",
              "900": "#fbfbf2",
              foreground: "#1a0509",
              DEFAULT: "#d3ba95"
            },
            success: {
              "50": "#271a19",
              "100": "#45302e",
              "200": "#634643",
              "300": "#815c58",
              "400": "#9f726d",
              "500": "#bd8882",
              "600": "#d4aaa4",
              "700": "#ebccc6",
              "800": "#f2e3e0",
              "900": "#f9f2f0",
              foreground: "#1a0509",
              DEFAULT: "#bd8882"
            },
            warning: {
              "50": "#1f1614",
              "100": "#3a2c28",
              "200": "#55423c",
              "300": "#705850",
              "400": "#8b6e64",
              "500": "#a68478",
              "600": "#be9e94",
              "700": "#d6b8b0",
              "800": "#eed2cc",
              "900": "#f5ebe8",
              foreground: "#ffffff",
              DEFAULT: "#a68478"
            },
            danger: {
              "50": "#1f0b0c",
              "100": "#3a1618",
              "200": "#552124",
              "300": "#702c30",
              "400": "#8b373c",
              "500": "#a64248",
              "600": "#c85b62",
              "700": "#ea747c",
              "800": "#f88d96",
              "900": "#ffa6b0",
              foreground: "#1a0509",
              DEFAULT: "#a64248"
            },
            content1: {
              DEFAULT: "#1a0509",
              foreground: "#f5e6e8"
            },
            content2: {
              DEFAULT: "#2a0a10",
              foreground: "#f5e6e8"
            },
            content3: {
              DEFAULT: "#3a0f17",
              foreground: "#f5e6e8"
            },
            content4: {
              DEFAULT: "#4a141e",
              foreground: "#f5e6e8"
            },
            focus: "#55121e",
            overlay: "#000000"
          }
        }
      },
      layout: {
        disabledOpacity: "0.2"
      }
    }) as any
  ],
};

export default config;
