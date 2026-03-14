"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import styles from "./chat.module.css";

const HTTP_URL = process.env.NEXT_PUBLIC_HTTP_URL || "http://localhost:3001";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3002";

interface Room {
    id: string;
    name: string;
    userCount: number;
    users: string[];
}

interface ChatMessage {
    id: string;
    type: "chat" | "system";
    userId?: string;
    message: string;
    roomId: string;
    timestamp: number;
}

export default function ChatPage() {
    const [username, setUsername] = useState("");
    const [isUsernameSet, setIsUsernameSet] = useState(false);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [newRoomName, setNewRoomName] = useState("");
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const [joinedRooms, setJoinedRooms] = useState<Set<string>>(new Set());
    const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
    const [messageInput, setMessageInput] = useState("");
    const [wsConnected, setWsConnected] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, activeRoomId]);

    // Fetch rooms
    const fetchRooms = useCallback(async () => {
        try {
            const res = await fetch(`${HTTP_URL}/api/rooms`);
            const data = await res.json();
            setRooms(data.rooms || []);
        } catch (err) {
            console.error("Failed to fetch rooms:", err);
        }
    }, []);

    // Fetch rooms periodically
    useEffect(() => {
        fetchRooms();
        const interval = setInterval(fetchRooms, 3000);
        return () => clearInterval(interval);
    }, [fetchRooms]);

    // Connect WebSocket when username is set
    useEffect(() => {
        if (!isUsernameSet || !username) return;

        const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(username)}`);
        wsRef.current = ws;

        ws.onopen = () => {
            setWsConnected(true);
        };

        ws.onclose = () => {
            setWsConnected(false);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "CHAT") {
                    const msg: ChatMessage = {
                        id: `${data.timestamp}-${data.userId}-${Math.random()}`,
                        type: "chat",
                        userId: data.userId,
                        message: data.message,
                        roomId: data.roomId,
                        timestamp: data.timestamp,
                    };
                    setMessages((prev) => ({
                        ...prev,
                        [data.roomId]: [...(prev[data.roomId] || []), msg],
                    }));
                }
            } catch {
                // Non-JSON messages (system messages from WS)
                const systemMsg: ChatMessage = {
                    id: `sys-${Date.now()}-${Math.random()}`,
                    type: "system",
                    message: event.data,
                    roomId: "system",
                    timestamp: Date.now(),
                };
                if (activeRoomId) {
                    setMessages((prev) => ({
                        ...prev,
                        [activeRoomId]: [...(prev[activeRoomId] || []), systemMsg],
                    }));
                }
            }
        };

        return () => {
            ws.close();
        };
    }, [isUsernameSet, username]);

    // Set username
    const handleSetUsername = () => {
        if (username.trim()) {
            setIsUsernameSet(true);
        }
    };

    // Create room
    const handleCreateRoom = async () => {
        if (!newRoomName.trim()) return;
        try {
            await fetch(`${HTTP_URL}/api/rooms`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newRoomName.trim() }),
            });
            setNewRoomName("");
            fetchRooms();
        } catch (err) {
            console.error("Failed to create room:", err);
        }
    };

    // Join room
    const handleJoinRoom = async (roomId: string) => {
        if (!isUsernameSet) return;
        try {
            await fetch(`${HTTP_URL}/api/rooms/${roomId}/join`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: username }),
            });

            // Tell WS server to join this room
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(
                    JSON.stringify({ type: "JOIN", roomId, payload: "" })
                );
            }

            setJoinedRooms((prev) => new Set(prev).add(roomId));
            setActiveRoomId(roomId);

            // Add system message
            const sysMsg: ChatMessage = {
                id: `sys-join-${Date.now()}`,
                type: "system",
                message: `You joined the room`,
                roomId,
                timestamp: Date.now(),
            };
            setMessages((prev) => ({
                ...prev,
                [roomId]: [...(prev[roomId] || []), sysMsg],
            }));

            fetchRooms();
        } catch (err) {
            console.error("Failed to join room:", err);
        }
    };

    // Leave room
    const handleLeaveRoom = async (roomId: string) => {
        try {
            await fetch(`${HTTP_URL}/api/rooms/${roomId}/leave`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: username }),
            });

            // Tell WS server to leave
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(
                    JSON.stringify({ type: "LEAVE", roomId, payload: "" })
                );
            }

            setJoinedRooms((prev) => {
                const next = new Set(prev);
                next.delete(roomId);
                return next;
            });

            if (activeRoomId === roomId) {
                setActiveRoomId(null);
            }

            fetchRooms();
        } catch (err) {
            console.error("Failed to leave room:", err);
        }
    };

    // Send message
    const handleSendMessage = () => {
        if (!messageInput.trim() || !activeRoomId || !wsConnected) return;

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
                JSON.stringify({
                    type: "CHAT",
                    roomId: activeRoomId,
                    payload: messageInput.trim(),
                })
            );
            setMessageInput("");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const activeRoom = rooms.find((r) => r.id === activeRoomId);
    const activeMessages = activeRoomId ? messages[activeRoomId] || [] : [];

    const formatTime = (ts: number) => {
        return new Date(ts).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className={styles.chatLayout}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <Link href="/" className={styles.sidebarLogo}>
                        <span className={styles.sidebarLogoIcon}>💬</span>
                        ChatVerse
                    </Link>

                    {/* Username */}
                    <div className={styles.usernameSection}>
                        <label className={styles.label}>Your Name</label>
                        <div className={styles.inputGroup}>
                            <input
                                id="username-input"
                                className={styles.input}
                                type="text"
                                placeholder="Enter username..."
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={isUsernameSet}
                                onKeyDown={(e) => e.key === "Enter" && handleSetUsername()}
                            />
                            {!isUsernameSet && (
                                <button
                                    id="set-username-btn"
                                    className={styles.btnCreate}
                                    onClick={handleSetUsername}
                                >
                                    Set
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Create room */}
                    {isUsernameSet && (
                        <div>
                            <label className={styles.label}>Create Room</label>
                            <div className={styles.createSection}>
                                <input
                                    id="room-name-input"
                                    className={styles.input}
                                    type="text"
                                    placeholder="Room name..."
                                    value={newRoomName}
                                    onChange={(e) => setNewRoomName(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleCreateRoom()}
                                />
                                <button
                                    id="create-room-btn"
                                    className={styles.btnCreate}
                                    onClick={handleCreateRoom}
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Room list */}
                <div className={styles.roomList}>
                    <div className={styles.roomListTitle}>
                        Rooms ({rooms.length})
                    </div>

                    {rooms.length === 0 ? (
                        <div className={styles.emptyRooms}>
                            <div className={styles.emptyIcon}>🏠</div>
                            <p>No rooms yet. Create one to get started!</p>
                        </div>
                    ) : (
                        rooms.map((room) => {
                            const isJoined = joinedRooms.has(room.id);
                            const isActive = activeRoomId === room.id;

                            return (
                                <div
                                    key={room.id}
                                    className={`${styles.roomItem} ${isActive ? styles.roomItemActive : ""
                                        }`}
                                    onClick={() => isJoined && setActiveRoomId(room.id)}
                                >
                                    <div className={styles.roomInfo}>
                                        <span className={styles.roomName}>{room.name}</span>
                                        <span className={styles.roomMeta}>
                                            <span className={styles.onlineDot}></span>
                                            {room.userCount} user{room.userCount !== 1 ? "s" : ""}
                                        </span>
                                    </div>
                                    <div className={styles.roomActions}>
                                        {isUsernameSet && !isJoined && (
                                            <button
                                                className={styles.btnJoin}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleJoinRoom(room.id);
                                                }}
                                            >
                                                Join
                                            </button>
                                        )}
                                        {isJoined && (
                                            <button
                                                className={styles.btnLeave}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleLeaveRoom(room.id);
                                                }}
                                            >
                                                Leave
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Connection status */}
                <div
                    className={`${styles.connectionStatus} ${wsConnected ? styles.connected : styles.disconnected
                        }`}
                    style={{ margin: "12px" }}
                >
                    <span className={styles.statusDot}></span>
                    {wsConnected ? "Connected" : isUsernameSet ? "Disconnected" : "Set username to connect"}
                </div>
            </aside>

            {/* Chat Area */}
            <main className={styles.chatArea}>
                {!activeRoomId ? (
                    <div className={styles.noRoom}>
                        <div className={styles.noRoomIcon}>💭</div>
                        <div className={styles.noRoomText}>
                            {isUsernameSet
                                ? "Select or create a room to start chatting"
                                : "Set your username to get started"}
                        </div>
                        <div className={styles.noRoomHint}>
                            {isUsernameSet
                                ? "Join a room from the sidebar"
                                : "Enter a name in the sidebar"}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className={styles.chatHeader}>
                            <div className={styles.chatRoomInfo}>
                                <span className={styles.chatRoomName}>
                                    # {activeRoom?.name}
                                </span>
                                <span className={styles.chatRoomUsers}>
                                    {activeRoom?.userCount} member
                                    {activeRoom?.userCount !== 1 ? "s" : ""}
                                </span>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className={styles.messages}>
                            {activeMessages.map((msg) =>
                                msg.type === "system" ? (
                                    <div key={msg.id} className={styles.systemMessage}>
                                        {msg.message}
                                    </div>
                                ) : (
                                    <div
                                        key={msg.id}
                                        className={`${styles.message} ${msg.userId === username
                                            ? styles.messageOwn
                                            : styles.messageOther
                                            }`}
                                    >
                                        {msg.userId !== username && (
                                            <div className={styles.messageSender}>{msg.userId}</div>
                                        )}
                                        <div className={styles.messageBubble}>{msg.message}</div>
                                        <div className={styles.messageTime}>
                                            {formatTime(msg.timestamp)}
                                        </div>
                                    </div>
                                )
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className={styles.messageInputArea}>
                            <div className={styles.messageInputWrapper}>
                                <input
                                    id="message-input"
                                    className={styles.messageInput}
                                    type="text"
                                    placeholder={`Message #${activeRoom?.name || "room"}...`}
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                                <button
                                    id="send-message-btn"
                                    className={styles.btnSend}
                                    onClick={handleSendMessage}
                                    disabled={!messageInput.trim() || !wsConnected}
                                >
                                    ➤
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
