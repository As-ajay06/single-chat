import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import 'dotenv/config';
const app = express();
const PORT = 3001 || process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json());

// Types
interface Room {
    id: string;
    name: string;
    users: string[];
    createdAt: Date;
}

console.log(process.env.base_url);
// In-memory store
const rooms = new Map<string, Room>();

// --- Routes ---

// GET /api/rooms — List all rooms
app.get("/api/rooms", (_req, res) => {
    const allRooms = Array.from(rooms.values()).map((room) => ({
        id: room.id,
        name: room.name,
        userCount: room.users.length,
        users: room.users,
        createdAt: room.createdAt,
    }));
    res.json({ rooms: allRooms });
});

// POST /api/rooms — Create a room
app.post("/api/rooms", (req, res) => {
    const { name } = req.body;

    if (!name || typeof name !== "string") {
        res.status(400).json({ error: "Room name is required" });
        return;
    }

    const id = uuidv4();
    const room: Room = {
        id,
        name: name.trim(),
        users: [],
        createdAt: new Date(),
    };

    rooms.set(id, room);
    res.status(201).json({ room });
});

// POST /api/rooms/:roomId/join — Join a room
app.post("/api/rooms/:roomId/join", (req, res) => {
    const { roomId } = req.params;
    const { userId } = req.body;

    if (!userId || typeof userId !== "string") {
        res.status(400).json({ error: "userId is required" });
        return;
    }

    const room = rooms.get(roomId);
    if (!room) {
        res.status(404).json({ error: "Room not found" });
        return;
    }

    if (room.users.includes(userId)) {
        res.json({ message: "Already in room", room });
        return;
    }

    room.users.push(userId);
    res.json({ message: `User ${userId} joined room ${room.name}`, room });
});

// POST /api/rooms/:roomId/leave — Leave a room
app.post("/api/rooms/:roomId/leave", (req, res) => {
    const { roomId } = req.params;
    const { userId } = req.body;

    if (!userId || typeof userId !== "string") {
        res.status(400).json({ error: "userId is required" });
        return;
    }

    const room = rooms.get(roomId);
    if (!room) {
        res.status(404).json({ error: "Room not found" });
        return;
    }

    room.users = room.users.filter((u) => u !== userId);
    res.json({ message: `User ${userId} left room ${room.name}`, room });
});

// Start server
app.listen(PORT, () => {
    console.log(`HTTP server running on http://localhost:${PORT}`);
});
