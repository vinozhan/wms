import React, { useState, useEffect } from 'react';
import { programService } from '../../utils/api';
import ProgramTable from '../../components/programs/ProgramTable';
import ProgramModal from '../../components/programs/ProgramModal';
import ApprovalModal from '../../components/programs/ApprovalModal';
import { PlusIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const Programs = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: '',
    type: ''
  });

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const response = await programService.getAll(filters);
      setPrograms(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, [filters]);

  const handleCreateProgram = async (programData) => {
    try {
      await programService.create(programData);
      await fetchPrograms();
      setShowModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateProgram = async (id, programData) => {
    try {
      await programService.update(id, programData);
      await fetchPrograms();
      setShowModal(false);
      setSelectedProgram(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleApproveProgram = async (approvalData) => {
    try {
      await programService.approve(selectedProgram._id, approvalData);
      await fetchPrograms();
      setShowApprovalModal(false);
      setSelectedProgram(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (program) => {
    setSelectedProgram(program);
    setShowModal(true);
  };

  const handleApprove = (program) => {
    setSelectedProgram(program);
    setShowApprovalModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Waste Management Programs</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Program
          </button>
          <button
            onClick={() => fetchPrograms()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ChartBarIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
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
              <option value="recycling">Recycling</option>
              <option value="composting">Composting</option>
              <option value="hazardous_waste">Hazardous Waste</option>
              <option value="bulk_collection">Bulk Collection</option>
              <option value="special">Special</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      <ProgramTable
        programs={programs}
        loading={loading}
        onEdit={handleEdit}
        onApprove={handleApprove}
      />

      {/* Modals */}
      {showModal && (
        <ProgramModal
          program={selectedProgram}
          onClose={() => {
            setShowModal(false);
            setSelectedProgram(null);
          }}
          onSubmit={selectedProgram ? handleUpdateProgram : handleCreateProgram}
        />
      )}

      {showApprovalModal && selectedProgram && (
        <ApprovalModal
          program={selectedProgram}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedProgram(null);
          }}
          onSubmit={handleApproveProgram}
        />
      )}
    </div>
  );
};

export default Programs;