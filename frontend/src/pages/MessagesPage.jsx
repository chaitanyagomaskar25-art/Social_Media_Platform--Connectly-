import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { userService } from '../services/userService';
import UserAvatar from '../components/common/UserAvatar';
import Button from '../components/common/Button';
import {
  Search,
  Send,
  MessageSquare,
  Sparkles,
  Check,
  CheckCheck,
  User,
  ArrowLeft,
  Plus,
  Circle,
  X,
} from 'lucide-react';

export default function MessagesPage() {
  const { user } = useAuth();
  const { socket, isUserOnline } = useSocket();
  const { showError, showSuccess } = useToast();

  const currentUserId = String(user?.id || user?._id || user?.userId || '');
  const storageKey = `connectly_messages_${currentUserId}`;

  const [conversations, setConversations] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activePartnerId, setActivePartnerId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [suggestedCreators, setSuggestedCreators] = useState([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const messagesEndRef = useRef(null);

  // Save messages to local storage whenever conversations change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(conversations));
    } catch {}
  }, [conversations, storageKey]);

  // Load creators for "New Chat" selection
  useEffect(() => {
    let isMounted = true;
    userService
      .getSuggestedUsers()
      .then((res) => {
        if (isMounted) {
          const list = Array.isArray(res) ? res : res.users || res.data || [];
          setSuggestedCreators(
            list.filter((c) => String(c.id || c._id || c.userId) !== currentUserId)
          );
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [currentUserId]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activePartnerId, conversations]);

  // Socket listener for real-time messages if emitted
  useEffect(() => {
    if (!socket) return;

    const handleIncomingMessage = (data) => {
      if (!data || !data.senderId || !data.text) return;
      if (String(data.receiverId) !== currentUserId) return;

      const partnerId = String(data.senderId);
      const newMsg = {
        id: data.id || `msg-${Date.now()}`,
        senderId: partnerId,
        text: data.text,
        timestamp: data.timestamp || Date.now(),
      };

      setConversations((prev) => {
        const existing = prev.find((c) => String(c.partner.id) === partnerId);
        if (existing) {
          return prev.map((c) =>
            String(c.partner.id) === partnerId
              ? {
                  ...c,
                  messages: [...c.messages, newMsg],
                  lastMessage: newMsg.text,
                  lastTimestamp: newMsg.timestamp,
                  unreadCount:
                    activePartnerId === partnerId ? 0 : (c.unreadCount || 0) + 1,
                }
              : c
          );
        }
        // If from a new partner
        return [
          {
            partner: data.sender || {
              id: partnerId,
              name: 'Creator',
              username: 'creator',
            },
            messages: [newMsg],
            lastMessage: newMsg.text,
            lastTimestamp: newMsg.timestamp,
            unreadCount: 1,
          },
          ...prev,
        ];
      });
    };

    socket.on('direct_message:new', handleIncomingMessage);
    return () => {
      socket.off('direct_message:new', handleIncomingMessage);
    };
  }, [socket, currentUserId, activePartnerId]);

  // Active conversation object
  const activeConversation = useMemo(() => {
    return conversations.find((c) => String(c.partner.id) === String(activePartnerId));
  }, [conversations, activePartnerId]);

  const handleStartChatWith = (creator) => {
    const creatorId = String(creator.id || creator._id || creator.userId);
    const existing = conversations.find((c) => String(c.partner.id) === creatorId);

    if (!existing) {
      const newConv = {
        partner: {
          id: creatorId,
          name: creator.name || creator.username,
          username: creator.username,
          avatarUrl: creator.avatarUrl || creator.avatar || creator.profilePicture,
        },
        messages: [],
        lastMessage: 'Conversation opened',
        lastTimestamp: Date.now(),
        unreadCount: 0,
      };
      setConversations((prev) => [newConv, ...prev]);
    }

    setActivePartnerId(creatorId);
    setShowNewChatModal(false);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !activePartnerId) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      senderId: currentUserId,
      text,
      timestamp: Date.now(),
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (String(c.partner.id) === String(activePartnerId)) {
          return {
            ...c,
            messages: [...c.messages, newMsg],
            lastMessage: text,
            lastTimestamp: Date.now(),
            unreadCount: 0,
          };
        }
        return c;
      })
    );

    // If socket available, emit direct message
    if (socket) {
      socket.emit('direct_message:send', {
        receiverId: activePartnerId,
        senderId: currentUserId,
        sender: {
          id: currentUserId,
          name: user?.name || user?.username,
          username: user?.username,
          avatarUrl: user?.avatarUrl,
        },
        text,
        timestamp: Date.now(),
      });
    }

    setInputText('');
  };

  // Filter conversations by query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.partner?.name?.toLowerCase().includes(q) ||
        c.partner?.username?.toLowerCase().includes(q) ||
        c.lastMessage?.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  return (
    <div className="rounded-3xl border border-border-subtle bg-surface shadow-editorial-xs overflow-hidden h-[calc(100vh-10rem)] min-h-[520px] flex transition-all duration-200">
      {/* Left Column: Conversations List */}
      <div
        className={`w-full sm:w-80 md:w-96 border-r border-border-subtle flex flex-col bg-surface ${
          activePartnerId ? 'hidden sm:flex' : 'flex'
        }`}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border-subtle flex items-center justify-between">
          <div>
            <h1 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-txt-primary">
              Direct Messages
            </h1>
            <p className="text-[11px] text-txt-muted mono-meta">Private Atelier Inquiries</p>
          </div>

          <button
            type="button"
            onClick={() => setShowNewChatModal(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white shadow-editorial-xs hover:scale-105 active:scale-95 transition-all"
            title="Start new conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-border-subtle">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-txt-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dialogues…"
              className="w-full bg-surface-elevated/70 border border-border-subtle text-txt-primary placeholder-txt-muted text-xs pl-9 pr-3 py-2 rounded-xl outline-none focus:border-accent focus:bg-surface transition-all"
            />
          </div>
        </div>

        {/* Conversation Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-border-subtle/50">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const partnerId = String(conv.partner.id);
              const isSelected = String(activePartnerId) === partnerId;
              const isOnline = isUserOnline(partnerId);

              return (
                <button
                  type="button"
                  key={partnerId}
                  onClick={() => {
                    setActivePartnerId(partnerId);
                    setConversations((prev) =>
                      prev.map((c) =>
                        String(c.partner.id) === partnerId ? { ...c, unreadCount: 0 } : c
                      )
                    );
                  }}
                  className={`w-full text-left p-3.5 flex items-center gap-3 transition-colors ${
                    isSelected
                      ? 'bg-accent/10 border-l-4 border-accent'
                      : 'hover:bg-surface-elevated/60'
                  }`}
                >
                  <UserAvatar
                    src={conv.partner.avatarUrl}
                    name={conv.partner.name || conv.partner.username}
                    size="md"
                    statusIndicator={isOnline}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className="text-xs sm:text-sm font-semibold text-txt-primary truncate font-serif">
                        {conv.partner.name || conv.partner.username}
                      </p>
                      <span className="mono-meta text-[10px] text-txt-muted shrink-0">
                        {new Date(conv.lastTimestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-txt-secondary truncate leading-tight">
                      {conv.lastMessage}
                    </p>
                  </div>

                  {conv.unreadCount > 0 && (
                    <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white shadow-sm">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="p-8 text-center">
              <MessageSquare className="mx-auto h-7 w-7 text-txt-muted mb-2" />
              <p className="text-xs font-semibold text-txt-primary font-serif">
                {searchQuery ? 'No conversations found' : 'No dialogues open'}
              </p>
              <p className="text-[11px] text-txt-muted mt-1">
                Start a private conversation with any creator.
              </p>
              <button
                type="button"
                onClick={() => setShowNewChatModal(true)}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
              >
                Start Dialogue &rarr;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Chat View */}
      <div
        className={`flex-1 flex flex-col bg-canvas/30 ${
          activePartnerId ? 'flex' : 'hidden sm:flex'
        }`}
      >
        {activeConversation ? (
          <>
            {/* Chat Top Masthead */}
            <div className="p-3.5 sm:p-4 border-b border-border-subtle bg-surface flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActivePartnerId(null)}
                  className="sm:hidden p-1.5 rounded-lg text-txt-muted hover:bg-surface-elevated"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <UserAvatar
                  src={activeConversation.partner.avatarUrl}
                  name={activeConversation.partner.name}
                  size="sm"
                  statusIndicator={isUserOnline(activeConversation.partner.id)}
                />

                <div>
                  <h2 className="text-xs sm:text-sm font-semibold text-txt-primary font-serif">
                    {activeConversation.partner.name || activeConversation.partner.username}
                  </h2>
                  <p className="mono-meta text-[10px] text-txt-muted">
                    @{activeConversation.partner.username} &bull;{' '}
                    {isUserOnline(activeConversation.partner.id) ? (
                      <span className="text-emerald-500 font-medium">Online</span>
                    ) : (
                      'Offline'
                    )}
                  </p>
                </div>
              </div>

              <Link
                to={`/profile/${activeConversation.partner.id}`}
                className="text-xs font-medium text-accent hover:underline flex items-center gap-1"
              >
                <span>View Profile</span>
              </Link>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {activeConversation.messages.length > 0 ? (
                activeConversation.messages.map((msg) => {
                  const isMine = String(msg.senderId) === currentUserId;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[78%] sm:max-w-md px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                          isMine
                            ? 'bg-accent text-white rounded-2xl rounded-tr-xs shadow-editorial-xs'
                            : 'bg-surface text-txt-primary border border-border-subtle rounded-2xl rounded-tl-xs shadow-editorial-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                      </div>

                      <span className="mono-meta text-[9px] text-txt-muted mt-1 px-1 flex items-center gap-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {isMine && <CheckCheck className="w-2.5 h-2.5 text-accent" />}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-txt-muted">
                  <Sparkles className="w-8 h-8 text-accent mb-2" />
                  <p className="font-serif text-sm font-semibold text-txt-primary">
                    Private Dialogue Started
                  </p>
                  <p className="text-xs text-txt-muted max-w-xs mt-1">
                    Send a message to start sharing insights, perspectives, and ideas.
                  </p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 sm:p-4 bg-surface border-t border-border-subtle flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Message @${activeConversation.partner.username}…`}
                className="flex-1 bg-surface-elevated/70 border border-border-subtle text-txt-primary placeholder-txt-muted text-xs sm:text-sm px-4 py-2.5 rounded-2xl outline-none focus:border-accent focus:bg-surface transition-all"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-white shadow-editorial-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-txt-muted">
            <div className="w-14 h-14 rounded-2xl bg-surface-elevated flex items-center justify-center text-accent border border-border-subtle mb-3">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-base sm:text-lg font-bold text-txt-primary">
              Your Atelier Inbox
            </h3>
            <p className="text-xs text-txt-muted max-w-sm mt-1">
              Select an open dialogue from the left or initiate a conversation with any creator.
            </p>
            <Button
              size="sm"
              onClick={() => setShowNewChatModal(true)}
              className="mt-4 rounded-full px-5"
            >
              Start New Dialogue
            </Button>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      {showNewChatModal &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-md rounded-3xl border border-border-medium bg-surface p-5 shadow-editorial-xl space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <h3 className="font-serif text-base font-bold text-txt-primary">
                  New Conversation
                </h3>
                <button
                  type="button"
                  onClick={() => setShowNewChatModal(false)}
                  className="p-1 rounded-full text-txt-muted hover:bg-surface-elevated transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-txt-secondary">
                Select a suggested creator to initiate a private direct dialogue:
              </p>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {suggestedCreators.length > 0 ? (
                  suggestedCreators.map((creator) => {
                    const cId = String(creator.id || creator._id || creator.userId);
                    return (
                      <button
                        type="button"
                        key={cId}
                        onClick={() => handleStartChatWith(creator)}
                        className="w-full flex items-center justify-between p-2.5 rounded-2xl border border-border-subtle bg-surface-elevated/40 hover:bg-surface-elevated transition-colors text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <UserAvatar
                            src={creator.avatarUrl}
                            name={creator.name || creator.username}
                            size="sm"
                          />
                          <div>
                            <p className="text-xs font-semibold text-txt-primary font-serif">
                              {creator.name || creator.username}
                            </p>
                            <p className="mono-meta text-[10px] text-txt-muted">
                              @{creator.username}
                            </p>
                          </div>
                        </div>

                        <span className="text-xs font-semibold text-accent">Message &rarr;</span>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-xs text-txt-muted py-4 text-center">
                    Discover creators in Explore to message them directly.
                  </p>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
