// ====================================================================
// SCREEN 16: REAL-TIME CHAT (SECURITY & RELIABILITY HARDENED)
// ====================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { Avatar } from '../../src/components/common/Avatar';
import { MessageBubble } from '../../src/components/chat/MessageBubble';
import { ChatInput } from '../../src/components/chat/ChatInput';
import { ReportModal } from '../../src/components/safety/ReportModal';
import { LoadingIndicator } from '../../src/components/common/LoadingIndicator';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Typography, Spacing, Radius } from '../../src/constants/theme';
import { Message } from '../../src/types';
import { chatService } from '../../src/services/chat';
import { matchingService } from '../../src/services/matching';
import { safetyService } from '../../src/services/safety';
import { isSupabaseConfigured } from '../../src/services/supabase';

// ONLY displayed in offline demo mode for demo-match-001
const DEMO_OFFLINE_MESSAGES: Message[] = [
  {
    id: 'demo-msg-1',
    match_id: 'demo-match-001',
    sender_id: 'seed-ananya-1',
    content: 'Hi Harsha! Great to connect with another tech enthusiast here in Hyderabad.',
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    delivery_status: 'sent',
  },
  {
    id: 'demo-msg-2',
    match_id: 'demo-match-001',
    sender_id: 'demo-user-123',
    content: 'Hi Ananya! Happy to connect. I saw you enjoy evening walks by Durgam Cheruvu.',
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    delivery_status: 'sent',
  },
  {
    id: 'demo-msg-3',
    match_id: 'demo-match-001',
    sender_id: 'seed-ananya-1',
    content: 'Yes! The sunset view from the boardwalk is awesome. Would you be free for a 3km walk this Thursday around 6 PM?',
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    delivery_status: 'sent',
  },
];

export default function ChatScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const {
    matchId = 'demo-match-001',
    partnerId = 'seed-ananya-1',
    partnerName = 'Ananya Rao',
    partnerAvatar,
    partnerProfession = 'Product Designer',
    partnerVerified = 'true',
  } = useLocalSearchParams<{
    matchId: string;
    partnerId: string;
    partnerName: string;
    partnerAvatar?: string;
    partnerProfession?: string;
    partnerVerified?: string;
  }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [isConversationActive, setIsConversationActive] = useState(true);
  const [showReport, setShowReport] = useState(false);

  const isDemo = !isSupabaseConfigured() && matchId === 'demo-match-001';

  // Load initial messages
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isMounted = true;

    async function initChat() {
      try {
        setLoading(true);

        if (isDemo) {
          // Explicit demo mode only
          if (isMounted) setMessages(DEMO_OFFLINE_MESSAGES);
        } else {
          // Live mode: fetch real messages from database
          const fetched = await chatService.fetchMessages(matchId, 40);
          if (isMounted) {
            setMessages(fetched);
            if (fetched.length < 40) setHasMoreOlder(false);
          }

          // Mark unread messages via secure RPC
          await chatService.markMessagesAsRead(matchId);
        }

        // Subscribe to live Realtime updates
        if (isSupabaseConfigured()) {
          unsubscribe = chatService.subscribeToMessages(matchId, (newMsg) => {
            if (!isMounted) return;
            setMessages((prev) => {
              // Deduplicate by message ID or client_id
              if (prev.some((m) => m.id === newMsg.id || (m.client_id && m.client_id === (newMsg as any).client_id))) {
                return prev.map((m) => (m.id === newMsg.id ? { ...newMsg, delivery_status: 'sent' } : m));
              }
              return [...prev, { ...newMsg, delivery_status: 'sent' }];
            });
            // Mark new incoming message as read
            chatService.markMessagesAsRead(matchId).catch(() => {});
          });
        }
      } catch (err: any) {
        console.error('Chat initial load error:', err?.message);
        if (isMounted && !isDemo) {
          setMessages([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initChat();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [matchId, isDemo]);

  // Load older messages (pagination)
  const handleLoadOlder = async () => {
    if (loadingOlder || !hasMoreOlder || isDemo || messages.length === 0) return;

    try {
      setLoadingOlder(true);
      const oldestTimestamp = messages[0].created_at;
      const olderMessages = await chatService.fetchMessages(matchId, 30, oldestTimestamp);

      if (olderMessages.length < 30) {
        setHasMoreOlder(false);
      }

      if (olderMessages.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const uniqueOlder = olderMessages.filter((m) => !existingIds.has(m.id));
          return [...uniqueOlder, ...prev];
        });
      }
    } catch (e) {
      console.warn('Failed to load older messages:', e);
    } finally {
      setLoadingOlder(false);
    }
  };

  // Send message with optimistic update and failure handling
  const handleSendMessage = async (text: string) => {
    if (!isConversationActive) return;

    const currentUserId = profile?.id || 'demo-user-123';
    const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const optimisticMsg: Message = {
      id: clientId,
      client_id: clientId,
      match_id: matchId,
      sender_id: currentUserId,
      content: text,
      is_read: false,
      created_at: new Date().toISOString(),
      delivery_status: 'sending',
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const delivered = await chatService.sendMessage(matchId, currentUserId, text);
      setMessages((prev) =>
        prev.map((m) =>
          m.client_id === clientId
            ? { ...delivered, client_id: clientId, delivery_status: 'sent' }
            : m
        )
      );
    } catch (e: any) {
      console.error('Failed to send message:', e?.message);
      setMessages((prev) =>
        prev.map((m) =>
          m.client_id === clientId ? { ...m, delivery_status: 'failed' } : m
        )
      );
    }
  };

  // Retry sending a failed message
  const handleRetryMessage = async (failedMsg: Message) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === failedMsg.id ? { ...m, delivery_status: 'sending' } : m
      )
    );

    try {
      const currentUserId = profile?.id || 'demo-user-123';
      const delivered = await chatService.sendMessage(matchId, currentUserId, failedMsg.content);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === failedMsg.id ? { ...delivered, delivery_status: 'sent' } : m
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === failedMsg.id ? { ...m, delivery_status: 'failed' } : m
        )
      );
    }
  };

  const handleUnmatch = () => {
    Alert.alert(
      `Unmatch ${partnerName}?`,
      'This will remove your mutual connection and close this chat permanently.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unmatch',
          style: 'destructive',
          onPress: async () => {
            try {
              await matchingService.unmatch(matchId);
              setIsConversationActive(false);
              Alert.alert('Unmatched', `You have unmatched with ${partnerName}.`);
              router.replace('/(tabs)/matches');
            } catch {
              router.replace('/(tabs)/matches');
            }
          },
        },
      ]
    );
  };

  const handleBlock = () => {
    Alert.alert(
      `Block ${partnerName}?`,
      'This user will be blocked from matching, discovering your profile, or messaging you.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block User',
          style: 'destructive',
          onPress: async () => {
            try {
              await safetyService.blockUser(partnerId, 'Blocked from chat');
              setIsConversationActive(false);
              Alert.alert('Blocked', `${partnerName} has been blocked.`);
              router.replace('/(tabs)/matches');
            } catch {
              router.replace('/(tabs)/matches');
            }
          },
        },
      ]
    );
  };

  const myId = profile?.id || 'demo-user-123';

  return (
    <ScreenContainer keyboardAvoid={false}>
      {/* Header */}
      <View style={[styles.chatHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() =>
            router.push({
              pathname: `/profile/[id]`,
              params: { id: partnerId },
            })
          }
          style={styles.headerPartnerInfo}
        >
          <Avatar
            url={partnerAvatar}
            name={partnerName}
            size="sm"
            isVerified={partnerVerified === 'true'}
          />
          <View style={styles.headerTexts}>
            <Text style={[styles.headerName, { color: colors.text }]} numberOfLines={1}>
              {partnerName}
            </Text>
            <Text style={[styles.headerSub, { color: colors.textMuted }]} numberOfLines={1}>
              {partnerProfession}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowReport(true)} style={styles.headerIconBtn}>
            <Ionicons name="flag-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleUnmatch} style={styles.headerIconBtn}>
            <Ionicons name="person-remove-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleBlock} style={styles.headerIconBtn}>
            <Ionicons name="ban-outline" size={18} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Safety Notice Banner */}
      <View style={[styles.safetyNotice, { backgroundColor: colors.surface }]}>
        <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
        <Text style={[styles.safetyNoticeText, { color: colors.textSecondary }]}>
          Walk With Buddy safety tip: Always meet in well-lit public spots in Hyderabad.
        </Text>
      </View>

      {/* Inactive Conversation Warning */}
      {!isConversationActive && (
        <View style={[styles.closedBanner, { backgroundColor: colors.dangerLight }]}>
          <Ionicons name="lock-closed" size={14} color={colors.danger} />
          <Text style={[styles.closedText, { color: colors.danger }]}>
            This conversation is closed because the match was removed or one of the users was blocked.
          </Text>
        </View>
      )}

      {/* Messages Feed */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loading ? (
          <LoadingIndicator message="Connecting to secure chat..." />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={
              hasMoreOlder && !isDemo && messages.length >= 40 ? (
                <TouchableOpacity
                  onPress={handleLoadOlder}
                  disabled={loadingOlder}
                  style={styles.loadOlderBtn}
                >
                  {loadingOlder ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text style={[styles.loadOlderText, { color: colors.primary }]}>
                      Load older messages
                    </Text>
                  )}
                </TouchableOpacity>
              ) : undefined
            }
            ListEmptyComponent={
              <View style={styles.emptyChatBox}>
                <Ionicons name="chatbubbles-outline" size={40} color={colors.textMuted} />
                <Text style={[styles.emptyChatTitle, { color: colors.text }]}>No messages yet</Text>
                <Text style={[styles.emptyChatDesc, { color: colors.textMuted }]}>
                  Send a friendly greeting to say hi and plan your first walk!
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                isMine={item.sender_id === myId}
                onRetry={handleRetryMessage}
              />
            )}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => {
              if (!loadingOlder) flatListRef.current?.scrollToEnd({ animated: true });
            }}
          />
        )}

        {/* Quick Hyderabad Walk Suggestions */}
        {isConversationActive && (
          <View style={[styles.quickPromptsRow, { borderTopColor: colors.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickPromptsContent}>
              <TouchableOpacity
                onPress={() => handleSendMessage('Sounds great! Let’s meet at Durgam Cheruvu Lakefront.')}
                style={[styles.quickPromptPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={[styles.quickPromptText, { color: colors.textSecondary }]}>
                  📍 Durgam Cheruvu Lakefront
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSendMessage('How about a morning walk at KBR National Park?')}
                style={[styles.quickPromptPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={[styles.quickPromptText, { color: colors.textSecondary }]}>
                  🌳 KBR Park Morning Walk
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSendMessage('What pace do you usually prefer?')}
                style={[styles.quickPromptPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={[styles.quickPromptText, { color: colors.textSecondary }]}>
                  👟 Walking Pace?
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Message Input Component */}
        <ChatInput onSend={handleSendMessage} disabled={!isConversationActive} />
      </KeyboardAvoidingView>

      {/* Report Modal */}
      <ReportModal
        visible={showReport}
        targetUserId={partnerId}
        targetUserName={partnerName}
        onClose={() => setShowReport(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.xs,
  },
  headerPartnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTexts: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  headerName: {
    ...Typography.bodyMedium,
    fontWeight: '700',
  },
  headerSub: {
    ...Typography.caption,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerIconBtn: {
    padding: Spacing.xs,
  },
  safetyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    gap: 6,
  },
  safetyNoticeText: {
    ...Typography.caption,
    fontSize: 11,
    flex: 1,
  },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    gap: 6,
  },
  closedText: {
    ...Typography.caption,
    fontWeight: '700',
    flex: 1,
  },
  messagesList: {
    paddingVertical: Spacing.md,
    flexGrow: 1,
  },
  loadOlderBtn: {
    alignSelf: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
  },
  loadOlderText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  emptyChatBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    minHeight: 200,
  },
  emptyChatTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  emptyChatDesc: {
    ...Typography.caption,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 18,
  },
  quickPromptsRow: {
    paddingVertical: 6,
    borderTopWidth: 1,
  },
  quickPromptsContent: {
    paddingHorizontal: Spacing.md,
    gap: 8,
  },
  quickPromptPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  quickPromptText: {
    ...Typography.caption,
    fontWeight: '600',
  },
});
