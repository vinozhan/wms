import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserIcon, EnvelopeIcon, LockClosedIcon, MapPinIcon } from "@heroicons/react/24/outline";

const RegisterDistributor = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    address: "",
  });
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setSuccess(false);

    try {
      const res = await fetch("http://localhost:5000/api/distributors/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage(" Distributor registered successfully!");
        setSuccess(true);
        setFormData({ name: "", email: "", password: "", address: "" });
        setTimeout(() => navigate("/distributorLogin"), 2000);
      } else {
        setMessage(`❌ ${data.message || "Registration failed."}`);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("❌ Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 via-green-50 to-green-200 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 relative">
        <h2 className="text-2xl font-extrabold text-green-700 text-center mb-6">
          Distributor Registration
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="relative">
            <UserIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500" />
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition"
            />
          </div>

          {/* Email */}
          <div className="relative">
            <EnvelopeIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500" />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <LockClosedIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500" />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition"
            />
          </div>

          {/* Address */}
          <div className="relative">
            <MapPinIcon className="h-5 w-5 absolute left-3 top-3 text-green-500" />
            <textarea
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none resize-none transition h-20"
            ></textarea>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        {/* Message */}
        {message && (
          <p
            className={`mt-4 p-2 text-center rounded-lg font-medium ${
              success
                ? "bg-green-100 text-green-800 border border-green-300"
                : "bg-red-100 text-red-800 border border-red-300"
            }`}
          >
            {message}
          </p>
        )}

        {/* Login Links */}
        <div className="mt-4 text-center text-gray-700">
          Already have an account?{" "}
          <Link to="/distributorLogin" className="text-green-700 font-semibold hover:underline">
            Login
          </Link>
        </div>
        <div className="mt-2 text-center text-gray-700">
          Are you a customer?{" "}
          <Link to="/login" className="text-green-700 font-semibold hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterDistributor;
