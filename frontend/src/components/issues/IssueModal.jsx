import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { companyService } from '../../utils/api';

const IssueModal = ({ issue, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
  title: '',
  description: '',
  type: 'missed_pickup',
  priority: 'medium',
  reportedBy: 'Municipal Council',
  assignedTo: '', // Use empty string instead of null
  location: {
    address: ''
  }
});

const [companies, setCompanies] = useState([]);
const [companiesLoading, setCompaniesLoading] = useState(true);

useEffect(() => {
  const fetchCompanies = async () => {
    try {
      console.log('Starting to fetch companies...');
      const response = await companyService.getAll();
      console.log('Raw companies API response:', response);

      // The response structure is: response.data.data.companies
      if (response && response.data && response.data.companies) {
        console.log('Companies found at response.data.companies:', response.data.companies);
        setCompanies(response.data.companies);
      } 
      // Alternative structure: response.data.data.companies (double nested)
      else if (response && response.data && response.data.data && response.data.data.companies) {
        console.log('Companies found at response.data.data.companies:', response.data.data.companies);
        setCompanies(response.data.data.companies);
      }
      // Direct array
      else if (response && Array.isArray(response)) {
        console.log('Direct companies array:', response);
        setCompanies(response);
      }
      // Direct array in data property
      else if (response && response.data && Array.isArray(response.data)) {
        console.log('Companies array at response.data:', response.data);
        setCompanies(response.data);
      }
      else {
        console.log('Unexpected response format, trying to explore:', response);
        
        // Debug: log all possible paths
        if (response) {
          console.log('Available keys in response:', Object.keys(response));
          if (response.data) {
            console.log('Available keys in response.data:', Object.keys(response.data));
            if (response.data.data) {
              console.log('Available keys in response.data.data:', Object.keys(response.data.data));
            }
          }
        }
        
        setCompanies([]);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
    } finally {
      setCompaniesLoading(false);
    }
  };

  fetchCompanies();
}, []);

    useEffect(() => {
    console.log('Companies state updated:', companies);
    }, [companies]);

  useEffect(() => {
    if (issue) {
      console.log('Setting form data for editing issue:', issue);
      setFormData({
        title: issue.title || '',
        description: issue.description || '',
        type: issue.type || 'missed_pickup',
        priority: issue.priority || 'medium',
        reportedBy: issue.reportedBy || 'Municipal Council',
        assignedTo: issue.assignedTo || '',
        location: {
          address: issue.location?.address || ''
        }
      });
    } else {
    // Reset to initial state when creating new issue
    setFormData({
      title: '',
      description: '',
      type: 'missed_pickup',
      priority: 'medium',
      reportedBy: 'Municipal Council',
      assignedTo: '', // Use empty string for unassigned
      location: {
        address: ''
      }
    });
  }
  }, [issue]);

  const handleSubmit = (e) => {
  e.preventDefault();
  
  console.log('Submitting issue data:', formData); // Debug log
  
  // Validate required fields
//   if (!formData.title || !formData.description || !formData.type) {
//     setError('Please fill in all required fields');
//     return;
//   }

  if (issue) {
    // For update: pass id and formData
    console.log('Updating issue:', issue._id, formData);
    onSubmit(issue._id, formData);
  } else {
    // For create: pass only formData
    console.log('Creating issue:', formData);
    onSubmit(formData);
  }
};

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name in formData.location) {
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [name]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {issue ? 'Edit Issue' : 'Report New Issue'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Brief description of the issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              rows={4}
              name="description"
              required
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Detailed description of the issue..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Issue Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="missed_pickup">Missed Pickup</option>
                <option value="damaged_bin">Damaged Bin</option>
                <option value="complaint">Public Complaint</option>
                <option value="compliance_violation">Compliance Violation</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Reported By</label>
              <input
                type="text"
                name="reportedBy"
                required
                value={formData.reportedBy}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Assign to Company</label>
              <select
                name="assignedTo"
                value={formData.assignedTo}
                onChange={(e) => {
                    console.log('Selected company:', e.target.value);
                    setFormData({
                    ...formData,
                    assignedTo: e.target.value
                    });
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                <option value="">Unassigned</option>
                {companiesLoading ? (
                    <option disabled>Loading companies...</option>
                ) : companies.length > 0 ? (
                    companies.map(company => {
                    console.log('Rendering company option:', company._id, company.name);
                    return (
                        <option key={company._id} value={company._id}>
                        {company.name}
                        </option>
                    );
                    })
                ) : (
                    <option disabled>No companies available</option>
                )}
                </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Location Address</label>
            <input
              type="text"
              name="address"
              value={formData.location.address}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Street address where issue occurred"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              {issue ? 'Update Issue' : 'Create Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IssueModal;