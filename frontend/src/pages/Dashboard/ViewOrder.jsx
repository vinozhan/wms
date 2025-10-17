import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { companies } from "./companies";
import { ClipboardDocumentListIcon, CalendarIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { RecycleIcon } from "lucide-react";

const ViewOrder = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const distributorName = localStorage.getItem("distributorName");
  const allowedStatuses = ["pending", "accepted", "completed", "not completed"];

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/orders/${orderId}`);
        const orderData = res.data;
        setOrder(orderData);

        const companyInfo = companies.find((c) => c.name === orderData.company);
        setCompanyDetails(companyInfo || null);
      } catch (err) {
        console.error(err);
        setErrorMsg("Failed to load order details.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setStatusUpdating(true);

    try {
      const res = await axios.patch(
        `http://localhost:5000/api/orders/${order._id}/status`,
        { status: newStatus }
      );
      setOrder(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("distributorEmail");
    localStorage.removeItem("distributorName");
    navigate("/distributorLogin");
  };

  const handleBack = () => {
    navigate("/distributorDashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-lime-50 to-green-100">
      {/* Navbar */}
      <nav className="bg-green-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <div
                className="flex-shrink-0 flex items-center text-white cursor-pointer"
                onClick={() => navigate("/distributorDashboard")}
              >
                <RecycleIcon className="h-8 w-8 mr-2" />
                <span className="text-xl font-bold">Distributor Portal</span>
              </div>
              <button
                className="text-white hover:text-green-200 px-3 py-2 rounded-md text-sm font-medium"
                onClick={() => navigate("/distributorDashboard")}
              >
                Dashboard
              </button>
              <button
                className="text-white hover:text-green-200 px-3 py-2 rounded-md text-sm font-medium"
                onClick={() => navigate("/history")}
              >
                History
              </button>
            </div>

           <div className="relative">
             <button
               onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
               className="flex items-center bg-green-600 text-white focus:outline-none py-[6px]"
             >
               <UserCircleIcon className="h-8 w-8 inline-block align-middle" />
               <span className="ml-2 text-sm font-medium align-middle">
                 {distributorName || "Distributor"}
               </span>
             </button>        
                                   {isUserMenuOpen && (
                                     <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-50">
                                       <button
                                         onClick={handleLogout}
                                         className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                       >
                                         Sign out
                                       </button>
                                    </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-6 max-w-5xl mx-auto">
        {loading && <p className="text-gray-700 text-center">Loading order details...</p>}
        {errorMsg && <p className="text-red-600 text-center">{errorMsg}</p>}
        {!loading && !errorMsg && !order && <p className="text-gray-700 text-center">Order not found.</p>}

        {!loading && order && (
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-6 items-center">
              {companyDetails && (
                <img
                  src={companyDetails.image}
                  alt={companyDetails.name}
                  className="w-32 h-32 object-cover rounded-xl shadow-md"
                />
              )}
              <div className="flex-1 space-y-2">
                <h1 className="text-3xl font-extrabold text-gray-800">
                  {companyDetails ? companyDetails.name : order.company}
                </h1>

                {companyDetails && (
                  <div className="text-gray-700 space-y-1">
                    <p><strong>Email:</strong> {companyDetails.email}</p>
                    <p><strong>Phone:</strong> {companyDetails.phone}</p>
                    <p><strong>Address:</strong> {companyDetails.address}</p>
                    <p><strong>Supported Order Types:</strong> {companyDetails.orderType.join(", ")}</p>
                    <p><strong>Rating:</strong> {companyDetails.rating} ⭐</p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Info */}
            <div className="bg-green-50 rounded-xl p-4 shadow-inner space-y-2">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Order Details</h2>

              <p className="flex items-center gap-2 text-gray-700">
                <ClipboardDocumentListIcon className="h-5 w-5 text-green-600" />
                <strong>Order Types:</strong> {order.orderTypes.join(", ")}
              </p>
              <p className="flex items-center gap-2 text-gray-700">
                🏋️ <strong>Quantity:</strong> {order.quantity} kg
              </p>
              <p className="flex items-center gap-2 text-gray-700">
                <CalendarIcon className="h-5 w-5 text-green-600" />
                <strong>Scheduled Date:</strong> {new Date(order.scheduledDate).toLocaleDateString()}
              </p>
              <p className="flex items-center gap-2 text-gray-700">
                <strong>Status:</strong>
                <select
                  value={order.status}
                  onChange={handleStatusChange}
                  disabled={statusUpdating}
                  className="ml-2 border border-green-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-green-400 focus:outline-none transition"
                >
                  {allowedStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
                {statusUpdating && <span className="text-sm text-gray-500 ml-2">Updating...</span>}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end">
              <button
                onClick={handleBack}
                className="bg-green-600 text-white py-2 px-4 rounded-xl hover:bg-green-700 transition font-semibold"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewOrder;
