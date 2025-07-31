'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

type TaskType = 'AUDIT' | 'REVIEW' | 'TRAINING' | 'ASSESSMENT' | 'COMPLIANCE_CHECK' | 'DOCUMENT_REVIEW';
type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  date: string;
  time?: string;
  duration?: number; // in minutes
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  assignees?: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  relatedStandard?: string;
  clauseId?: string;
  priority: number;
  isRecurring?: boolean;
  recurrenceRule?: string;
}

interface CalendarStats {
  thisMonth: number;
  overdue: number;
  completed: number;
  upcoming: number;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month');
  const [filterType, setFilterType] = useState<TaskType | 'ALL'>('ALL');
  const [stats, setStats] = useState<CalendarStats | null>(null);
  const [users, setUsers] = useState<Array<{id: string, name: string, email: string}>>([]);

  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: '',
    description: '',
    type: 'COMPLIANCE_CHECK',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    duration: 60,
    priority: 2,
    assignees: []
  });

  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    fetchEvents();
    fetchUsers();
  }, [currentDate]);

  useEffect(() => {
    calculateStats();
  }, [events]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
      const response = await fetch(`${apiUrl}/api/organizations/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      // Get the month range
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      // Fetch calendar events from the API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
      const response = await fetch(
        `${apiUrl}/api/tasks/calendar?startDate=${monthStart.toISOString()}&endDate=${monthEnd.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch calendar events');
      }

      const data = await response.json();
      
      // Transform API response to calendar events
      const transformedEvents: CalendarEvent[] = data.map((event: any) => ({
        id: event.id,
        title: event.title,
        description: event.description || '',
        type: 'COMPLIANCE_CHECK', // Default type since task doesn't have type
        status: event.status,
        date: format(new Date(event.start), 'yyyy-MM-dd'),
        time: event.allDay ? undefined : format(new Date(event.start), 'HH:mm'),
        duration: 60, // Default duration
        assignee: event.assignee ? {
          id: event.assignee,
          name: event.assignee,
          email: event.assignee
        } : undefined,
        assignees: event.assignees || [],
        relatedStandard: undefined,
        clauseId: undefined,
        priority: event.priority,
        isRecurring: false,
        recurrenceRule: undefined
      }));
      
      setEvents(transformedEvents);
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
    }
  };

  const calculateStats = () => {
    const now = new Date();
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    const thisMonth = events.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate >= monthStart && eventDate <= monthEnd;
    }).length;
    
    const overdue = events.filter(e => 
      e.status === 'OVERDUE' || (new Date(e.date) < now && e.status !== 'COMPLETED')
    ).length;
    
    const completed = events.filter(e => e.status === 'COMPLETED').length;
    
    const upcoming = events.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate > now && e.status === 'PENDING';
    }).length;

    setStats({ thisMonth, overdue, completed, upcoming });
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent) return;
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
      const response = await fetch(`${apiUrl}/api/tasks/${editingEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editingEvent.title,
          description: editingEvent.description,
          dueDate: editingEvent.date,
          priority: editingEvent.priority,
          status: editingEvent.status,
          assigneeIds: editingEvent.assignees?.map(a => a.id) || []
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      // Update the events list
      setEvents(events.map(event => 
        event.id === editingEvent.id ? editingEvent : event
      ));
      
      // Close edit modal
      setIsEditingEvent(false);
      setEditingEvent(null);
      
      console.log('Updated event:', editingEvent);
    } catch (error) {
      console.error('Failed to update event:', error);
    }
  };

  const handleCreateEvent = async () => {
    try {
      // Validate required fields
      if (!newEvent.title || !newEvent.description || !newEvent.date) {
        console.error('Missing required fields');
        return;
      }

      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      // Prepare task data for API
      const taskData = {
        title: newEvent.title,
        description: newEvent.description,
        dueDate: newEvent.date,
        priority: newEvent.priority || 2,
        assigneeIds: newEvent.assignees?.map(a => a.id) || []
      };

      // Create recurring tasks if needed
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
      const endpoint = newEvent.isRecurring ? `${apiUrl}/api/tasks/recurring` : `${apiUrl}/api/tasks`;
      const body = newEvent.isRecurring ? {
        ...taskData,
        recurrence: {
          frequency: newEvent.recurrenceRule || 'MONTHLY',
          interval: 1
        }
      } : taskData;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      // Refresh events list
      await fetchEvents();
      
      // Reset form and close modal
      setNewEvent({
        title: '',
        description: '',
        type: 'COMPLIANCE_CHECK',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '09:00',
        duration: 60,
        priority: 2,
        assignees: []
      });
      setShowNewEventModal(false);
      
      console.log('Created new task successfully');
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const getTypeIcon = (type: TaskType) => {
    const icons: Record<TaskType, string> = {
      AUDIT: '🔍',
      REVIEW: '📊',
      TRAINING: '📚',
      ASSESSMENT: '📋',
      COMPLIANCE_CHECK: '✅',
      DOCUMENT_REVIEW: '📄'
    };
    return icons[type] || '📅';
  };

  const getTypeColor = (type: TaskType) => {
    const colors: Record<TaskType, string> = {
      AUDIT: 'bg-red-100 text-red-800',
      REVIEW: 'bg-blue-100 text-blue-800',
      TRAINING: 'bg-green-100 text-green-800',
      ASSESSMENT: 'bg-yellow-100 text-yellow-800',
      COMPLIANCE_CHECK: 'bg-purple-100 text-purple-800',
      DOCUMENT_REVIEW: 'bg-indigo-100 text-indigo-800'
    };
    return colors[type];
  };

  const getStatusColor = (status: TaskStatus) => {
    const colors: Record<TaskStatus, string> = {
      PENDING: 'border-l-gray-400',
      IN_PROGRESS: 'border-l-blue-500',
      COMPLETED: 'border-l-green-500',
      OVERDUE: 'border-l-red-500'
    };
    return colors[status];
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'text-red-600';
    if (priority >= 3) return 'text-orange-600';
    if (priority >= 2) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.date), date));
  };

  const getDaysInMonth = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  };

  const renderMonthView = () => {
    const days = getDaysInMonth();
    const today = new Date();

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="p-2 hover:bg-gray-100 rounded"
              >
                ←
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="p-2 hover:bg-gray-100 rounded"
              >
                →
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-gray-50 p-3 text-center font-medium text-sm">
                {day}
              </div>
            ))}
            
            {/* Calendar Days */}
            {days.map(day => {
              const dayEvents = getEventsForDate(day);
              const isToday = isSameDay(day, today);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              
              return (
                <div
                  key={day.toString()}
                  className={`bg-white p-2 min-h-[100px] cursor-pointer hover:bg-gray-50 ${
                    !isSameMonth(day, currentDate) ? 'text-gray-400' : ''
                  } ${isToday ? 'bg-blue-50' : ''} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => setSelectedDate(day)}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        className={`text-xs p-1 rounded border-l-2 ${getStatusColor(event.status)} bg-gray-50 truncate`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                        }}
                      >
                        <span className="mr-1">{getTypeIcon(event.type)}</span>
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderAgendaView = () => {
    const sortedEvents = [...events]
      .filter(e => filterType === 'ALL' || e.type === filterType)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6">Compliance Schedule</h2>
          
          <div className="space-y-4">
            {sortedEvents.map(event => (
              <div
                key={event.id}
                className={`border-l-4 ${getStatusColor(event.status)} bg-gray-50 p-4 rounded cursor-pointer hover:bg-gray-100`}
                onClick={() => setSelectedEvent(event)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-xl">{getTypeIcon(event.type)}</span>
                      <h3 className="font-medium">{event.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded ${getTypeColor(event.type)}`}>
                        {event.type.replace('_', ' ')}
                      </span>
                      <span className={getPriorityColor(event.priority)}>
                        {'⭐'.repeat(event.priority)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-2">{event.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>📅 {format(new Date(event.date), 'MMM d, yyyy')}</span>
                      {event.time && <span>🕒 {event.time}</span>}
                      {event.duration && (
                        <span>⏱️ {Math.floor(event.duration / 60)}h {event.duration % 60}m</span>
                      )}
                      {event.assignees && event.assignees.length > 0 && (
                        <span>👥 {event.assignees.map(a => a.name).join(', ')}</span>
                      )}
                      {event.assignee && !event.assignees && <span>👤 {event.assignee.name}</span>}
                      {event.relatedStandard && (
                        <span>📋 {event.relatedStandard.replace('_', ' ')}</span>
                      )}
                      {event.clauseId && <span>🔗 Clause {event.clauseId}</span>}
                    </div>
                    
                    {event.isRecurring && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          🔄 Recurring ({event.recurrenceRule})
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4">
                    <span className={`px-2 py-1 text-xs rounded ${
                      event.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      event.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                      event.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Compliance Calendar</h1>
              <p className="text-sm text-gray-600">Schedule and track compliance activities</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                {(['month', 'agenda'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-2 rounded text-sm font-medium ${
                      viewMode === mode 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowNewEventModal(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                ➕ Schedule Task
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{stats?.thisMonth || 0}</div>
            <div className="text-sm text-gray-600">This Month</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600">{stats?.overdue || 0}</div>
            <div className="text-sm text-gray-600">Overdue</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{stats?.completed || 0}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600">{stats?.upcoming || 0}</div>
            <div className="text-sm text-gray-600">Upcoming</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {viewMode === 'agenda' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium">Filter by type:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as TaskType | 'ALL')}
                className="border rounded-lg px-3 py-2"
              >
                <option value="ALL">All Types</option>
                <option value="AUDIT">Audits</option>
                <option value="REVIEW">Reviews</option>
                <option value="TRAINING">Training</option>
                <option value="ASSESSMENT">Assessments</option>
                <option value="COMPLIANCE_CHECK">Compliance Checks</option>
                <option value="DOCUMENT_REVIEW">Document Reviews</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {viewMode === 'month' ? renderMonthView() : renderAgendaView()}
      </div>

      {/* Create New Event Modal */}
      {showNewEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Schedule New Task</h2>
              <button
                onClick={() => setShowNewEventModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Task Type</label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({...newEvent, type: e.target.value as TaskType})}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="COMPLIANCE_CHECK">Compliance Check</option>
                  <option value="AUDIT">Audit</option>
                  <option value="REVIEW">Review</option>
                  <option value="TRAINING">Training</option>
                  <option value="ASSESSMENT">Assessment</option>
                  <option value="DOCUMENT_REVIEW">Document Review</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Task title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 h-32"
                  placeholder="Detailed description of the task..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Time</label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    value={newEvent.duration}
                    onChange={(e) => setNewEvent({...newEvent, duration: parseInt(e.target.value) || 60})}
                    className="w-full border rounded-lg px-3 py-2"
                    min="15"
                    step="15"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <select
                    value={newEvent.priority}
                    onChange={(e) => setNewEvent({...newEvent, priority: parseInt(e.target.value)})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value={1}>Low</option>
                    <option value={2}>Medium</option>
                    <option value={3}>High</option>
                    <option value={4}>Critical</option>
                    <option value={5}>Emergency</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Assignees (Optional)</label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                  {users.length === 0 ? (
                    <p className="text-sm text-gray-500">No users available</p>
                  ) : (
                    users.map(user => (
                      <label key={user.id} className="flex items-center space-x-2 py-1 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newEvent.assignees?.some(a => a.id === user.id) || false}
                          onChange={(e) => {
                            const assignees = newEvent.assignees || [];
                            if (e.target.checked) {
                              setNewEvent({
                                ...newEvent,
                                assignees: [...assignees, {
                                  id: user.id,
                                  name: user.name,
                                  email: user.email
                                }]
                              });
                            } else {
                              setNewEvent({
                                ...newEvent,
                                assignees: assignees.filter(a => a.id !== user.id)
                              });
                            }
                          }}
                          className="rounded text-blue-600"
                        />
                        <span className="text-sm">{user.name} ({user.email})</span>
                      </label>
                    ))
                  )}
                </div>
                {newEvent.assignees && newEvent.assignees.length > 0 && (
                  <p className="text-xs text-gray-600 mt-1">
                    {newEvent.assignees.length} user{newEvent.assignees.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Related Standard</label>
                <select
                  value={newEvent.relatedStandard || ''}
                  onChange={(e) => setNewEvent({...newEvent, relatedStandard: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Select Standard</option>
                  <option value="ISO_9001_2015">ISO 9001:2015</option>
                  <option value="ISO_27001_2022">ISO 27001:2022</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Clause ID (optional)</label>
                <input
                  type="text"
                  value={newEvent.clauseId || ''}
                  onChange={(e) => setNewEvent({...newEvent, clauseId: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g., 4.1, 6.1.2"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={newEvent.isRecurring || false}
                  onChange={(e) => setNewEvent({...newEvent, isRecurring: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="isRecurring" className="text-sm font-medium">Recurring Task</label>
              </div>
              
              {newEvent.isRecurring && (
                <div>
                  <label className="block text-sm font-medium mb-2">Recurrence</label>
                  <select
                    value={newEvent.recurrenceRule || ''}
                    onChange={(e) => setNewEvent({...newEvent, recurrenceRule: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
              )}
              
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowNewEventModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateEvent}
                  disabled={!newEvent.title || !newEvent.description || !newEvent.date}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
                >
                  Schedule Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Event Details</h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{getTypeIcon(selectedEvent.type)}</span>
                <div>
                  <h3 className="text-xl font-semibold">{selectedEvent.title}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 text-xs rounded ${getTypeColor(selectedEvent.type)}`}>
                      {selectedEvent.type.replace('_', ' ')}
                    </span>
                    <span className={getPriorityColor(selectedEvent.priority)}>
                      Priority: {'⭐'.repeat(selectedEvent.priority)}
                    </span>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600">{selectedEvent.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Date:</span> {format(new Date(selectedEvent.date), 'MMM d, yyyy')}
                </div>
                {selectedEvent.time && (
                  <div>
                    <span className="font-medium">Time:</span> {selectedEvent.time}
                  </div>
                )}
                {selectedEvent.duration && (
                  <div>
                    <span className="font-medium">Duration:</span> {Math.floor(selectedEvent.duration / 60)}h {selectedEvent.duration % 60}m
                  </div>
                )}
                {(selectedEvent.assignees && selectedEvent.assignees.length > 0) && (
                  <div>
                    <span className="font-medium">Assignees:</span> {selectedEvent.assignees.map(a => a.name).join(', ')}
                  </div>
                )}
                {selectedEvent.assignee && !selectedEvent.assignees && (
                  <div>
                    <span className="font-medium">Assignee:</span> {selectedEvent.assignee.name}
                  </div>
                )}
                {selectedEvent.relatedStandard && (
                  <div>
                    <span className="font-medium">Standard:</span> {selectedEvent.relatedStandard.replace('_', ' ')}
                  </div>
                )}
                {selectedEvent.clauseId && (
                  <div>
                    <span className="font-medium">Clause:</span> {selectedEvent.clauseId}
                  </div>
                )}
              </div>
              
              {selectedEvent.isRecurring && (
                <div className="p-3 bg-blue-50 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>🔄 Recurring Event:</strong> This event repeats {selectedEvent.recurrenceRule?.toLowerCase()}
                  </p>
                </div>
              )}
              
              <div className="flex justify-end space-x-4 mt-6">
                <button 
                  onClick={() => {
                    setEditingEvent(selectedEvent);
                    setIsEditingEvent(true);
                    setSelectedEvent(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Edit Event
                </button>
                {selectedEvent.status !== 'COMPLETED' && (
                  <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
                    Mark Complete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {isEditingEvent && editingEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Edit Task</h2>
              <button
                onClick={() => {
                  setIsEditingEvent(false);
                  setEditingEvent(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Task Type</label>
                <select
                  value={editingEvent.type}
                  onChange={(e) => setEditingEvent({...editingEvent, type: e.target.value as TaskType})}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="COMPLIANCE_CHECK">Compliance Check</option>
                  <option value="AUDIT">Audit</option>
                  <option value="REVIEW">Review</option>
                  <option value="TRAINING">Training</option>
                  <option value="ASSESSMENT">Assessment</option>
                  <option value="DOCUMENT_REVIEW">Document Review</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent({...editingEvent, title: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Task title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={editingEvent.description}
                  onChange={(e) => setEditingEvent({...editingEvent, description: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 h-32"
                  placeholder="Detailed description of the task..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date</label>
                  <input
                    type="date"
                    value={editingEvent.date}
                    onChange={(e) => setEditingEvent({...editingEvent, date: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Time</label>
                  <input
                    type="time"
                    value={editingEvent.time || ''}
                    onChange={(e) => setEditingEvent({...editingEvent, time: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    value={editingEvent.duration || 60}
                    onChange={(e) => setEditingEvent({...editingEvent, duration: parseInt(e.target.value) || 60})}
                    className="w-full border rounded-lg px-3 py-2"
                    min="15"
                    step="15"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <select
                    value={editingEvent.priority}
                    onChange={(e) => setEditingEvent({...editingEvent, priority: parseInt(e.target.value)})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value={1}>Low</option>
                    <option value={2}>Medium</option>
                    <option value={3}>High</option>
                    <option value={4}>Critical</option>
                    <option value={5}>Emergency</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={editingEvent.status}
                    onChange={(e) => setEditingEvent({...editingEvent, status: e.target.value as TaskStatus})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="OVERDUE">Overdue</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Assignees (Optional)</label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                  {users.length === 0 ? (
                    <p className="text-sm text-gray-500">No users available</p>
                  ) : (
                    users.map(user => (
                      <label key={user.id} className="flex items-center space-x-2 py-1 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingEvent.assignees?.some(a => a.id === user.id) || false}
                          onChange={(e) => {
                            const assignees = editingEvent.assignees || [];
                            if (e.target.checked) {
                              setEditingEvent({
                                ...editingEvent,
                                assignees: [...assignees, {
                                  id: user.id,
                                  name: user.name,
                                  email: user.email
                                }]
                              });
                            } else {
                              setEditingEvent({
                                ...editingEvent,
                                assignees: assignees.filter(a => a.id !== user.id)
                              });
                            }
                          }}
                          className="rounded text-blue-600"
                        />
                        <span className="text-sm">{user.name} ({user.email})</span>
                      </label>
                    ))
                  )}
                </div>
                {editingEvent.assignees && editingEvent.assignees.length > 0 && (
                  <p className="text-xs text-gray-600 mt-1">
                    {editingEvent.assignees.length} user{editingEvent.assignees.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Related Standard</label>
                <select
                  value={editingEvent.relatedStandard || ''}
                  onChange={(e) => setEditingEvent({...editingEvent, relatedStandard: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Select Standard</option>
                  <option value="ISO_9001_2015">ISO 9001:2015</option>
                  <option value="ISO_27001_2022">ISO 27001:2022</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Clause ID (optional)</label>
                <input
                  type="text"
                  value={editingEvent.clauseId || ''}
                  onChange={(e) => setEditingEvent({...editingEvent, clauseId: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g., 4.1, 6.1.2"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editIsRecurring"
                  checked={editingEvent.isRecurring || false}
                  onChange={(e) => setEditingEvent({...editingEvent, isRecurring: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="editIsRecurring" className="text-sm font-medium">Recurring Task</label>
              </div>
              
              {editingEvent.isRecurring && (
                <div>
                  <label className="block text-sm font-medium mb-2">Recurrence</label>
                  <select
                    value={editingEvent.recurrenceRule || ''}
                    onChange={(e) => setEditingEvent({...editingEvent, recurrenceRule: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
              )}
              
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setIsEditingEvent(false);
                    setEditingEvent(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateEvent}
                  disabled={!editingEvent.title || !editingEvent.description || !editingEvent.date}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
                >
                  Update Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}