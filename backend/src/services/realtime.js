"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealTimeService = void 0;
const socket_io_1 = require("socket.io");
class RealTimeService {
    constructor() {
        this.io = null;
        this.userSockets = new Map();
    }
    static getInstance() {
        if (!RealTimeService.instance) {
            RealTimeService.instance = new RealTimeService();
        }
        return RealTimeService.instance;
    }
    initialize(server) {
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:3000",
                methods: ["GET", "POST"]
            }
        });
        this.io.on('connection', (socket) => {
            console.log(`🔌 Client connected: ${socket.id}`);
            // Handle user authentication
            socket.on('authenticate', (userId) => {
                this.authenticateUser(socket, userId);
            });
            // Handle user joining specific rooms
            socket.on('join_room', (room) => {
                socket.join(room);
                console.log(`👥 User joined room: ${room}`);
            });
            // Handle user leaving rooms
            socket.on('leave_room', (room) => {
                socket.leave(room);
                console.log(`👋 User left room: ${room}`);
            });
            // Handle disconnection
            socket.on('disconnect', () => {
                this.handleDisconnect(socket);
            });
        });
        console.log('✅ Real-time service initialized');
    }
    authenticateUser(socket, userId) {
        // Store user's socket connections
        if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, []);
        }
        this.userSockets.get(userId).push(socket.id);
        // Join user-specific room
        socket.join(`user_${userId}`);
        console.log(`🔐 User ${userId} authenticated on socket ${socket.id}`);
    }
    handleDisconnect(socket) {
        // Remove socket from user's connections
        for (const [userId, socketIds] of this.userSockets.entries()) {
            const index = socketIds.indexOf(socket.id);
            if (index > -1) {
                socketIds.splice(index, 1);
                if (socketIds.length === 0) {
                    this.userSockets.delete(userId);
                }
                break;
            }
        }
        console.log(`🔌 Client disconnected: ${socket.id}`);
    }
    emitToUser(userId, event, data) {
        if (this.io) {
            this.io.to(`user_${userId}`).emit(event, data);
        }
    }
    emitToRoom(room, event, data) {
        if (this.io) {
            this.io.to(room).emit(event, data);
        }
    }
    emitToAll(event, data) {
        if (this.io) {
            this.io.emit(event, data);
        }
    }
    sendNotification(userId, notification) {
        this.emitToUser(userId, 'notification', notification);
    }
    sendRealTimeEvent(event) {
        if (event.userId) {
            // Send to specific user
            this.emitToUser(event.userId, 'realtime_event', event);
        }
        else {
            // Send to all connected clients
            this.emitToAll('realtime_event', event);
        }
    }
    broadcastArtefactUpdate(artefact, userId) {
        const event = {
            type: 'artefact_updated',
            data: artefact,
            userId
        };
        this.sendRealTimeEvent(event);
    }
    broadcastRiskIdentified(risk, userId) {
        const event = {
            type: 'risk_identified',
            data: risk,
            userId
        };
        this.sendRealTimeEvent(event);
    }
    broadcastAISuggestion(suggestion, userId) {
        const event = {
            type: 'ai_suggestion',
            data: suggestion,
            userId
        };
        this.sendRealTimeEvent(event);
    }
    broadcastDeadlineApproaching(deadline, userId) {
        const event = {
            type: 'deadline_approaching',
            data: deadline,
            userId
        };
        this.sendRealTimeEvent(event);
    }
    getConnectedUsers() {
        return this.userSockets.size;
    }
    getUserConnections(userId) {
        return this.userSockets.get(userId) || [];
    }
}
exports.RealTimeService = RealTimeService;
exports.default = RealTimeService.getInstance();
