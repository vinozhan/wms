import React from "react";
import { Link } from "react-router-dom";
import { companies } from "./companies";
import { EnvelopeIcon, PhoneIcon, MapPinIcon, ClipboardDocumentListIcon, StarIcon } from "@heroicons/react/24/outline";

const AdminCompanies = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold mb-8 text-gray-800 text-center">
        Partner Companies
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {companies.map((company) => (
          <div
            key={company.name}
            className="relative rounded-2xl overflow-hidden shadow-2xl transform transition duration-300 hover:scale-105"
          >
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 opacity-95 rounded-2xl"></div>

            {/* Card Content */}
            <div className="relative p-6 flex flex-col h-full justify-between text-white">
              <div className="flex justify-center mb-4">
                <img
                  src={company.image}
                  alt={company.name}
                  className="h-40 w-full object-contain rounded-xl bg-white p-2"
                />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold mb-2 drop-shadow-md">{company.name}</h2>

                <p className="text-sm flex items-center gap-2 drop-shadow-sm">
                  <EnvelopeIcon className="h-5 w-5 text-white" />
                  {company.email}
                </p>

                <p className="text-sm flex items-center gap-2 drop-shadow-sm">
                  <PhoneIcon className="h-5 w-5 text-white" />
                  {company.phone}
                </p>

                <p className="text-sm flex items-center gap-2 drop-shadow-sm">
                  <MapPinIcon className="h-5 w-5 text-white" />
                  {company.address}
                </p>

                <p className="text-sm flex items-center gap-2 drop-shadow-sm">
                  <ClipboardDocumentListIcon className="h-5 w-5 text-white" />
                  {company.orderType.join(", ")}
                </p>

                <p className="text-sm flex items-center gap-1 drop-shadow-sm">
                  <StarIcon className="h-5 w-5 text-yellow-300" />
                  {"★".repeat(Math.floor(company.rating))}
                  {"☆".repeat(5 - Math.floor(company.rating))}
                  <span className="ml-1">({company.rating})</span>
                </p>
              </div>

              <Link
                to={`/sheduleOrder?company=${encodeURIComponent(company.name)}`}
                className="mt-4 w-full text-center bg-white text-green-700 font-semibold py-2 rounded-xl hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
              >
                📝 Schedule Order
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCompanies;
