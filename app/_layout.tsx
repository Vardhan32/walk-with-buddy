// ====================================================================
// WALK WITH BUDDY - ROOT STACK LAYOUT
// ====================================================================

import React from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider } from '../src/context/ThemeContext';
import { AuthProvider } from '../src/context/AuthContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="welcome" />
          <Stack.Screen name="onboarding/index" />
          <Stack.Screen name="onboarding/profile-setup" />
          <Stack.Screen name="onboarding/interests" />
          <Stack.Screen name="onboarding/location-permission" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/register" />
          <Stack.Screen name="auth/forgot-password" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="profile/[id]" />
          <Stack.Screen name="profile/edit" />
          <Stack.Screen name="match/celebration" options={{ presentation: 'modal' }} />
          <Stack.Screen name="chat/[matchId]" />
          <Stack.Screen name="settings/privacy" />
          <Stack.Screen name="settings/delete-account" />
          <Stack.Screen name="safety/guidelines" />
          <Stack.Screen name="safety/block-list" />
          <Stack.Screen name="safety/report/[userId]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="verification/request" />
          <Stack.Screen name="admin/index" />
          <Stack.Screen name="admin/reports" />
          <Stack.Screen name="admin/verifications" />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}
