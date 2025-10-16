import React, { useState, useEffect } from 'react';
import { issueService } from '../../utils/api';
import IssueTable from '../../components/issues/IssueTable';
import IssueModal from '../../components/issues/IssueModal';
import ResolutionModal from '../../components/issues/ResolutionModal';
import EscalationModal from '../../components/issues/EscalationModal';
import { PlusIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const Issues = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: '',
    priority: '',
    type: ''
  });

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const response = await issueService.getAll(filters);
      setIssues(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [filters]);

  const handleCreateIssue = async (issueData) => {
    try {
      await issueService.create(issueData);
      await fetchIssues();
      setShowModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateIssue = async (id, issueData) => {
    try {
      await issueService.update(id, issueData);
      await fetchIssues();
      setShowModal(false);
      setSelectedIssue(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResolveIssue = async (resolutionData) => {
    try {
      await issueService.resolve(selectedIssue._id, resolutionData);
      await fetchIssues();
      setShowResolutionModal(false);
      setSelectedIssue(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEscalateIssue = async (escalationData) => {
    try {
      await issueService.escalate(selectedIssue._id, escalationData);
      await fetchIssues();
      setShowEscalationModal(false);
      setSelectedIssue(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (issue) => {
    setSelectedIssue(issue);
    setShowModal(true);
  };

  const handleResolve = (issue) => {
    setSelectedIssue(issue);
    setShowResolutionModal(true);
  };

  const handleEscalate = (issue) => {
    setSelectedIssue(issue);
    setShowEscalationModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Reported Issues</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Report Issue
          </button>
          <button
            onClick={() => fetchIssues()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ChartBarIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="reported">Reported</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="escalated">Escalated</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value, page: 1 })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="missed_pickup">Missed Pickup</option>
              <option value="damaged_bin">Damaged Bin</option>
              <option value="complaint">Complaint</option>
              <option value="compliance_violation">Compliance Violation</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      <IssueTable
        issues={issues}
        loading={loading}
        onEdit={handleEdit}
        onResolve={handleResolve}
        onEscalate={handleEscalate}
      />

      {/* Modals */}
      {showModal && (
        <IssueModal
          issue={selectedIssue}
          onClose={() => {
            setShowModal(false);
            setSelectedIssue(null);
          }}
          onSubmit={selectedIssue ? handleUpdateIssue : handleCreateIssue}
        />
      )}

      {showResolutionModal && selectedIssue && (
        <ResolutionModal
          issue={selectedIssue}
          onClose={() => {
            setShowResolutionModal(false);
            setSelectedIssue(null);
          }}
          onSubmit={handleResolveIssue}
        />
      )}

      {showEscalationModal && selectedIssue && (
        <EscalationModal
          issue={selectedIssue}
          onClose={() => {
            setShowEscalationModal(false);
            setSelectedIssue(null);
          }}
          onSubmit={handleEscalateIssue}
        />
      )}
    </div>
  );
};

export default Issues;