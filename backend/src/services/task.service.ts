import { PrismaClient, Task, TaskStatus } from '@prisma/client';

export interface CreateTaskDto {
  title: string;
  description?: string;
  dueDate?: Date;
  priority: number;
  assigneeId?: string;
  assigneeIds?: string[];
  artefactId?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  dueDate?: Date;
  priority?: number;
  status?: TaskStatus;
  assigneeId?: string;
  assigneeIds?: string[];
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

export class TaskService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createTask(data: CreateTaskDto, createdById: string): Promise<TaskWithDetails> {
    // Create task with multiple assignees if provided
    const taskData: any = {
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      priority: data.priority,
      assigneeId: data.assigneeId,
      artefactId: data.artefactId,
      createdById,
      status: 'PENDING'
    };

    // If multiple assignees are provided, create TaskAssignee records
    if (data.assigneeIds && data.assigneeIds.length > 0) {
      taskData.assignees = {
        create: data.assigneeIds.map(userId => ({
          userId
        }))
      };
      // Set the first assignee as the primary assignee for backward compatibility
      if (!data.assigneeId) {
        taskData.assigneeId = data.assigneeIds[0];
      }
    }

    const task = await this.prisma.task.create({
      data: taskData,
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        },
        artefact: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    });

    // Create audit log
    await this.createAuditLog('task.created', 'task', task.id, createdById, {
      title: data.title,
      priority: data.priority,
      dueDate: data.dueDate,
      assigneeIds: data.assigneeIds
    });

    return task;
  }

  async getAllTasks(filters?: {
    status?: TaskStatus;
    priority?: number;
    assigneeId?: string;
    startDate?: Date;
    endDate?: Date;
    artefactId?: string;
  }): Promise<TaskWithDetails[]> {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.priority) {
      where.priority = filters.priority;
    }

    if (filters?.assigneeId) {
      where.assigneeId = filters.assigneeId;
    }

    if (filters?.artefactId) {
      where.artefactId = filters.artefactId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.dueDate = {};
      if (filters.startDate) {
        where.dueDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.dueDate.lte = filters.endDate;
      }
    }

    return this.prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        },
        artefact: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    });
  }

  async getTaskById(id: string): Promise<TaskWithDetails | null> {
    return this.prisma.task.findUnique({
      where: { id },
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        artefact: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    });
  }

  async updateTask(id: string, userId: string, data: UpdateTaskDto): Promise<TaskWithDetails> {
    const updateData: any = {
      updatedAt: new Date()
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'COMPLETED') {
        updateData.completedAt = data.completedAt || new Date();
      }
    }
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;

    // Handle multiple assignees update
    if (data.assigneeIds !== undefined) {
      // First, delete existing assignees
      await this.prisma.taskAssignee.deleteMany({
        where: { taskId: id }
      });
      
      // Then create new assignees
      if (data.assigneeIds.length > 0) {
        updateData.assignees = {
          create: data.assigneeIds.map(userId => ({
            userId
          }))
        };
        // Set the first assignee as the primary assignee for backward compatibility
        if (!data.assigneeId && !updateData.assigneeId) {
          updateData.assigneeId = data.assigneeIds[0];
        }
      }
    }

    const task = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        },
        artefact: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    });

    // Create audit log
    await this.createAuditLog('task.updated', 'task', id, userId, {
      changes: data
    });

    return task;
  }

  async deleteTask(id: string, userId: string): Promise<void> {
    await this.prisma.task.delete({
      where: { id }
    });

    // Create audit log
    await this.createAuditLog('task.deleted', 'task', id, userId, {});
  }

  async getTaskStats(userId?: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    overdue: number;
    dueToday: number;
    dueThisWeek: number;
    completionRate: number;
    averageTimeToComplete: number;
  }> {
    const filters = userId ? { assigneeId: userId } : undefined;
    const tasks = await this.getAllTasks(filters);
    
    const total = tasks.length;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const byStatus = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPriority = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const overdue = tasks.filter(task => 
      task.dueDate && task.dueDate < now && task.status !== 'COMPLETED'
    ).length;

    const dueToday = tasks.filter(task => 
      task.dueDate && task.dueDate >= today && task.dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)
    ).length;

    const dueThisWeek = tasks.filter(task => 
      task.dueDate && task.dueDate >= today && task.dueDate < nextWeek
    ).length;

    const completedTasks = tasks.filter(task => task.status === 'COMPLETED');
    const completionRate = total > 0 ? (completedTasks.length / total) * 100 : 0;

    // Calculate average time to complete
    const tasksWithCompletionTime = completedTasks.filter(task => 
      task.completedAt && task.createdAt
    );
    const totalCompletionTime = tasksWithCompletionTime.reduce((acc, task) => {
      const time = task.completedAt!.getTime() - task.createdAt.getTime();
      return acc + time;
    }, 0);
    const averageTimeToComplete = tasksWithCompletionTime.length > 0 
      ? totalCompletionTime / tasksWithCompletionTime.length / (1000 * 60 * 60 * 24) // days
      : 0;

    return {
      total,
      byStatus,
      byPriority,
      overdue,
      dueToday,
      dueThisWeek,
      completionRate,
      averageTimeToComplete
    };
  }

  async getCalendarEvents(startDate: Date, endDate: Date, userId?: string): Promise<CalendarEvent[]> {
    const tasks = await this.getAllTasks({
      startDate,
      endDate,
      assigneeId: userId
    });

    return tasks.map(task => ({
      id: task.id,
      title: task.title,
      start: task.dueDate || task.createdAt,
      end: task.dueDate || undefined,
      allDay: true,
      type: 'TASK' as const,
      status: task.status,
      priority: task.priority,
      description: task.description || undefined,
      assignee: task.assignee?.name || task.assignee?.email || undefined,
      assignees: (task as any).assignees?.map((ta: any) => ({
        id: ta.user.id,
        name: ta.user.name,
        email: ta.user.email
      })) || []
    }));
  }

  async createRecurringTask(baseTask: CreateTaskDto, recurrence: {
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    interval: number;
    endDate?: Date;
    count?: number;
  }, createdById: string): Promise<TaskWithDetails[]> {
    const tasks: TaskWithDetails[] = [];
    let currentDate = baseTask.dueDate || new Date();
    let created = 0;

    while (
      (!recurrence.endDate || currentDate <= recurrence.endDate) &&
      (!recurrence.count || created < recurrence.count)
    ) {
      const task = await this.createTask({
        ...baseTask,
        dueDate: new Date(currentDate),
        title: `${baseTask.title} (${created + 1})`
      }, createdById);

      tasks.push(task);
      created++;

      // Calculate next occurrence
      switch (recurrence.frequency) {
        case 'DAILY':
          currentDate.setDate(currentDate.getDate() + recurrence.interval);
          break;
        case 'WEEKLY':
          currentDate.setDate(currentDate.getDate() + (7 * recurrence.interval));
          break;
        case 'MONTHLY':
          currentDate.setMonth(currentDate.getMonth() + recurrence.interval);
          break;
        case 'QUARTERLY':
          currentDate.setMonth(currentDate.getMonth() + (3 * recurrence.interval));
          break;
        case 'YEARLY':
          currentDate.setFullYear(currentDate.getFullYear() + recurrence.interval);
          break;
      }
    }

    return tasks;
  }

  private async createAuditLog(
    action: string,
    entityType: string,
    entityId: string,
    userId: string,
    details?: any
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        userId,
        details
      }
    });
  }
}