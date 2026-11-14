// ====================================================================
// WALK WITH BUDDY - SCREEN CONTAINER COMPONENT
// ====================================================================

import React from 'react';
import { View, StyleSheet, ViewStyle, SafeAreaView, Platform, KeyboardAvoidingView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../context/ThemeContext';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  safeArea?: boolean;
  keyboardAvoid?: boolean;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  style,
  safeArea = true,
  keyboardAvoid = true,
}) => {
  const { colors, isDark } = useTheme();

  const content = (
    <View style={[styles.container, { backgroundColor: colors.background }, style]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </View>
  );

  if (keyboardAvoid && Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView
        behavior="padding"
        style={[styles.flex, { backgroundColor: colors.background }]}
      >
        {safeArea ? <SafeAreaView style={styles.flex}>{content}</SafeAreaView> : content}
      </KeyboardAvoidingView>
    );
  }

  if (safeArea) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
        {content}
      </SafeAreaView>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});
