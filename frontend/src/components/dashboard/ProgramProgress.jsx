import React from 'react';
import { Link } from 'react-router-dom';

const ProgramProgress = ({ programs = [] }) => {
  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-600';
    if (progress >= 60) return 'bg-blue-600';
    if (progress >= 40) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Program Progress
          </h3>
          <Link
            to="/programs"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            View all
          </Link>
        </div>
      </div>
      <div className="p-4 space-y-4">
        {programs.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            No active programs
          </div>
        ) : (
          programs.map((program) => (
            <div key={program._id} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-900 truncate">
                  {program.program}
                </span>
                <span className="text-gray-500">{program.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getProgressColor(program.progress)}`}
                  style={{ width: `${program.progress}%` }}
                ></div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProgramProgress;