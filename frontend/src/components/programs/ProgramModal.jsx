import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ProgramModal = ({ program, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'recycling',
    status: 'draft',
    objectives: [],
    targetAreas: [],
    budget: {
      allocated: 0,
      utilized: 0
    },
    timeline: {
      startDate: '',
      endDate: '',
      milestones: []
    }
  });

  const [objectiveInput, setObjectiveInput] = useState('');
  const [targetAreaInput, setTargetAreaInput] = useState('');
  const [milestoneInput, setMilestoneInput] = useState({ name: '', targetDate: '' });

  useEffect(() => {
    if (program) {
      setFormData({
        name: program.name || '',
        description: program.description || '',
        type: program.type || 'recycling',
        status: program.status || 'draft',
        objectives: program.objectives || [],
        targetAreas: program.targetAreas || [],
        budget: {
          allocated: program.budget?.allocated || 0,
          utilized: program.budget?.utilized || 0
        },
        timeline: {
          startDate: program.timeline?.startDate ? program.timeline.startDate.split('T')[0] : '',
          endDate: program.timeline?.endDate ? program.timeline.endDate.split('T')[0] : '',
          milestones: program.timeline?.milestones || []
        }
      });
    }
  }, [program]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(program ? program._id : null, formData);
  };

  const handleAddObjective = () => {
    if (objectiveInput.trim() && !formData.objectives.includes(objectiveInput.trim())) {
      setFormData({
        ...formData,
        objectives: [...formData.objectives, objectiveInput.trim()]
      });
      setObjectiveInput('');
    }
  };

  const handleRemoveObjective = (objective) => {
    setFormData({
      ...formData,
      objectives: formData.objectives.filter(obj => obj !== objective)
    });
  };

  const handleAddTargetArea = () => {
    if (targetAreaInput.trim() && !formData.targetAreas.includes(targetAreaInput.trim())) {
      setFormData({
        ...formData,
        targetAreas: [...formData.targetAreas, targetAreaInput.trim()]
      });
      setTargetAreaInput('');
    }
  };

  const handleRemoveTargetArea = (area) => {
    setFormData({
      ...formData,
      targetAreas: formData.targetAreas.filter(a => a !== area)
    });
  };

  const handleAddMilestone = () => {
    if (milestoneInput.name.trim() && milestoneInput.targetDate) {
      setFormData({
        ...formData,
        timeline: {
          ...formData.timeline,
          milestones: [...formData.timeline.milestones, {
            name: milestoneInput.name.trim(),
            targetDate: milestoneInput.targetDate,
            completed: false
          }]
        }
      });
      setMilestoneInput({ name: '', targetDate: '' });
    }
  };

  const handleRemoveMilestone = (index) => {
    const newMilestones = formData.timeline.milestones.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      timeline: {
        ...formData.timeline,
        milestones: newMilestones
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {program ? 'Edit Program' : 'Create New Program'}
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
            <label className="block text-sm font-medium text-gray-700">Program Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter program name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              rows={3}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe the program objectives and scope..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Program Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="recycling">Recycling Initiative</option>
                <option value="composting">Composting Program</option>
                <option value="hazardous_waste">Hazardous Waste Collection</option>
                <option value="bulk_collection">Bulk Item Collection</option>
                <option value="special">Special Program</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Budget Allocated ($)</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.budget.allocated}
                onChange={(e) => setFormData({
                  ...formData,
                  budget: { ...formData.budget, allocated: parseFloat(e.target.value) || 0 }
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Budget Utilized ($)</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.budget.utilized}
                onChange={(e) => setFormData({
                  ...formData,
                  budget: { ...formData.budget, utilized: parseFloat(e.target.value) || 0 }
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={formData.timeline.startDate}
                onChange={(e) => setFormData({
                  ...formData,
                  timeline: { ...formData.timeline, startDate: e.target.value }
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={formData.timeline.endDate}
                onChange={(e) => setFormData({
                  ...formData,
                  timeline: { ...formData.timeline, endDate: e.target.value }
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Objectives</label>
            <div className="mt-1 flex space-x-2">
              <input
                type="text"
                value={objectiveInput}
                onChange={(e) => setObjectiveInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddObjective())}
                placeholder="Enter program objective"
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddObjective}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.objectives.map((objective, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                >
                  {objective}
                  <button
                    type="button"
                    onClick={() => handleRemoveObjective(objective)}
                    className="ml-1.5 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Target Areas</label>
            <div className="mt-1 flex space-x-2">
              <input
                type="text"
                value={targetAreaInput}
                onChange={(e) => setTargetAreaInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTargetArea())}
                placeholder="Enter target area"
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddTargetArea}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.targetAreas.map((area, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {area}
                  <button
                    type="button"
                    onClick={() => handleRemoveTargetArea(area)}
                    className="ml-1.5 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Milestones</label>
            <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                type="text"
                value={milestoneInput.name}
                onChange={(e) => setMilestoneInput({ ...milestoneInput, name: e.target.value })}
                placeholder="Milestone name"
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="date"
                value={milestoneInput.targetDate}
                onChange={(e) => setMilestoneInput({ ...milestoneInput, targetDate: e.target.value })}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={handleAddMilestone}
              className="mt-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Add Milestone
            </button>
            <div className="mt-2 space-y-2">
              {formData.timeline.milestones.map((milestone, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{milestone.name}</span>
                    <span className="text-gray-500 ml-2">
                      {new Date(milestone.targetDate).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMilestone(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
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
              {program ? 'Update Program' : 'Create Program'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProgramModal;