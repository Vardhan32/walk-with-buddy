// ====================================================================
// WALK WITH BUDDY - MESSAGE BUBBLE COMPONENT
// ====================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Spacing, Radius } from '../../constants/theme';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isMine }) => {
  const { colors } = useTheme();

  const formattedTime = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View
      style={[
        styles.row,
        isMine ? styles.myRow : styles.partnerRow,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isMine
            ? [styles.myBubble, { backgroundColor: colors.primary }]
            : [styles.partnerBubble, { backgroundColor: colors.surface }],
        ]}
      >
        <Text
          style={[
            styles.text,
            { color: isMine ? '#FFFFFF' : colors.text },
          ]}
        >
          {message.content}
        </Text>
        <View style={styles.metaRow}>
          <Text
            style={[
              styles.time,
              { color: isMine ? 'rgba(255,255,255,0.7)' : colors.textMuted },
            ]}
          >
            {formattedTime}
          </Text>
          {isMine && (
            <Ionicons
              name={message.is_read ? 'checkmark-done' : 'checkmark'}
              size={13}
              color={message.is_read ? '#E0F2FE' : 'rgba(255,255,255,0.7)'}
              style={{ marginLeft: 3 }}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    marginVertical: 4,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
  },
  myRow: {
    justifyContent: 'flex-end',
  },
  partnerRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
  },
  myBubble: {
    borderBottomRightRadius: 4,
  },
  partnerBubble: {
    borderBottomLeftRadius: 4,
  },
  text: {
    ...Typography.bodyMedium,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 3,
  },
  time: {
    ...Typography.caption,
    fontSize: 10,
  },
});
