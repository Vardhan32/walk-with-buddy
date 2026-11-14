// ====================================================================
// WALK WITH BUDDY - MESSAGE BUBBLE COMPONENT (STATUS & RETRY ENABLED)
// ====================================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Spacing, Radius } from '../../constants/theme';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  onRetry?: (message: Message) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isMine, onRetry }) => {
  const { colors } = useTheme();

  const formattedTime = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isFailed = message.delivery_status === 'failed';
  const isSending = message.delivery_status === 'sending';

  return (
    <View style={[styles.row, isMine ? styles.myRow : styles.partnerRow]}>
      {isMine && isFailed && onRetry && (
        <TouchableOpacity
          onPress={() => onRetry(message)}
          style={styles.retryButton}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-circle" size={20} color={colors.danger} />
        </TouchableOpacity>
      )}

      <View
        style={[
          styles.bubble,
          isMine
            ? [
                styles.myBubble,
                {
                  backgroundColor: isFailed ? colors.danger : colors.primary,
                },
              ]
            : [styles.partnerBubble, { backgroundColor: colors.surface }],
        ]}
      >
        <Text style={[styles.text, { color: isMine ? '#FFFFFF' : colors.text }]}>
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
            <View style={styles.statusIconWrap}>
              {isSending ? (
                <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.7)" />
              ) : isFailed ? (
                <Ionicons name="alert-circle" size={12} color="#FFFFFF" />
              ) : (
                <Ionicons
                  name={message.is_read ? 'checkmark-done' : 'checkmark'}
                  size={13}
                  color={message.is_read ? '#E0F2FE' : 'rgba(255,255,255,0.7)'}
                />
              )}
            </View>
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
    alignItems: 'flex-end',
  },
  myRow: {
    justifyContent: 'flex-end',
  },
  partnerRow: {
    justifyContent: 'flex-start',
  },
  retryButton: {
    padding: Spacing.xs,
    marginRight: 4,
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
  statusIconWrap: {
    marginLeft: 4,
  },
});
