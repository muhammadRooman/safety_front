import React, { useState } from "react";
import axios from "axios";
import { ENV } from "../../config/config";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const AdminForgotPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const adminId = "69b58fabdd333602016da079";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword) {
      setMessage("Please enter new password");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await axios.post(
        `${ENV.appBaseUrl}/auth/rooman-heacker-ohs-2006-forgot-password`,
        {
          id: adminId,
          newPassword,
        }
      );

      setMessage(res.data.message);
      setNewPassword("");
    } catch (error) {
      setMessage(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f4f4f4",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "400px",
          background: "#fff",
          padding: "30px",
          borderRadius: "10px",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          Admin Forgot Password
        </h2>

        {/* PASSWORD INPUT WITH EYE */}
        <div style={{ position: "relative", marginBottom: "15px" }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "5px",
              paddingRight: "40px",
            }}
          />

          <span
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
            }}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            background: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          {loading ? "Changing..." : "Change Password"}
        </button>

        {message && (
          <p style={{ marginTop: "15px", textAlign: "center", color: "green" }}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
};

export default AdminForgotPassword;