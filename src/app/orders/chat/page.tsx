'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
import { apiService } from '@/services/api';
import styles from './Chat.module.css';

interface ChatMessage {
    id: number;
    sender: number;
    sender_name: string;
    sender_type: string;
    message: string;
    is_read: boolean;
    created_at: string;
    is_me: boolean;
}

function ChatContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('id');

    // Safety check just in case
    const safeOrderId = orderId ? Number(orderId) : 0;

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!safeOrderId) return;

        // Initial fetch
        fetchMessages();
        markRead();

        // Listen for FCM updates instead of polling
        const handleFcmUpdate = (event: any) => {
            const payload = event.detail;
            const updatedOrderId = payload.data?.order_id || payload.data?.id;

            if (Number(updatedOrderId) === safeOrderId) {
                fetchMessages(true);
                markRead(); // Also mark as read when new message arrives
            }
        };

        window.addEventListener('fcm_chat_message', handleFcmUpdate);

        return () => {
            window.removeEventListener('fcm_chat_message', handleFcmUpdate);
        };
    }, [safeOrderId]);

    useEffect(() => {
        // Scroll to bottom on messages change
        // Only if we were arguably at the bottom or it's the first load
        // For simplicity, always scroll on first load, otherwise only if user is near bottom?
        // Let's just scroll to bottom if it's the initial load or we sent a message.
        // Or naively scroll to bottom always for now (standard simple chat behavior)
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length]); // Scroll when message count changes

    const fetchMessages = async (isBackground = false) => {
        if (!safeOrderId) return;
        if (!isBackground) setIsLoading(true);
        try {
            const data = await apiService.getOrderChat(safeOrderId);
            setMessages(data);
        } catch (error) {
            console.error("Error fetching chat:", error);
        } finally {
            if (!isBackground) setIsLoading(false);
        }
    };

    const markRead = async () => {
        if (!safeOrderId) return;
        try {
            await apiService.markOrderChatRead(safeOrderId);
        } catch (error) {
            console.error("Error marking read:", error);
        }
    };

    const handleSend = async () => {
        if (!newMessage.trim() || !safeOrderId) return;

        const msgToSend = newMessage.trim();
        setNewMessage(''); // optimistic clear
        setIsSending(true);

        try {
            await apiService.sendOrderMessage(safeOrderId, msgToSend);
            // Fetch immediately to show update
            await fetchMessages(true);
        } catch (error) {
            console.error("Error sending message:", error);
            // Ideally show error toast, here just restore text
            setNewMessage(msgToSend);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const quickReply = (text: string) => {
        setNewMessage(text);
        // Optional: auto send? Or just populate? Mobile app seems to populate.
        // "onPressed: () { _messageController.text = reply; _sendMessage(); }" -> It sends immediately in mobile.
        // Let's populate and focus for web, or send immediately. 
        // I will match mobile: send immediately. But setState is async so I'll call API directly with text.
        // Actually, let's just populate to be safe on web where typing is easier.
        // Wait, the mobile code does `_sendMessage()` right after. 
        // I'll populate and let user hit send, it's safer UX for web.
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!safeOrderId) return <div className="p-10 text-center">Invalid Order ID</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button onClick={() => router.back()} className="mr-2 p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={20} color="#333" />
                </button>
                <h1>Chat on Order #{safeOrderId}</h1>
            </header>

            <div className={styles.chatWindow}>
                {isLoading && messages.length === 0 ? (
                    <div className="flex justify-center p-4">Loading messages...</div>
                ) : messages.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>No messages yet.</p>
                        <p>Have a question about your order?</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`${styles.messageBubble} ${msg.is_me ? styles.messageRight : styles.messageLeft}`}
                        >
                            {!msg.is_me && <div className={styles.senderName}>{msg.sender_name || 'Retailer'}</div>}
                            <div>{msg.message}</div>
                            <span className={styles.timestamp}>
                                {formatTime(msg.created_at)}
                                {msg.is_me && msg.is_read && <span className="ml-1">✓✓</span>}
                            </span>
                        </div>
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            <div className={styles.quickReplies}>
                {["Where is my order?", "Item missing", "Packing issue", "Delivery time?"].map(reply => (
                    <button
                        key={reply}
                        className={styles.chip}
                        onClick={() => {
                            setNewMessage(reply);
                            // handleSend(); // Uncomment to send immediately
                        }}
                    >
                        {reply}
                    </button>
                ))}
            </div>

            <footer className={styles.inputArea}>
                <input
                    type="text"
                    className={styles.input}
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={isSending}
                />
                <button
                    className={styles.sendButton}
                    onClick={handleSend}
                    disabled={!newMessage.trim() || isSending}
                >
                    <Send size={18} />
                </button>
            </footer>
        </div>
    );
}

export default function ChatPage() {
    return (
        <Suspense fallback={<div className="p-10 text-center">Loading Chat...</div>}>
            <ChatContent />
        </Suspense>
    );
}
