import { Task, TaskStatus } from '@prisma/client';
export interface CreateTaskDto {
    title: string;
    description?: string;
    dueDate?: Date;
    priority: number;
    assigneeId?: string;
    artefactId?: string;
}
export interface UpdateTaskDto {
    title?: string;
    description?: string;
    dueDate?: Date;
    priority?: number;
    status?: TaskStatus;
    assigneeId?: string;
    completedAt?: Date;
}
export interface TaskWithDetails extends Task {
    assignee?: {
        id: string;
        email: string;
        name: string;
    } | null;
    artefact?: {
        id: string;
        title: string;
        status: string;
    } | null;
}
export interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end?: Date;
    allDay: boolean;
    type: 'TASK' | 'DEADLINE' | 'MEETING' | 'AUDIT';
    status: string;
    priority: number;
    description?: string | null;
    assignee?: string;
}
export declare class TaskService {
    private prisma;
    constructor();
    createTask(data: CreateTaskDto, createdById: string): Promise<TaskWithDetails>;
    getAllTasks(filters?: {
        status?: TaskStatus;
        priority?: number;
        assigneeId?: string;
        startDate?: Date;
        endDate?: Date;
        artefactId?: string;
    }): Promise<TaskWithDetails[]>;
    getTaskById(id: string): Promise<TaskWithDetails | null>;
    updateTask(id: string, userId: string, data: UpdateTaskDto): Promise<TaskWithDetails>;
    deleteTask(id: string, userId: string): Promise<void>;
    getTaskStats(userId?: string): Promise<{
        total: number;
        byStatus: Record<string, number>;
        byPriority: Record<string, number>;
        overdue: number;
        dueToday: number;
        dueThisWeek: number;
        completionRate: number;
        averageTimeToComplete: number;
    }>;
    getCalendarEvents(startDate: Date, endDate: Date, userId?: string): Promise<CalendarEvent[]>;
    createRecurringTask(baseTask: CreateTaskDto, recurrence: {
        frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
        interval: number;
        endDate?: Date;
        count?: number;
    }, createdById: string): Promise<TaskWithDetails[]>;
    private createAuditLog;
}
