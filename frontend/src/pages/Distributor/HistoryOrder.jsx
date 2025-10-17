import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  UserCircleIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { RecycleIcon } from "lucide-react";

const DistributorHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navigate = useNavigate();
  const distributorEmail = localStorage.getItem("distributorEmail");
  const distributorName = localStorage.getItem("distributorName");

  // ✅ Fetch all distributor orders (then filter)
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!distributorEmail) throw new Error("Distributor email not found");

        const res = await axios.get(
          `http://localhost:5000/api/orders/distributor/${distributorEmail}`
        );

        // ✅ Only show completed + not completed
        const filtered = res.data.filter(
          (o) => o.status === "completed" || o.status === "not completed"
        );
        setOrders(filtered);
      } catch (err) {
        console.error("Error fetching history:", err);
        setErrorMsg("Failed to load order history.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [distributorEmail]);

  const handleViewOrder = (id) => navigate(`/viewOrder/${id}`);

  const handleLogout = () => {
    localStorage.removeItem("distributorEmail");
    localStorage.removeItem("distributorName");
    navigate("/distributorLogin");
  };

  // 🧮 Stats
  const completedCount = orders.filter((o) => o.status === "completed").length;
  const notCompletedCount = orders.filter((o) => o.status === "not completed").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-lime-100">
      {/* NAVBAR */}
      <nav className="bg-green-600 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
          <div className="flex items-center space-x-4">
            <RecycleIcon className="h-8 w-8 text-white" />
            <span className="text-xl text-white font-bold">Distributor Dashboard</span>
            <button
              onClick={() => navigate("/distributorDashboard")}
              className="text-white hover:text-green-200 text-sm px-3 py-2 rounded-md"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate("/distributorHistory")}
              className="bg-green-700 text-white text-sm px-3 py-2 rounded-md font-semibold"
            >
              History
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center bg-green-600 text-white focus:outline-none"
            >
              <UserCircleIcon className="h-8 w-8" />
              <span className="ml-2 font-medium">{distributorName || "Distributor"}</span>
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
      </nav>

      {/* HEADER */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Order History
        </h1>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
            <h2 className="text-green-600 text-2xl font-bold">{completedCount}</h2>
            <p className="text-gray-600 font-medium">Completed Orders</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
            <h2 className="text-red-500 text-2xl font-bold">{notCompletedCount}</h2>
            <p className="text-gray-600 font-medium">Not Completed Orders</p>
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <p className="text-center text-gray-700">Loading history...</p>
        ) : errorMsg ? (
          <p className="text-center text-red-600">{errorMsg}</p>
        ) : orders.length === 0 ? (
          <p className="text-center text-gray-700">No completed or not completed orders found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white shadow-lg rounded-2xl overflow-hidden transition transform hover:scale-105"
              >
                {/* Header */}
                <div
                  className={`p-4 flex justify-between items-center ${
                    order.status === "completed"
                      ? "bg-green-600"
                      : "bg-red-500"
                  } text-white`}
                >
                  <h2 className="font-semibold">{order.company}</h2>
                  <span className="capitalize text-sm bg-white text-gray-800 px-3 py-1 rounded-full">
                    {order.status}
                  </span>
                </div>

                {/* Details */}
                <div className="p-4 text-gray-700 space-y-2">
                  <p className="flex items-center gap-2">
                    <ClipboardDocumentListIcon className="h-5 w-5 text-green-600" />
                    <strong>Types:</strong> {order.orderTypes.join(", ")}
                  </p>
                  <p>
                    <strong>Quantity:</strong> {order.quantity} kg
                  </p>
                  <p className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-green-600" />
                    <strong>Scheduled:</strong>{" "}
                    {new Date(order.scheduledDate).toLocaleDateString()}
                  </p>

                  <button
                    onClick={() => handleViewOrder(order._id)}
                    className="w-full mt-3 bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 transition font-medium"
                  >
                    View Details
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

export default DistributorHistory;
