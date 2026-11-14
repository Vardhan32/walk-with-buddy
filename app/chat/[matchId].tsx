// ====================================================================
// SCREEN 16: REAL-TIME CHAT WITH MEETING PLANNER & CONVERSATION CARDS
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
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { Avatar } from '../../src/components/common/Avatar';
import { Badge } from '../../src/components/common/Badge';
import { MessageBubble } from '../../src/components/chat/MessageBubble';
import { ChatInput } from '../../src/components/chat/ChatInput';
import { ReportModal } from '../../src/components/safety/ReportModal';
import { LoadingIndicator } from '../../src/components/common/LoadingIndicator';
import { Button } from '../../src/components/common/Button';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Typography, Spacing, Radius } from '../../src/constants/theme';
import { Message, MeetingPlan, MeetingProposalStatus } from '../../src/types';
import { chatService } from '../../src/services/chat';
import { matchingService } from '../../src/services/matching';
import { safetyService } from '../../src/services/safety';
import { isSupabaseConfigured } from '../../src/services/supabase';
import { CONVERSATION_CARDS, CARD_CATEGORIES } from '../../src/constants/conversationCards';
import { TEACH_ME_PROMPTS } from '../../src/constants/teachMeSomething';
import { HYDERABAD_WALKING_PLACES } from '../../src/constants/cityExplorer';

// Demo initial messages for offline testing
const DEMO_OFFLINE_MESSAGES: Message[] = [
  {
    id: 'demo-msg-1',
    match_id: 'demo-match-001',
    sender_id: 'seed-ananya-1',
    content: 'Hi! Great to connect with another walking enthusiast here in Hyderabad.',
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
    content: 'Yes! The sunset view from the boardwalk is awesome. Would you like to plan a walk together this week?',
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    delivery_status: 'sent',
  },
];

export default function ChatScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
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

  // Conversation Cards & Teach Me States
  const [showCardsBar, setShowCardsBar] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [selectedCardCategory, setSelectedCardCategory] = useState<string>('all');
  const [showTeachMeModal, setShowTeachMeModal] = useState(false);

  // Meeting Planner ("Plan Our Walk") States
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [activePlan, setActivePlan] = useState<MeetingPlan | null>(null);
  const [planLocation, setPlanLocation] = useState('Durgam Cheruvu Lakefront Boardwalk');
  const [planArea, setPlanArea] = useState('Madhapur');
  const [planDate, setPlanDate] = useState('Tomorrow, 6:00 PM');
  const [planNotes, setPlanNotes] = useState('Meet near the boardwalk entrance / Starbucks.');

  const isDemo = !isSupabaseConfigured() && matchId === 'demo-match-001';
  const myId = profile?.id || 'demo-user-123';

  // Filtered conversation cards
  const availableCards =
    selectedCardCategory === 'all'
      ? CONVERSATION_CARDS
      : CONVERSATION_CARDS.filter((c) => c.category === selectedCardCategory);

  const currentCard = availableCards[currentCardIndex % availableCards.length];

  // Load initial messages and meeting plans
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isMounted = true;

    async function initChat() {
      try {
        setLoading(true);

        if (isDemo) {
          if (isMounted) {
            setMessages(DEMO_OFFLINE_MESSAGES);
            // Default demo proposal
            setActivePlan({
              id: 'plan-demo-001',
              match_id: matchId,
              proposer_id: partnerId,
              location_name: 'Durgam Cheruvu Lakefront Boardwalk',
              address_or_area: 'Madhapur, Hyderabad',
              meeting_time: new Date(Date.now() + 86400000).toISOString(),
              status: 'proposed',
              notes: 'Meet near the main boardwalk entry at 6:00 PM.',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        } else {
          // Live mode: fetch real messages from database
          const fetched = await chatService.fetchMessages(matchId, 40);
          if (isMounted) {
            setMessages(fetched);
            if (fetched.length < 40) setHasMoreOlder(false);
          }

          // Mark unread messages via secure RPC
          await chatService.markMessagesAsRead(matchId);

          // Fetch meeting plans from Supabase
          const plans = await matchingService.fetchMeetingPlans(matchId);
          if (isMounted && plans.length > 0) {
            setActivePlan(plans[0]);
          }
        }

        // Subscribe to live Realtime updates
        if (isSupabaseConfigured()) {
          unsubscribe = chatService.subscribeToMessages(matchId, (newMsg) => {
            if (!isMounted) return;
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id || (m.client_id && m.client_id === (newMsg as any).client_id))) {
                return prev.map((m) => (m.id === newMsg.id ? { ...newMsg, delivery_status: 'sent' } : m));
              }
              return [...prev, { ...newMsg, delivery_status: 'sent' }];
            });
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
  }, [matchId, isDemo, partnerId]);

  // Load older messages (pagination)
  const handleLoadOlder = async () => {
    if (loadingOlder || !hasMoreOlder || isDemo || messages.length === 0) return;

    try {
      setLoadingOlder(true);
      const oldestTimestamp = messages[0].created_at;
      const older = await chatService.fetchMessages(matchId, 30, oldestTimestamp);

      if (older.length < 30) {
        setHasMoreOlder(false);
      }

      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const filteredNew = older.filter((m) => !existingIds.has(m.id));
        return [...filteredNew, ...prev];
      });
    } catch (e: any) {
      console.warn('Failed to load older messages:', e?.message);
    } finally {
      setLoadingOlder(false);
    }
  };

  // Send message handler with optimistic UI
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !isConversationActive) return;

    const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const optimisticMessage: Message = {
      id: clientId,
      client_id: clientId,
      match_id: matchId,
      sender_id: myId,
      content: content.trim(),
      is_read: false,
      created_at: new Date().toISOString(),
      delivery_status: 'sending',
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    if (isDemo) {
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) => (m.client_id === clientId ? { ...m, delivery_status: 'sent' } : m))
        );
      }, 400);
      return;
    }

    try {
      const sent = await chatService.sendMessage(matchId, content.trim(), clientId);
      setMessages((prev) =>
        prev.map((m) =>
          m.client_id === clientId ? { ...sent, delivery_status: 'sent' } : m
        )
      );
    } catch (err: any) {
      console.error('Failed to send live message:', err?.message);
      setMessages((prev) =>
        prev.map((m) =>
          m.client_id === clientId ? { ...m, delivery_status: 'failed' } : m
        )
      );
    }
  };

  // Retry failed message
  const handleRetryMessage = async (failedMsg: Message) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === failedMsg.id ? { ...m, delivery_status: 'sending' } : m
      )
    );

    try {
      const sent = await chatService.sendMessage(
        matchId,
        failedMsg.content,
        failedMsg.client_id || failedMsg.id
      );
      setMessages((prev) =>
        prev.map((m) => (m.id === failedMsg.id ? { ...sent, delivery_status: 'sent' } : m))
      );
    } catch (e: any) {
      setMessages((prev) =>
        prev.map((m) => (m.id === failedMsg.id ? { ...m, delivery_status: 'failed' } : m))
      );
    }
  };

  // Send Conversation Card question with consent
  const handleSendCardQuestion = (card: typeof currentCard) => {
    Alert.alert(
      'Send Conversation Question?',
      `"${card.question}"`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send to Buddy',
          onPress: () => {
            handleSendMessage(`💬 ${card.question}`);
          },
        },
      ]
    );
  };

  // Propose Meeting Plan
  const handleProposePlan = async () => {
    if (!planLocation.trim()) {
      Alert.alert('Required', 'Please enter a public meeting location.');
      return;
    }

    const newPlan: MeetingPlan = {
      id: `plan-${Date.now()}`,
      match_id: matchId,
      proposer_id: myId,
      location_name: planLocation.trim(),
      address_or_area: planArea.trim() || 'Hyderabad',
      meeting_time: new Date(Date.now() + 86400000).toISOString(),
      status: 'proposed',
      notes: planNotes.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setActivePlan(newPlan);
    setShowPlanModal(false);

    if (isSupabaseConfigured()) {
      try {
        await matchingService.proposeMeetingPlan({
          match_id: matchId,
          location_name: planLocation.trim(),
          address_or_area: planArea.trim() || 'Hyderabad',
          meeting_time: newPlan.meeting_time,
          notes: planNotes.trim(),
        });
      } catch (e: any) {
        console.warn('Failed to propose plan to server:', e?.message);
      }
    }

    handleSendMessage(`📍 Proposed a Walk: ${planLocation} (${planArea}) - ${planDate}. Let's confirm!`);
  };

  // Respond to meeting proposal (Accept / Decline)
  const handleRespondPlan = async (status: MeetingProposalStatus) => {
    if (!activePlan) return;

    setActivePlan((prev) => (prev ? { ...prev, status } : null));

    if (isSupabaseConfigured() && !isDemo) {
      try {
        await matchingService.respondToMeetingPlan(activePlan.id, status);
      } catch (e: any) {
        console.warn('Failed to update plan status:', e?.message);
      }
    }

    if (status === 'accepted') {
      handleSendMessage(`🎉 Agreed to meet at ${activePlan.location_name}! See you there.`);
    } else if (status === 'declined') {
      handleSendMessage(`I won't be able to make that spot/time. Could we propose another place?`);
    }
  };

  // Open Google Maps external navigation
  const handleOpenGoogleMaps = (locationName: string, area: string) => {
    const query = encodeURIComponent(`${locationName}, ${area}, Hyderabad`);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Navigation Error', 'Could not open Google Maps app.');
    });
  };

  // Unmatch confirmation
  const handleUnmatch = () => {
    Alert.alert(
      'Unmatch Buddy',
      `Are you sure you want to unmatch with ${partnerName}? This conversation will be permanently closed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unmatch',
          style: 'destructive',
          onPress: async () => {
            try {
              await matchingService.unmatch(matchId);
              setIsConversationActive(false);
              Alert.alert('Unmatched', 'You have unmatched. Conversation closed.');
              router.replace('/(tabs)/matches');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not unmatch.');
            }
          },
        },
      ]
    );
  };

  // Block confirmation
  const handleBlock = () => {
    Alert.alert(
      'Block Buddy',
      `Block ${partnerName}? They will not be able to message you, find your profile, or see you in discovery.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await safetyService.blockUser(partnerId, 'User blocked in chat');
              setIsConversationActive(false);
              Alert.alert('User Blocked', 'This user has been blocked.');
              router.replace('/(tabs)/matches');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not block.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.chatHeader, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push(`/profile/${partnerId}`)}
          style={styles.headerPartnerInfo}
        >
          <Avatar url={partnerAvatar} name={partnerName} size="md" />
          <View style={styles.headerTexts}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={[styles.headerName, { color: colors.text }]} numberOfLines={1}>
                {partnerName}
              </Text>
              {partnerVerified === 'true' && (
                <Badge label="Verified" variant="verified" size="sm" />
              )}
            </View>
            <Text style={[styles.headerSub, { color: colors.textMuted }]} numberOfLines={1}>
              {partnerProfession || 'Walking Buddy'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          {/* Plan Walk CTA */}
          <TouchableOpacity
            onPress={() => setShowPlanModal(true)}
            style={[styles.planWalkHeaderBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
          >
            <Ionicons name="calendar" size={14} color={colors.primary} />
            <Text style={[styles.planWalkHeaderText, { color: colors.primaryDark }]}>Plan</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowCardsBar(!showCardsBar)} style={styles.headerIconBtn}>
            <Ionicons name="bulb-outline" size={20} color={showCardsBar ? colors.primary : colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleUnmatch} style={styles.headerIconBtn}>
            <Ionicons name="person-remove-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowReport(true)} style={styles.headerIconBtn}>
            <Ionicons name="shield-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Introductory Assistant Banner */}
      <View style={[styles.assistantIntroBanner, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name="sparkles" size={16} color={colors.primary} />
        <Text style={[styles.assistantIntroText, { color: colors.primaryDark }]}>
          Great! You've found someone new. Let's plan something together.
        </Text>
      </View>

      {/* Safety Notice */}
      <View style={[styles.safetyNotice, { backgroundColor: colors.surface }]}>
        <Ionicons name="shield-checkmark-outline" size={13} color={colors.primary} />
        <Text style={[styles.safetyNoticeText, { color: colors.textMuted }]}>
          Keep plans in public spaces like Durgam Cheruvu or KBR Park. Never share exact home coordinates.
        </Text>
      </View>

      {/* Conversation Cards Interactive Bar */}
      {showCardsBar && (
        <View style={[styles.cardsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardsHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="chatbubbles" size={15} color={colors.primary} />
              <Text style={[styles.cardsHeaderTitle, { color: colors.text }]}>Conversation Cards</Text>
              <Badge label={currentCard.categoryLabel} variant="neutral" size="sm" />
            </View>
            <TouchableOpacity onPress={() => setCurrentCardIndex((prev) => prev + 1)} style={styles.shuffleBtn}>
              <Ionicons name="shuffle" size={14} color={colors.primary} />
              <Text style={[styles.shuffleText, { color: colors.primary }]}>Next Card</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.cardQuestion, { color: colors.text }]}>{currentCard.question}</Text>

          <View style={styles.cardActionsRow}>
            <TouchableOpacity
              onPress={() => handleSendCardQuestion(currentCard)}
              style={[styles.sendCardBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="paper-plane" size={13} color="#FFFFFF" />
              <Text style={styles.sendCardBtnText}>Ask Buddy This</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowTeachMeModal(true)}
              style={[styles.teachMeTriggerBtn, { borderColor: colors.border }]}
            >
              <Ionicons name="bulb-outline" size={13} color={colors.textSecondary} />
              <Text style={[styles.teachMeTriggerText, { color: colors.text }]}>Teach Me Something</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
              <View>
                {/* Pagination */}
                {hasMoreOlder && !isDemo && messages.length >= 40 ? (
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
                ) : null}

                {/* Meeting Plan Card (if exists) */}
                {activePlan && (
                  <View style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.planCardHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="footsteps" size={16} color={colors.primary} />
                        <Text style={[styles.planCardTitle, { color: colors.text }]}>Walk Proposal</Text>
                      </View>
                      <Badge
                        label={
                          activePlan.status === 'accepted'
                            ? 'Confirmed 🎉'
                            : activePlan.status === 'declined'
                            ? 'Declined'
                            : 'Pending Response'
                        }
                        variant={activePlan.status === 'accepted' ? 'verified' : 'neutral'}
                        size="sm"
                      />
                    </View>

                    <Text style={[styles.planLocationName, { color: colors.text }]}>
                      {activePlan.location_name}
                    </Text>
                    <Text style={[styles.planAreaText, { color: colors.textSecondary }]}>
                      {activePlan.address_or_area}
                    </Text>

                    {activePlan.notes ? (
                      <Text style={[styles.planNotesText, { color: colors.textMuted }]}>
                        "{activePlan.notes}"
                      </Text>
                    ) : null}

                    {/* Actions on proposal */}
                    {activePlan.status === 'proposed' && activePlan.proposer_id !== myId && (
                      <View style={styles.planResponseRow}>
                        <TouchableOpacity
                          onPress={() => handleRespondPlan('accepted')}
                          style={[styles.planActionBtn, { backgroundColor: colors.primary }]}
                        >
                          <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                          <Text style={styles.planActionText}>Accept Walk</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleRespondPlan('declined')}
                          style={[styles.planActionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                        >
                          <Ionicons name="close" size={15} color={colors.textMuted} />
                          <Text style={[styles.planActionText, { color: colors.text }]}>Decline</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Confirmed State: Google Maps Navigation */}
                    {activePlan.status === 'accepted' && (
                      <TouchableOpacity
                        onPress={() => handleOpenGoogleMaps(activePlan.location_name, activePlan.address_or_area)}
                        style={[styles.openMapsBtn, { backgroundColor: '#10B981' }]}
                      >
                        <Ionicons name="navigate" size={15} color="#FFFFFF" />
                        <Text style={styles.openMapsBtnText}>Open in Google Maps</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyChatBox}>
                <Ionicons name="chatbubbles-outline" size={40} color={colors.textMuted} />
                <Text style={[styles.emptyChatTitle, { color: colors.text }]}>No messages yet</Text>
                <Text style={[styles.emptyChatDesc, { color: colors.textMuted }]}>
                  Send a friendly greeting or propose a walk to get started!
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
                  📍 Durgam Cheruvu
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSendMessage('How about a morning walk at KBR National Park?')}
                style={[styles.quickPromptPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={[styles.quickPromptText, { color: colors.textSecondary }]}>
                  🌳 KBR Park
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowTeachMeModal(true)}
                style={[styles.quickPromptPill, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
              >
                <Text style={[styles.quickPromptText, { color: colors.primaryDark }]}>
                  💡 Teach Me Something
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Message Input Component */}
        <ChatInput onSend={handleSendMessage} disabled={!isConversationActive} />
      </KeyboardAvoidingView>

      {/* "Plan Our Walk" Proposal Modal */}
      <Modal visible={showPlanModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Plan Our Walk</Text>
              <TouchableOpacity onPress={() => setShowPlanModal(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                Propose a public Hyderabad meeting location. Both of you must agree before meeting.
              </Text>

              {/* Quick Pick from Vetted Hyderabad Spots */}
              <Text style={[styles.inputLabel, { color: colors.text }]}>Popular Hyderabad Public Spots:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
                {HYDERABAD_WALKING_PLACES.map((place) => (
                  <TouchableOpacity
                    key={place.id}
                    onPress={() => {
                      setPlanLocation(place.name);
                      setPlanArea(place.area);
                    }}
                    style={[
                      styles.spotPickerPill,
                      {
                        backgroundColor: planLocation === place.name ? colors.primary : colors.surface,
                        borderColor: planLocation === place.name ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.spotPickerText,
                        { color: planLocation === place.name ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {place.name.split(' ')[0]} ({place.area})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.inputLabel, { color: colors.text }]}>Location Name:</Text>
              <TextInput
                value={planLocation}
                onChangeText={setPlanLocation}
                placeholder="e.g. Durgam Cheruvu Boardwalk"
                placeholderTextColor={colors.textMuted}
                style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>Neighborhood / Area:</Text>
              <TextInput
                value={planArea}
                onChangeText={setPlanArea}
                placeholder="e.g. Madhapur"
                placeholderTextColor={colors.textMuted}
                style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>Date & Time:</Text>
              <TextInput
                value={planDate}
                onChangeText={setPlanDate}
                placeholder="e.g. Tomorrow, 6:00 PM"
                placeholderTextColor={colors.textMuted}
                style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>Meeting Notes / Landmark:</Text>
              <TextInput
                value={planNotes}
                onChangeText={setPlanNotes}
                placeholder="e.g. Meet near the boardwalk entry / Starbucks"
                placeholderTextColor={colors.textMuted}
                style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              />

              <View style={[styles.safetyNoteBox, { backgroundColor: colors.surface }]}>
                <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
                <Text style={[styles.safetyNoteBoxText, { color: colors.textMuted }]}>
                  Never use private residences as meeting spots. Always meet in open daylight or busy public areas.
                </Text>
              </View>

              <Button
                title="Send Walk Proposal"
                onPress={handleProposePlan}
                variant="primary"
                style={{ marginTop: Spacing.md, marginBottom: Spacing.lg }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* "Teach Me Something" Modal */}
      <Modal visible={showTeachMeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="bulb" size={20} color="#F59E0B" />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Teach Me Something</Text>
              </View>
              <TouchableOpacity onPress={() => setShowTeachMeModal(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              Ask {partnerName} to share an insider secret, unique craft, or fun trivia!
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {TEACH_ME_PROMPTS.map((prompt) => (
                <TouchableOpacity
                  key={prompt.id}
                  onPress={() => {
                    setShowTeachMeModal(false);
                    handleSendMessage(prompt.messageText);
                  }}
                  style={[styles.teachMeOptionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Ionicons name={prompt.icon as any} size={22} color={colors.primary} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.teachMeOptionTitle, { color: colors.text }]}>{prompt.title}</Text>
                    <Text style={[styles.teachMeOptionSub, { color: colors.textMuted }]}>{prompt.subtitle}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
    gap: 4,
  },
  headerIconBtn: {
    padding: Spacing.xs,
  },
  planWalkHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  planWalkHeaderText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  assistantIntroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    gap: 8,
  },
  assistantIntroText: {
    ...Typography.caption,
    fontWeight: '700',
    flex: 1,
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
  cardsContainer: {
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  cardsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  cardsHeaderTitle: {
    ...Typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  shuffleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shuffleText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  cardQuestion: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    marginVertical: Spacing.xs,
    lineHeight: 20,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  sendCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
  },
  sendCardBtnText: {
    ...Typography.caption,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  teachMeTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  teachMeTriggerText: {
    ...Typography.caption,
    fontWeight: '600',
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
  planCard: {
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  planCardTitle: {
    ...Typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  planLocationName: {
    ...Typography.bodyMedium,
    fontWeight: '800',
  },
  planAreaText: {
    ...Typography.caption,
    fontWeight: '600',
    marginBottom: 4,
  },
  planNotesText: {
    ...Typography.caption,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },
  planResponseRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  planActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  planActionText: {
    ...Typography.caption,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  openMapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
  },
  openMapsBtnText: {
    ...Typography.caption,
    fontWeight: '700',
    color: '#FFFFFF',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  modalTitle: {
    ...Typography.bodyLarge,
    fontWeight: '800',
  },
  modalSub: {
    ...Typography.caption,
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...Typography.caption,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  spotPickerPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginRight: 8,
  },
  spotPickerText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  safetyNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  safetyNoteBoxText: {
    ...Typography.caption,
    flex: 1,
    lineHeight: 16,
  },
  teachMeOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  teachMeOptionTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
    marginBottom: 2,
  },
  teachMeOptionSub: {
    ...Typography.caption,
  },
});
