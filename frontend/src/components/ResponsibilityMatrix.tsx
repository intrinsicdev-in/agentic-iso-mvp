'use client';

import React, { useState, useEffect } from 'react';
import { Users, Bot, Filter, Search, RefreshCw, UserCheck, AlertCircle } from 'lucide-react';
import { safeJsonParse } from '../utils/api';

interface AssignmentData {
  id: string;
  type: 'CLAUSE' | 'ARTEFACT';
  entity: {
    id: string;
    name: string;
    clauseNumber?: string;
    standard?: string;
    status?: string;
  };
  assignee: {
    id: string;
    name: string;
    type: 'USER' | 'AI_AGENT';
    email?: string;
    role?: string;
    agentType?: string;
  } | null;
}

interface ResponsibilityMatrixFilters {
  entityType: 'ALL' | 'CLAUSE' | 'ARTEFACT';
  assigneeType: 'ALL' | 'USER' | 'AI_AGENT';
  standard: string;
  role: string;
  search: string;
}

export default function ResponsibilityMatrix() {
  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [filters, setFilters] = useState<ResponsibilityMatrixFilters>({
    entityType: 'ALL',
    assigneeType: 'ALL',
    standard: '',
    role: '',
    search: ''
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build filter query params
      const filterParams = new URLSearchParams();
      if (filters.entityType !== 'ALL') filterParams.append('entityType', filters.entityType);
      if (filters.assigneeType !== 'ALL') filterParams.append('assigneeType', filters.assigneeType);
      if (filters.standard) filterParams.append('isoStandard', filters.standard);
      if (filters.role) filterParams.append('role', filters.role);

      // Load data using responsibility matrix API
      const [assignmentsRes, assigneesRes] = await Promise.all([
        fetch(`/api/responsibility-matrix?${filterParams.toString()}`),
        fetch('/api/responsibility-matrix/assignees')
      ]);

      if (!assignmentsRes.ok || !assigneesRes.ok) {
        throw new Error('Failed to fetch responsibility matrix data');
      }

      const [assignmentsData, assigneesData] = await Promise.all([
        safeJsonParse(assignmentsRes),
        safeJsonParse(assigneesRes)
      ]);

      // Transform assignments to match component interface
      const transformedAssignments: AssignmentData[] = assignmentsData.map((assignment: any) => ({
        id: assignment.id,
        type: assignment.type,
        entity: {
          id: assignment.entityId,
          name: assignment.entityName,
          clauseNumber: assignment.entityDetails?.clauseNumber,
          standard: assignment.entityDetails?.standard,
          status: assignment.entityDetails?.status || assignment.entityDetails?.artefactStatus
        },
        assignee: assignment.assigneeId ? {
          id: assignment.assigneeId,
          name: assignment.assigneeName,
          type: assignment.assigneeType,
          email: assignment.assigneeDetails?.email,
          role: assignment.assigneeDetails?.role,
          agentType: assignment.assigneeDetails?.agentType
        } : null
      }));

      // Apply search filter locally (since API doesn't support text search yet)
      const filteredAssignments = transformedAssignments.filter((assignment) => {
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          const entityName = assignment.entity.name.toLowerCase();
          const clauseNumber = (assignment.entity.clauseNumber || '').toLowerCase();
          if (!entityName.includes(searchTerm) && !clauseNumber.includes(searchTerm)) {
            return false;
          }
        }
        return true;
      });
      
      setAssignments(filteredAssignments);
      setUsers(assigneesData.users || []);
      setAgents(assigneesData.agents || []);
    } catch (err) {
      setError('Failed to load responsibility matrix data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };


  const handleCellClick = (assignmentId: string) => {
    setSelectedCell(selectedCell === assignmentId ? null : assignmentId);
  };

  const handleAssignment = async (assignmentId: string, assigneeId: string, assigneeType: 'USER' | 'AI_AGENT') => {
    try {
      const assignment = assignments.find(a => a.id === assignmentId);
      if (!assignment) return;

      // Use responsibility matrix API for all assignments
      const response = await fetch('/api/responsibility-matrix/assign', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: assignment.type,
          entityId: assignment.entity.id,
          assigneeId: assigneeId,
          assigneeType: assigneeType
        })
      });

      if (response.ok) {
        const result = await safeJsonParse(response);
        
        // Find assignee details from users/agents lists
        let assigneeDetails;
        if (assigneeType === 'USER') {
          assigneeDetails = users.find(u => u.id === assigneeId);
        } else {
          assigneeDetails = agents.find(a => a.id === assigneeId);
        }

        // Update local state
        setAssignments(prev => prev.map(a => 
          a.id === assignmentId 
            ? {
                ...a,
                assignee: {
                  id: assigneeId,
                  name: assigneeDetails?.name || 'Unknown',
                  type: assigneeType,
                  email: assigneeDetails?.email,
                  role: assigneeDetails?.role,
                  agentType: assigneeDetails?.type
                }
              }
            : a
        ));
        setSelectedCell(null);
      } else {
        const error = await safeJsonParse(response);
        console.error('Assignment failed:', error);
        setError(error.error || 'Failed to update assignment');
      }
    } catch (err) {
      console.error('Error updating assignment:', err);
      setError('Failed to update assignment');
    }
  };

  const getAssigneeIcon = (assignee: any) => {
    if (!assignee) return <AlertCircle className="w-4 h-4 text-gray-400" />;
    return assignee.type === 'USER' 
      ? <Users className="w-4 h-4 text-blue-500" />
      : <Bot className="w-4 h-4 text-purple-500" />;
  };

  const getAssigneeBadge = (assignee: any) => {
    if (!assignee) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
          <AlertCircle className="w-3 h-3 mr-1" />
          Unassigned
        </span>
      );
    }

    const isUser = assignee.type === 'USER';
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
        isUser 
          ? 'bg-blue-100 text-blue-800' 
          : 'bg-purple-100 text-purple-800'
      }`}>
        {isUser ? <Users className="w-3 h-3 mr-1" /> : <Bot className="w-3 h-3 mr-1" />}
        {assignee.name}
        {assignee.role && ` (${assignee.role})`}
      </span>
    );
  };

  const stats = {
    total: assignments.length,
    assigned: assignments.filter(a => a.assignee).length,
    users: assignments.filter(a => a.assignee?.type === 'USER').length,
    agents: assignments.filter(a => a.assignee?.type === 'AI_AGENT').length,
    clauses: assignments.filter(a => a.type === 'CLAUSE').length,
    artefacts: assignments.filter(a => a.type === 'ARTEFACT').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">{error}</p>
        <button 
          onClick={loadData}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Responsibility Matrix</h1>
          <p className="text-gray-600">Manage assignments of clauses and artefacts to people and AI agents</p>
        </div>
        <button 
          onClick={loadData}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Items</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{stats.assigned}</div>
          <div className="text-sm text-gray-600">Assigned</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{stats.users}</div>
          <div className="text-sm text-gray-600">User Assigned</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">{stats.agents}</div>
          <div className="text-sm text-gray-600">AI Assigned</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-700">{stats.clauses}</div>
          <div className="text-sm text-gray-600">Clauses</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-700">{stats.artefacts}</div>
          <div className="text-sm text-gray-600">Artefacts</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filters.entityType}
              onChange={(e) => setFilters(prev => ({ ...prev, entityType: e.target.value as any }))}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="ALL">All Types</option>
              <option value="CLAUSE">Clauses Only</option>
              <option value="ARTEFACT">Artefacts Only</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-gray-500" />
            <select
              value={filters.assigneeType}
              onChange={(e) => setFilters(prev => ({ ...prev, assigneeType: e.target.value as any }))}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="ALL">All Assignees</option>
              <option value="USER">Users Only</option>
              <option value="AI_AGENT">AI Agents Only</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search items..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-1 text-sm w-48"
            />
          </div>
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Standard/Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assignments.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {assignment.entity.name}
                    </div>
                    {assignment.entity.clauseNumber && (
                      <div className="text-sm text-gray-500">
                        Clause {assignment.entity.clauseNumber}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      assignment.type === 'CLAUSE' 
                        ? 'bg-indigo-100 text-indigo-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {assignment.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {assignment.entity.standard || assignment.entity.status}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getAssigneeBadge(assignment.assignee)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleCellClick(assignment.id)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      {assignment.assignee ? 'Reassign' : 'Assign'}
                    </button>
                    
                    {selectedCell === assignment.id && (
                      <div className="absolute z-10 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">
                          Assign to:
                        </h4>
                        
                        {/* Users */}
                        <div className="mb-3">
                          <h5 className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            Users
                          </h5>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {users.map((user) => (
                              <button
                                key={user.id}
                                onClick={() => handleAssignment(assignment.id, user.id, 'USER')}
                                className="w-full text-left px-2 py-1 rounded text-sm hover:bg-blue-50 flex items-center"
                              >
                                <Users className="w-3 h-3 mr-2 text-blue-500" />
                                {user.name || user.email}
                                {user.role && <span className="text-xs text-gray-500 ml-1">({user.role})</span>}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* AI Agents (only for clauses) */}
                        {assignment.type === 'CLAUSE' && (
                          <div className="mb-3">
                            <h5 className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                              <Bot className="w-4 h-4 mr-1" />
                              AI Agents
                            </h5>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {agents.map((agent) => (
                                <button
                                  key={agent.id}
                                  onClick={() => handleAssignment(assignment.id, agent.id, 'AI_AGENT')}
                                  className="w-full text-left px-2 py-1 rounded text-sm hover:bg-purple-50 flex items-center"
                                >
                                  <Bot className="w-3 h-3 mr-2 text-purple-500" />
                                  {agent.name}
                                  <span className="text-xs text-gray-500 ml-1">({agent.type})</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => setSelectedCell(null)}
                          className="w-full mt-2 px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}