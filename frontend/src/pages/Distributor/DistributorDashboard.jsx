import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  ClipboardDocumentListIcon,
  CalendarIcon,
  UserCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { RecycleIcon } from "lucide-react";

const DistributorDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const distributorEmail = localStorage.getItem("distributorEmail");
  const distributorName = localStorage.getItem("distributorName");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!distributorEmail) throw new Error("Distributor email not found.");
        const res = await axios.get(
          `http://localhost:5000/api/orders/distributor/${distributorEmail}`
        );
        setOrders(res.data);
      } catch (err) {
        console.error("Failed to fetch distributor orders:", err);
        setErrorMsg("Failed to load orders.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [distributorEmail]);

  const handleViewOrder = (orderId) => {
    navigate(`/viewOrder/${orderId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("distributorEmail");
    localStorage.removeItem("distributorName");
    navigate("/distributorLogin");
  };

  // 🧮 Calculate analytics dynamically
  const analytics = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === "pending").length;
    const accepted = orders.filter(o => o.status === "accepted").length;
    const completed = orders.filter(o => o.status === "completed").length;
    const notCompleted = orders.filter(o => o.status === "not completed").length;
    return { total, pending, accepted, completed, notCompleted };
  }, [orders]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-lime-50 to-green-100">
      {/* Navbar */}
      <nav className="bg-green-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 flex items-center text-white">
                <RecycleIcon className="h-8 w-8 mr-2" />
                <span className="text-xl font-bold">Distributor Dashboard</span>
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
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-8 text-gray-800 text-center">
          Your Orders Overview
        </h1>

        {/* Analytics Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          <div className="bg-white rounded-2xl p-4 shadow hover:shadow-lg flex flex-col items-center text-green-700">
            <ArrowPathIcon className="h-8 w-8 mb-2 text-green-600" />
            <p className="text-lg font-bold">{analytics.total}</p>
            <p className="text-sm">Total Orders</p>
          </div>

          <div className="bg-yellow-50 rounded-2xl p-4 shadow hover:shadow-lg flex flex-col items-center text-yellow-700">
            <ClockIcon className="h-8 w-8 mb-2 text-yellow-600" />
            <p className="text-lg font-bold">{analytics.pending}</p>
            <p className="text-sm">Pending</p>
          </div>

          <div className="bg-green-50 rounded-2xl p-4 shadow hover:shadow-lg flex flex-col items-center text-green-700">
            <CheckCircleIcon className="h-8 w-8 mb-2 text-green-600" />
            <p className="text-lg font-bold">{analytics.accepted}</p>
            <p className="text-sm">Accepted</p>
          </div>

          <div className="bg-blue-50 rounded-2xl p-4 shadow hover:shadow-lg flex flex-col items-center text-blue-700">
            <ClipboardDocumentListIcon className="h-8 w-8 mb-2 text-blue-600" />
            <p className="text-lg font-bold">{analytics.completed}</p>
            <p className="text-sm">Completed</p>
          </div>

          <div className="bg-red-50 rounded-2xl p-4 shadow hover:shadow-lg flex flex-col items-center text-red-700">
            <XCircleIcon className="h-8 w-8 mb-2 text-red-600" />
            <p className="text-lg font-bold">{analytics.notCompleted}</p>
            <p className="text-sm">Not Completed</p>
          </div>
        </div>

        {/* Orders List */}
        {loading && <p className="text-gray-700 text-center">Loading orders...</p>}
        {errorMsg && <p className="text-red-600 text-center">{errorMsg}</p>}
        {!loading && !errorMsg && orders.length === 0 && (
          <p className="text-gray-700 text-center">No orders found for you.</p>
        )}

        {!loading && orders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition hover:scale-105 hover:shadow-2xl"
              >
                <div className="bg-gradient-to-r from-lime-400 via-green-500 to-emerald-600 p-4 text-white flex justify-between items-center">
                  <h2 className="text-lg font-bold">{order.company}</h2>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${
                      order.status === "pending"
                        ? "bg-yellow-200 text-yellow-800"
                        : order.status === "accepted"
                        ? "bg-green-200 text-green-800"
                        : order.status === "completed"
                        ? "bg-blue-200 text-blue-800"
                        : "bg-red-200 text-red-800"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="p-4 space-y-2 text-gray-700">
                  <p className="flex items-center gap-2">
                    <ClipboardDocumentListIcon className="h-5 w-5 text-green-600" />
                    <strong>Order Types:</strong> {order.orderTypes.join(", ")}
                  </p>
                  <p className="flex items-center gap-2">
                    🏋️ <strong>Quantity:</strong> {order.quantity} kg
                  </p>
                  <p className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-green-600" />
                    <strong>Scheduled Date:</strong>{" "}
                    {new Date(order.scheduledDate).toLocaleDateString()}
                  </p>

                  <button
                    className="mt-3 w-full bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 transition font-semibold"
                    onClick={() => handleViewOrder(order._id)}
                  >
                    View Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DistributorDashboard;
