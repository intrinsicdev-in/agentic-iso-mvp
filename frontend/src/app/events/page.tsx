'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

type EventType = 'NONCONFORMITY' | 'COMPLAINT' | 'RISK' | 'INCIDENT' | 'TRAINING' | 'AUDIT' | 'MANAGEMENT_REVIEW';
type EventStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'ESCALATED';

interface Event {
  id: string;
  type: EventType;
  title: string;
  description: string;
  severity: number;
  reportedBy: {
    id: string;
    name: string;
    email: string;
  };
  status: EventStatus;
  resolution?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

interface NewEventForm {
  type: EventType;
  title: string;
  description: string;
  severity: number;
  metadata: Record<string, any>;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [filterType, setFilterType] = useState<EventType | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<EventStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [newEvent, setNewEvent] = useState<NewEventForm>({
    type: 'INCIDENT',
    title: '',
    description: '',
    severity: 2,
    metadata: {}
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, filterType, filterStatus, searchTerm]);

  const fetchEvents = async () => {
    try {
      // For now, using mock data
      const mockEvents: Event[] = [
        {
          id: '1',
          type: 'NONCONFORMITY',
          title: 'Document version control issue',
          description: 'Quality manual was updated without proper version control procedures',
          severity: 3,
          reportedBy: { id: '1', name: 'John Doe', email: 'john@example.com' },
          status: 'OPEN',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '2',
          type: 'COMPLAINT',
          title: 'Customer complaint about delivery delay',
          description: 'Customer reported 3-day delay in product delivery',
          severity: 2,
          reportedBy: { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
          status: 'IN_PROGRESS',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '3',
          type: 'TRAINING',
          title: 'ISO 27001 Awareness Training Completed',
          description: 'All staff completed mandatory information security awareness training',
          severity: 1,
          reportedBy: { id: '3', name: 'HR Team', email: 'hr@example.com' },
          status: 'CLOSED',
          resolution: 'Training completed with 98% attendance',
          createdAt: new Date(Date.now() - 604800000).toISOString(),
          updatedAt: new Date(Date.now() - 345600000).toISOString(),
          closedAt: new Date(Date.now() - 345600000).toISOString()
        }
      ];
      
      setEvents(mockEvents);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];

    if (filterType !== 'ALL') {
      filtered = filtered.filter(e => e.type === filterType);
    }

    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(e => e.status === filterStatus);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(term) ||
        e.description.toLowerCase().includes(term)
      );
    }

    setFilteredEvents(filtered);
  };

  const handleCreateEvent = async () => {
    try {
      // API call would go here
      console.log('Creating event:', newEvent);
      
      // Mock creation
      const createdEvent: Event = {
        id: Date.now().toString(),
        ...newEvent,
        reportedBy: { id: 'user', name: 'Current User', email: 'user@example.com' },
        status: 'OPEN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setEvents([createdEvent, ...events]);
      setShowNewEventModal(false);
      setNewEvent({
        type: 'INCIDENT',
        title: '',
        description: '',
        severity: 2,
        metadata: {}
      });
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const getEventTypeIcon = (type: EventType) => {
    const icons: Record<EventType, string> = {
      NONCONFORMITY: '⚠️',
      COMPLAINT: '📢',
      RISK: '🎯',
      INCIDENT: '🚨',
      TRAINING: '📚',
      AUDIT: '🔍',
      MANAGEMENT_REVIEW: '📊'
    };
    return icons[type] || '📋';
  };

  const getEventTypeColor = (type: EventType) => {
    const colors: Record<EventType, string> = {
      NONCONFORMITY: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      COMPLAINT: 'bg-orange-100 text-orange-800 border-orange-200',
      RISK: 'bg-red-100 text-red-800 border-red-200',
      INCIDENT: 'bg-purple-100 text-purple-800 border-purple-200',
      TRAINING: 'bg-blue-100 text-blue-800 border-blue-200',
      AUDIT: 'bg-green-100 text-green-800 border-green-200',
      MANAGEMENT_REVIEW: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusColor = (status: EventStatus) => {
    const colors: Record<EventStatus, string> = {
      OPEN: 'bg-red-100 text-red-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      CLOSED: 'bg-green-100 text-green-800',
      ESCALATED: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 4) return 'text-red-600';
    if (severity >= 3) return 'text-orange-600';
    if (severity >= 2) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Business Events & Logs</h1>
              <p className="text-sm text-gray-600">Track incidents, complaints, training, and compliance events</p>
            </div>
            <button
              onClick={() => setShowNewEventModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center space-x-2"
            >
              <span>➕</span>
              <span>Log New Event</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search events..."
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as EventType | 'ALL')}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="ALL">All Types</option>
                <option value="NONCONFORMITY">Nonconformity</option>
                <option value="COMPLAINT">Complaint</option>
                <option value="RISK">Risk</option>
                <option value="INCIDENT">Incident</option>
                <option value="TRAINING">Training</option>
                <option value="AUDIT">Audit</option>
                <option value="MANAGEMENT_REVIEW">Management Review</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as EventStatus | 'ALL')}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="CLOSED">Closed</option>
                <option value="ESCALATED">Escalated</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Quick Stats</label>
              <div className="flex space-x-4 text-sm">
                <span>Total: {events.length}</span>
                <span className="text-red-600">Open: {events.filter(e => e.status === 'OPEN').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Events Timeline */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Event Timeline</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading events...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No events found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-2xl">{getEventTypeIcon(event.type)}</span>
                          <h3 className="font-medium text-lg">{event.title}</h3>
                          <span className={`px-2 py-1 text-xs rounded border ${getEventTypeColor(event.type)}`}>
                            {event.type.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded ${getStatusColor(event.status)}`}>
                            {event.status}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-2">{event.description}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Reported by: {event.reportedBy.name}</span>
                          <span className={getSeverityColor(event.severity)}>
                            Severity: {'⭐'.repeat(event.severity)}
                          </span>
                          <span>{format(new Date(event.createdAt), 'MMM d, yyyy HH:mm')}</span>
                        </div>
                        
                        {event.resolution && (
                          <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-800">
                            <strong>Resolution:</strong> {event.resolution}
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4">
                        <button className="text-blue-600 hover:text-blue-800">
                          View Details →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Event Modal */}
      {showNewEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Log New Event</h2>
              <button
                onClick={() => setShowNewEventModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Event Type</label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({...newEvent, type: e.target.value as EventType})}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="NONCONFORMITY">Nonconformity</option>
                  <option value="COMPLAINT">Complaint</option>
                  <option value="RISK">Risk</option>
                  <option value="INCIDENT">Incident</option>
                  <option value="TRAINING">Training</option>
                  <option value="AUDIT">Audit</option>
                  <option value="MANAGEMENT_REVIEW">Management Review</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Brief description of the event"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 h-32"
                  placeholder="Detailed description of the event..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Severity ({newEvent.severity}/5)
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={newEvent.severity}
                  onChange={(e) => setNewEvent({...newEvent, severity: parseInt(e.target.value)})}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                  <span>Critical</span>
                  <span>Emergency</span>
                </div>
              </div>
              
              {/* Type-specific fields would go here */}
              {newEvent.type === 'COMPLAINT' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Customer Name</label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Customer name"
                  />
                </div>
              )}
              
              {newEvent.type === 'TRAINING' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Number of Attendees</label>
                  <input
                    type="number"
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="0"
                  />
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
                  disabled={!newEvent.title || !newEvent.description}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
                >
                  Create Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Event Details</h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{getEventTypeIcon(selectedEvent.type)}</span>
                <div>
                  <h3 className="text-xl font-semibold">{selectedEvent.title}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 text-xs rounded border ${getEventTypeColor(selectedEvent.type)}`}>
                      {selectedEvent.type.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(selectedEvent.status)}`}>
                      {selectedEvent.status}
                    </span>
                    <span className={`text-sm ${getSeverityColor(selectedEvent.severity)}`}>
                      Severity: {'⭐'.repeat(selectedEvent.severity)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-gray-600">{selectedEvent.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Reported By</h4>
                  <p className="text-gray-600">{selectedEvent.reportedBy.name}</p>
                  <p className="text-sm text-gray-500">{selectedEvent.reportedBy.email}</p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Timeline</h4>
                  <p className="text-sm text-gray-600">
                    Created: {format(new Date(selectedEvent.createdAt), 'MMM d, yyyy HH:mm')}
                  </p>
                  <p className="text-sm text-gray-600">
                    Updated: {format(new Date(selectedEvent.updatedAt), 'MMM d, yyyy HH:mm')}
                  </p>
                  {selectedEvent.closedAt && (
                    <p className="text-sm text-gray-600">
                      Closed: {format(new Date(selectedEvent.closedAt), 'MMM d, yyyy HH:mm')}
                    </p>
                  )}
                </div>
              </div>
              
              {selectedEvent.resolution && (
                <div>
                  <h4 className="font-medium mb-2">Resolution</h4>
                  <div className="p-3 bg-green-50 rounded text-green-800">
                    {selectedEvent.resolution}
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="font-medium mb-2">AI Suggested Actions</h4>
                <div className="space-y-2">
                  <div className="p-3 bg-blue-50 rounded">
                    <p className="text-sm text-blue-800">
                      <strong>🤖 Suggestion:</strong> Update Quality Manual section 7.5.3 to include 
                      specific version control procedures
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded">
                    <p className="text-sm text-blue-800">
                      <strong>🤖 Suggestion:</strong> Schedule training session on document control 
                      for all department heads
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Export Details
                </button>
                {selectedEvent.status !== 'CLOSED' && (
                  <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
                    Mark as Resolved
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}