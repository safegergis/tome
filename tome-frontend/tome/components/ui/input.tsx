import React, { useState } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    ViewStyle,
    TextStyle,
    TouchableOpacity,
} from 'react-native';
import { Colors, Typography, BorderRadius, Spacing, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface InputProps {
    label?: string;
    placeholder?: string;
    value: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean;
    error?: string;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    maxLength?: number;
    style?: ViewStyle;
    inputStyle?: TextStyle;
    editable?: boolean;
}

export function Input({
    label,
    placeholder,
    value,
    onChangeText,
    secureTextEntry = false,
    error,
    autoCapitalize = 'none',
    keyboardType = 'default',
    maxLength,
    style,
    inputStyle,
    editable = true,
}: InputProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const borderColor = error
        ? colors.error
        : isFocused
            ? colors.primary
            : colors.border;

    return (
        <View style={[styles.container, style]}>
            {label && (
                <Text
                    style={[
                        styles.label,
                        { color: colors.text, fontFamily: Fonts.serif },
                    ]}
                >
                    {label}
                </Text>
            )}
            <View style={[styles.inputContainer, { borderColor }]}>
                <TextInput
                    style={[
                        styles.input,
                        {
                            color: colors.text,
                            fontFamily: Fonts.serif,
                        },
                        inputStyle,
                    ]}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textSecondary}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={secureTextEntry && !isPasswordVisible}
                    autoCapitalize={autoCapitalize}
                    keyboardType={keyboardType}
                    maxLength={maxLength}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    editable={editable}
                />
                {secureTextEntry && (
                    <TouchableOpacity
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                        style={styles.eyeIcon}
                    >
                        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                            {isPasswordVisible ? 'Hide' : 'Show'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
            {error && (
                <Text
                    style={[
                        styles.error,
                        { color: colors.error, fontFamily: Fonts.sans },
                    ]}
                >
                    {error}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.base,
    },
    label: {
        ...Typography.bodySmall,
        marginBottom: Spacing.sm,
        fontWeight: '600',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: BorderRadius.sm,
        backgroundColor: '#FFFFFF',
    },
    input: {
        flex: 1,
        ...Typography.body,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.base,
        minHeight: 48,
    },
    eyeIcon: {
        paddingHorizontal: Spacing.base,
    },
    error: {
        ...Typography.caption,
        marginTop: Spacing.xs,
    },
});
