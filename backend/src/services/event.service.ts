import { PrismaClient, Event, EventType, User } from '@prisma/client';

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

export class EventService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createEvent(data: CreateEventDto): Promise<EventWithReporter> {
    const event = await this.prisma.event.create({
      data: {
        type: data.type,
        title: data.title,
        description: data.description,
        severity: data.severity,
        reportedById: data.reportedById,
        metadata: data.metadata || {},
        status: 'OPEN'
      },
      include: {
        reportedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Create audit log
    await this.createAuditLog('event.created', 'event', event.id, data.reportedById, {
      type: data.type,
      title: data.title,
      severity: data.severity
    });

    // Generate AI suggestions for the event
    await this.generateAISuggestions(event);

    return event;
  }

  async getAllEvents(filters?: {
    type?: EventType;
    status?: string;
    reportedById?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<EventWithReporter[]> {
    const where: any = {};

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.reportedById) {
      where.reportedById = filters.reportedById;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return this.prisma.event.findMany({
      where,
      include: {
        reportedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async getEventById(id: string): Promise<EventWithReporter | null> {
    return this.prisma.event.findUnique({
      where: { id },
      include: {
        reportedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  async updateEvent(id: string, userId: string, data: UpdateEventDto): Promise<EventWithReporter> {
    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: {
        status: data.status,
        resolution: data.resolution,
        metadata: data.metadata,
        updatedAt: new Date(),
        closedAt: data.status === 'CLOSED' ? new Date() : undefined
      },
      include: {
        reportedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Create audit log
    await this.createAuditLog('event.updated', 'event', id, userId, {
      changes: data
    });

    return updatedEvent;
  }

  async deleteEvent(id: string, userId: string): Promise<void> {
    await this.prisma.event.delete({
      where: { id }
    });

    // Create audit log
    await this.createAuditLog('event.deleted', 'event', id, userId, {});
  }

  async getEventStats(): Promise<{
    total: number;
    byType: Record<EventType, number>;
    byStatus: Record<string, number>;
    recentActivity: EventWithReporter[];
  }> {
    const events = await this.getAllEvents();
    
    const total = events.length;
    
    const byType = events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<EventType, number>);

    const byStatus = events.reduce((acc, event) => {
      acc[event.status] = (acc[event.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentActivity = events.slice(0, 10);

    return {
      total,
      byType,
      byStatus,
      recentActivity
    };
  }

  private async generateAISuggestions(event: Event): Promise<void> {
    try {
      // Get the document reviewer agent
      const agent = await this.prisma.aIAgent.findFirst({
        where: { type: 'COMPLIANCE_CHECKER' }
      });

      if (!agent) return;

      let suggestions: { title: string; content: string; rationale: string }[] = [];

      // Generate context-aware suggestions based on event type
      switch (event.type) {
        case 'NONCONFORMITY':
          suggestions = [
            {
              title: 'Update Quality Manual Section 8.7',
              content: 'Review and update nonconformity and corrective action procedures to prevent recurrence.',
              rationale: 'ISO 9001:2015 Clause 8.7 requires documented procedures for controlling nonconforming outputs and implementing corrective actions.'
            },
            {
              title: 'Schedule Root Cause Analysis',
              content: 'Conduct systematic root cause analysis to identify underlying causes of this nonconformity.',
              rationale: 'Effective corrective action requires understanding root causes rather than just symptoms.'
            }
          ];
          break;

        case 'COMPLAINT':
          suggestions = [
            {
              title: 'Review Customer Communication Process',
              content: 'Evaluate customer feedback handling procedures and response times.',
              rationale: 'ISO 9001:2015 Clause 9.1.2 requires monitoring customer satisfaction and feedback handling.'
            },
            {
              title: 'Update Customer Service Training',
              content: 'Schedule additional training for customer-facing staff on complaint resolution.',
              rationale: 'Improved customer service skills can prevent similar complaints and enhance satisfaction.'
            }
          ];
          break;

        case 'INCIDENT':
          suggestions = [
            {
              title: 'Incident Response Plan Review',
              content: 'Review and update incident response procedures based on lessons learned.',
              rationale: 'ISO 27001:2022 Clause A.16.1 requires documented incident management procedures.'
            },
            {
              title: 'Security Awareness Training',
              content: 'Schedule additional security awareness training for affected departments.',
              rationale: 'Human factors are often involved in security incidents and can be addressed through training.'
            }
          ];
          break;

        case 'RISK':
          suggestions = [
            {
              title: 'Update Risk Register',
              content: 'Add this risk to the organizational risk register and define treatment options.',
              rationale: 'ISO 31000 and ISO 27001:2022 Clause 6.1.2 require systematic risk identification and treatment.'
            },
            {
              title: 'Risk Assessment Review',
              content: 'Conduct detailed risk assessment to quantify likelihood and impact.',
              rationale: 'Proper risk quantification enables appropriate resource allocation for treatment.'
            }
          ];
          break;

        default:
          suggestions = [
            {
              title: 'Document Review',
              content: 'Review related documentation to ensure current procedures address this event type.',
              rationale: 'Regular document review ensures procedures remain current and effective.'
            }
          ];
      }

      // Create AI suggestions
      for (const suggestion of suggestions) {
        await this.prisma.aISuggestion.create({
          data: {
            agentId: agent.id,
            type: 'compliance_gap',
            title: suggestion.title,
            content: suggestion.content,
            rationale: suggestion.rationale,
            status: 'PENDING',
            metadata: {
              eventId: event.id,
              eventType: event.type,
              severity: event.severity,
              confidence: 0.85
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to generate AI suggestions for event:', error);
    }
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