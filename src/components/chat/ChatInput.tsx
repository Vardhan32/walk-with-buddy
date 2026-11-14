// ====================================================================
// WALK WITH BUDDY - CHAT INPUT COMPONENT
// ====================================================================

import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Spacing, Radius } from '../../constants/theme';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled = false }) => {
  const [text, setText] = useState('');
  const { colors } = useTheme();

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      <View style={[styles.inputWrapper, { backgroundColor: colors.surface }]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Suggest a walk or ask a question..."
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
          editable={!disabled}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!text.trim() || disabled}
          style={[
            styles.sendButton,
            {
              backgroundColor: text.trim() ? colors.primary : colors.surfaceSubtle,
            },
          ]}
        >
          <Ionicons
            name="send"
            size={16}
            color={text.trim() ? '#FFFFFF' : colors.textMuted}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  input: {
    flex: 1,
    ...Typography.bodyMedium,
    maxHeight: 100,
    paddingVertical: Spacing.xs,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
});
