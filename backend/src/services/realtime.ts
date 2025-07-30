import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  userId?: number;
  read: boolean;
}

export interface RealTimeEvent {
  type: 'artefact_updated' | 'risk_identified' | 'audit_scheduled' | 'ai_suggestion' | 'deadline_approaching';
  data: any;
  userId?: number;
}

export class RealTimeService {
  private static instance: RealTimeService;
  private io: SocketIOServer | null = null;
  private userSockets: Map<number, string[]> = new Map();

  private constructor() {}

  public static getInstance(): RealTimeService {
    if (!RealTimeService.instance) {
      RealTimeService.instance = new RealTimeService();
    }
    return RealTimeService.instance;
  }

  public initialize(server: HTTPServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // Handle user authentication
      socket.on('authenticate', (userId: number) => {
        this.authenticateUser(socket, userId);
      });

      // Handle user joining specific rooms
      socket.on('join_room', (room: string) => {
        socket.join(room);
        console.log(`👥 User joined room: ${room}`);
      });

      // Handle user leaving rooms
      socket.on('leave_room', (room: string) => {
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

  private authenticateUser(socket: any, userId: number): void {
    // Store user's socket connections
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, []);
    }
    this.userSockets.get(userId)!.push(socket.id);

    // Join user-specific room
    socket.join(`user_${userId}`);
    
    console.log(`🔐 User ${userId} authenticated on socket ${socket.id}`);
  }

  private handleDisconnect(socket: any): void {
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

  public emitToUser(userId: number, event: string, data: any): void {
    if (this.io) {
      this.io.to(`user_${userId}`).emit(event, data);
    }
  }

  public emitToRoom(room: string, event: string, data: any): void {
    if (this.io) {
      this.io.to(room).emit(event, data);
    }
  }

  public emitToAll(event: string, data: any): void {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  public sendNotification(userId: number, notification: Notification): void {
    this.emitToUser(userId, 'notification', notification);
  }

  public sendRealTimeEvent(event: RealTimeEvent): void {
    if (event.userId) {
      // Send to specific user
      this.emitToUser(event.userId, 'realtime_event', event);
    } else {
      // Send to all connected clients
      this.emitToAll('realtime_event', event);
    }
  }

  public broadcastArtefactUpdate(artefact: any, userId?: number): void {
    const event: RealTimeEvent = {
      type: 'artefact_updated',
      data: artefact,
      userId
    };
    this.sendRealTimeEvent(event);
  }

  public broadcastRiskIdentified(risk: any, userId?: number): void {
    const event: RealTimeEvent = {
      type: 'risk_identified',
      data: risk,
      userId
    };
    this.sendRealTimeEvent(event);
  }

  public broadcastAISuggestion(suggestion: any, userId?: number): void {
    const event: RealTimeEvent = {
      type: 'ai_suggestion',
      data: suggestion,
      userId
    };
    this.sendRealTimeEvent(event);
  }

  public broadcastDeadlineApproaching(deadline: any, userId?: number): void {
    const event: RealTimeEvent = {
      type: 'deadline_approaching',
      data: deadline,
      userId
    };
    this.sendRealTimeEvent(event);
  }

  public getConnectedUsers(): number {
    return this.userSockets.size;
  }

  public getUserConnections(userId: number): string[] {
    return this.userSockets.get(userId) || [];
  }
}

export default RealTimeService.getInstance(); 