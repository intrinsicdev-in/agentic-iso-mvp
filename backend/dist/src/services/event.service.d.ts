import { Event, EventType } from '@prisma/client';
export interface CreateEventDto {
    type: EventType;
    title: string;
    description: string;
    severity: number;
    reportedById: string;
    metadata?: any;
}
export interface UpdateEventDto {
    status?: string;
    resolution?: string;
    metadata?: any;
}
export interface EventWithReporter extends Event {
    reportedBy: {
        id: string;
        name: string;
        email: string;
    };
}
export declare class EventService {
    private prisma;
    constructor();
    createEvent(data: CreateEventDto): Promise<EventWithReporter>;
    getAllEvents(filters?: {
        type?: EventType;
        status?: string;
        reportedById?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<EventWithReporter[]>;
    getEventById(id: string): Promise<EventWithReporter | null>;
    updateEvent(id: string, userId: string, data: UpdateEventDto): Promise<EventWithReporter>;
    deleteEvent(id: string, userId: string): Promise<void>;
    getEventStats(): Promise<{
        total: number;
        byType: Record<EventType, number>;
        byStatus: Record<string, number>;
        recentActivity: EventWithReporter[];
    }>;
    private generateAISuggestions;
    private createAuditLog;
}
