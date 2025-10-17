import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { companies } from "./companies";
import axios from "axios";
import { EnvelopeIcon, PhoneIcon, MapPinIcon, CalendarIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

const ScheduleOrder = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const companyName = params.get("company");

  const [company, setCompany] = useState(null);
  const [distributors, setDistributors] = useState([]);
  const [selectedDistributor, setSelectedDistributor] = useState(null);
  const [selectedOrderTypes, setSelectedOrderTypes] = useState([]);
  const [quantity, setQuantity] = useState("");
  const [date, setDate] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const foundCompany = companies.find((c) => c.name === companyName);
    setCompany(foundCompany || null);
  }, [companyName]);

  useEffect(() => {
    const fetchDistributors = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/distributors");
        if (Array.isArray(res.data)) setDistributors(res.data);
      } catch (err) {
        console.error("Failed to fetch distributors:", err);
      }
    };
    fetchDistributors();
  }, []);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setSuccessMsg("");
  setErrorMsg("");

  if (!selectedDistributor) return setErrorMsg("Please select a distributor.");
  if (!selectedOrderTypes.length) return setErrorMsg("Select at least one order type.");
  if (!date) return setErrorMsg("Select a date.");

  const orderData = {
    company: company.name,
    distributorName: selectedDistributor.name,
    distributorEmail: selectedDistributor.email,
    orderTypes: selectedOrderTypes,
    quantity: Number(quantity),
    scheduledDate: date,
  };

  try {
    await axios.post("http://localhost:5000/api/orders", orderData);
    setSuccessMsg("Order scheduled successfully!");
    setSelectedDistributor(null);
    setSelectedOrderTypes([]);
    setQuantity("");
    setDate("");
    setTimeout(() => navigate("/orders"), 1000);
  } catch (err) {
    console.error("Failed to schedule order:", err.response || err);

    // ✅ Show backend-provided message if available
    if (err.response?.data?.message) {
      setErrorMsg(err.response.data.message);
    } else {
      setErrorMsg("Failed to schedule order. Please try again.");
    }
  }
};


  if (!company) return <p className="p-4">Company not found.</p>;

  return (
    
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-6 text-gray-800 text-center">
        Schedule Order
      </h1>

      {/* Company Info */}
      <div className="rounded-2xl overflow-hidden shadow-lg mb-6">
        <div className="bg-gradient-to-r from-lime-400 via-green-500 to-emerald-600 p-4 text-white flex items-center justify-between">
          <h2 className="text-xl font-bold">{company.name}</h2>
          <CheckCircleIcon className="h-6 w-6 text-white" />
        </div>
        <div className="p-4 bg-white space-y-2 text-gray-700">
          <p className="flex items-center gap-2">
            <EnvelopeIcon className="h-5 w-5 text-green-600" /> {company.email}
          </p>
          <p className="flex items-center gap-2">
            <PhoneIcon className="h-5 w-5 text-green-600" /> {company.phone}
          </p>
          <p className="flex items-center gap-2">
            <MapPinIcon className="h-5 w-5 text-green-600" /> {company.address}
          </p>
          <p><span className="font-semibold text-green-700">Order Types:</span> {company.orderType.join(", ")}</p>
          <p>
            <span className="font-semibold text-green-700">Rating:</span>{" "}
            <span className="text-yellow-400">
              {"★".repeat(Math.floor(company.rating))}
              {"☆".repeat(5 - Math.floor(company.rating))}
            </span>{" "}
            ({company.rating})
          </p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMsg && (
        <div className="mb-4 p-3 bg-gradient-to-r from-green-100 via-lime-100 to-green-200 text-green-800 border rounded-lg shadow-sm flex items-center gap-2">
          <CheckCircleIcon className="h-5 w-5 text-green-700" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 p-3 bg-gradient-to-r from-red-100 via-pink-100 to-red-200 text-red-800 border rounded-lg shadow-sm flex items-center gap-2">
          ❌ {errorMsg}
        </div>
      )}

      {/* Schedule Form */}
      <form onSubmit={handleSubmit} className="space-y-5 bg-gradient-to-br from-green-50 via-lime-50 to-green-100 p-6 rounded-2xl shadow-lg">
        {/* Distributor */}
        <div>
          <label className="block mb-1 font-medium text-green-800 flex items-center gap-2">
            <EnvelopeIcon className="h-5 w-5" /> Select Distributor
          </label>
           <select
  value={selectedDistributor?.email || ""}
  onChange={(e) =>
    setSelectedDistributor(distributors.find((d) => d.email === e.target.value))
  }
  required
  onInvalid={(e) => e.target.setCustomValidity("Please choose a distributor.")}
  onInput={(e) => e.target.setCustomValidity("")} // clears message when user interacts
  className="w-full border rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-green-400 focus:outline-none bg-white"
>
  <option value="">-- Select Distributor --</option>
  {distributors.map((d) => (
    <option key={d._id} value={d.email}>
      {d.name} ({d.email})
    </option>
  ))}
</select>

        </div>

        {/* Order Types */}
        <div>
          <label className="block mb-2 font-medium text-green-800 flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5" /> Select Order Type(s)
          </label>
          <div className="flex flex-wrap gap-2">
            {company.orderType.map((type) => {
              const isSelected = selectedOrderTypes.includes(type);
              return (
                <button
                  type="button"
                  key={type}
                  onClick={() => {
                    if (isSelected)
                      setSelectedOrderTypes(selectedOrderTypes.filter((t) => t !== type));
                    else setSelectedOrderTypes([...selectedOrderTypes, type]);
                  }}
                  className={`px-4 py-2 rounded-full border transition focus:outline-none ${
                    isSelected
                      ? "bg-gradient-to-r from-green-500 to-lime-400 text-white border-green-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-green-50"
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quantity */}
        <div>
          <label className="block mb-1 font-medium text-green-800 flex items-center gap-2">
            🏋️ Quantity (kg)
          </label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-green-400 focus:outline-none bg-white"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block mb-1 font-medium text-green-800 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" /> Select Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-green-400 focus:outline-none bg-white"
          />
        </div>
{/* Submit */}
<button
  type="submit"
  className="w-full bg-green-600 text-white font-semibold py-3 rounded-2xl shadow-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
>
  <CheckCircleIcon className="h-5 w-5" />
  Schedule Order
</button>


      </form>
    </div>
  );
};

export default ScheduleOrder;
