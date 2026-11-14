// ====================================================================
// SCREEN 16: REAL-TIME CHAT
// ====================================================================

import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { Header } from '../../src/components/common/Header';
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

const SEED_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    match_id: 'demo-match-001',
    sender_id: 'seed-ananya-1',
    content: 'Hi Harsha! Great to connect with another tech enthusiast here in Hyderabad.',
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'msg-2',
    match_id: 'demo-match-001',
    sender_id: 'demo-user-123',
    content: 'Hi Ananya! Happy to connect. I saw you enjoy evening walks by Durgam Cheruvu.',
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: 'msg-3',
    match_id: 'demo-match-001',
    sender_id: 'seed-ananya-1',
    content: 'Yes! The sunset view from the boardwalk is awesome. Would you be free for a 3km walk this Thursday around 6 PM?',
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
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
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function initChat() {
      try {
        setLoading(true);
        const fetched = await chatService.fetchMessages(matchId);
        if (fetched && fetched.length > 0) {
          setMessages(fetched);
        } else {
          setMessages(SEED_MESSAGES);
        }

        if (profile?.id) {
          await chatService.markMessagesAsRead(matchId, profile.id);
        }

        // Subscribe to Supabase Realtime
        unsubscribe = chatService.subscribeToMessages(matchId, (newMsg) => {
          setMessages((prev) => [...prev, newMsg]);
        });
      } catch {
        setMessages(SEED_MESSAGES);
      } finally {
        setLoading(false);
      }
    }

    initChat();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [matchId, profile?.id]);

  const handleSendMessage = async (text: string) => {
    const currentUserId = profile?.id || 'demo-user-123';
    const optimisticMsg: Message = {
      id: `local-${Date.now()}`,
      match_id: matchId,
      sender_id: currentUserId,
      content: text,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      await chatService.sendMessage(matchId, currentUserId, text);
    } catch (e: any) {
      console.warn('Backend message sync fallback:', e?.message);
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
      {/* Custom Chat Header */}
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
          Walk With Buddy reminder: Always meet in open public spots during daylight.
        </Text>
      </View>

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
            renderItem={({ item }) => (
              <MessageBubble message={item} isMine={item.sender_id === myId} />
            )}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Quick Hyderabad Walk Suggestions */}
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

        {/* Message Input Component */}
        <ChatInput onSend={handleSendMessage} />
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
  messagesList: {
    paddingVertical: Spacing.md,
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
