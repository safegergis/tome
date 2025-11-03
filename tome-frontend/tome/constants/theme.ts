/**
 * Tome Design System
 * Color palette: Eggshell white and purple with serif typography
 */

import { Platform } from 'react-native';

export const Colors = {
    light: {
        // Primary Colors
        primary: '#6B46C1',
        primaryDark: '#553C9A',
        primaryLight: '#9F7AEA',

        // Backgrounds
        background: '#FBF8F3', // Eggshell white
        backgroundAlt: '#FAFAF8',
        surface: '#FFFFFF',

        // Text
        text: '#1A1A1A',
        textSecondary: '#4A4A4A',
        textLight: '#FFFFFF',

        // UI Elements
        border: '#D4D4D4',
        icon: '#4A4A4A',

        // Semantic
        success: '#10B981',
        error: '#EF4444',
        info: '#3B82F6',

        // Tab Navigation
        tabIconDefault: '#4A4A4A',
        tabIconSelected: '#6B46C1',
        tint: '#6B46C1',
    },
    dark: {
        primary: '#9F7AEA',
        primaryDark: '#6B46C1',
        primaryLight: '#B794F4',

        background: '#1A1A1A',
        backgroundAlt: '#2D2D2D',
        surface: '#2D2D2D',

        text: '#FAFAF8',
        textSecondary: '#D4D4D4',
        textLight: '#FAFAF8',

        border: '#4A4A4A',
        icon: '#D4D4D4',

        success: '#10B981',
        error: '#EF4444',
        info: '#3B82F6',

        tabIconDefault: '#D4D4D4',
        tabIconSelected: '#9F7AEA',
        tint: '#9F7AEA',
    },
};

export const Fonts = Platform.select({
    ios: {
        sans: 'system-ui',
        serif: 'ui-serif',
        rounded: 'ui-rounded',
        mono: 'ui-monospace',
    },
    default: {
        sans: 'normal',
        serif: 'serif',
        rounded: 'normal',
        mono: 'monospace',
    },
    web: {
        sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        serif: "Georgia, 'Times New Roman', serif",
        rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
        mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    },
});

export const Typography = {
    h1: {
        fontSize: 32,
        fontWeight: '700' as const,
        lineHeight: 40,
    },
    h2: {
        fontSize: 24,
        fontWeight: '700' as const,
        lineHeight: 32,
    },
    h3: {
        fontSize: 20,
        fontWeight: '600' as const,
        lineHeight: 28,
    },
    body: {
        fontSize: 16,
        fontWeight: '400' as const,
        lineHeight: 24,
    },
    bodySmall: {
        fontSize: 14,
        fontWeight: '400' as const,
        lineHeight: 20,
    },
    caption: {
        fontSize: 12,
        fontWeight: '400' as const,
        lineHeight: 16,
    },
    button: {
        fontSize: 16,
        fontWeight: '600' as const,
        lineHeight: 24,
    },
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
};

export const BorderRadius = {
    sm: 4,
    md: 8,
    lg: 16,
    full: 9999,
};

export const Shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 8,
    },
};
