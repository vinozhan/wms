import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaTrashAlt } from "react-icons/fa";
import { EnvelopeIcon, CalendarIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [deletingOrderId, setDeletingOrderId] = useState(null);

  const STATUS_OPTIONS = ["pending", "accepted", "completed", "not completed"];

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/orders");
        setOrders(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        setErrorMsg("Failed to load orders.");
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingStatusId(orderId);
      const res = await axios.patch(`http://localhost:5000/api/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) =>
        prev.map((order) => (order._id === orderId ? { ...order, status: res.data.status } : order))
      );
    } catch (err) {
      console.error("Failed to update order status:", err.response || err);
      alert("Failed to update status.");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDelete = async (orderId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this order?");
    if (!confirmDelete) return;

    try {
      setDeletingOrderId(orderId);
      await axios.delete(`http://localhost:5000/api/orders/${orderId}`);
      setOrders((prev) => prev.filter((order) => order._id !== orderId));
    } catch (err) {
      console.error("Failed to delete order:", err.response || err);
      alert("Failed to delete order.");
    } finally {
      setDeletingOrderId(null);
    }
  };

  if (loading) return <p className="p-4 text-center text-gray-700">Loading orders...</p>;
  if (errorMsg) return <p className="p-4 text-center text-red-600">{errorMsg}</p>;
  if (orders.length === 0) return <p className="p-4 text-center text-gray-700">No orders found.</p>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center"> Orders</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => (
          <div
            key={order._id}
            className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition hover:scale-105 hover:shadow-2xl"
          >
            {/* Header */}
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

            {/* Content */}
            <div className="p-4 space-y-2 text-gray-700">
              <p className="flex items-center gap-2">
                <ClipboardDocumentListIcon className="h-5 w-5 text-green-600" />
                {order.distributorName}
              </p>
              <p className="flex items-center gap-2">
                <EnvelopeIcon className="h-5 w-5 text-green-600" />
                {order.distributorEmail}
              </p>
              <p className="flex items-center gap-2">
                <ClipboardDocumentListIcon className="h-5 w-5 text-green-600" />
                {order.orderTypes.join(", ")}
              </p>
              <p className="flex items-center gap-2">
                🏋️ Quantity: {order.quantity} kg
              </p>
              <p className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-green-600" />
                {new Date(order.scheduledDate).toLocaleDateString()}
              </p>

               {/* Status Dropdown */}
<div className="mt-2">
  <label className="block text-sm font-medium text-gray-700 mb-1">Update Status</label>
  <select
    value={order.status}
    onChange={(e) => handleStatusChange(order._id, e.target.value)}
    disabled={updatingStatusId === order._id}
    className="w-full border rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-green-400 focus:outline-none bg-white text-gray-800 font-medium transition"
  >
    {STATUS_OPTIONS.map((status) => (
      <option key={status} value={status}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </option>
    ))}
  </select>
  {updatingStatusId === order._id && (
    <span className="text-sm text-gray-500 mt-1 block">Updating...</span>
  )}
</div>


              {/* Delete Button */}
              <button
                onClick={() => handleDelete(order._id)}
                disabled={deletingOrderId === order._id}
                className="mt-3 w-full flex items-center justify-center gap-2 bg-red-600 text-white py-2 rounded-xl hover:bg-red-700 transition"
              >
                <FaTrashAlt />
                {deletingOrderId === order._id ? "Deleting..." : "Delete Order"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
