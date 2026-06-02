import React, { useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";
import { Badge, Card, InputGroup, Form, Spinner } from "react-bootstrap";
import { BsPatchCheckFill, BsShieldCheck } from "react-icons/bs";

export default function Verification() {
  const [certVerifyId, setCertVerifyId] = useState("");
  const [certVerifyLoading, setCertVerifyLoading] = useState(false);
  const [certVerifyState, setCertVerifyState] = useState(null);

  const token = useSelector((state) => state.auth.token);

  const verifyCertificate = async () => {
    if (!token) return;

    const nextId = certVerifyId.trim();

    if (!nextId) {
      toast.error("Please enter Certificate ID");
      return;
    }

    setCertVerifyLoading(true);
    setCertVerifyState(null);

    try {
      const API_BASE = process.env.REACT_APP_BASE_ADMIN_API;

      const res = await axios.get(
        `${API_BASE}/admin/certificates/verify/${encodeURIComponent(nextId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCertVerifyState({
        verified: Boolean(res.data?.verified),
        message: res.data?.message || "Verification completed",
      });
    } catch (err) {
      setCertVerifyState({
        verified: false,
        message: err.response?.data?.message || "Verification failed",
      });
    } finally {
      setCertVerifyLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <Card
        className="border-0 shadow-lg rounded-4"
        style={{ maxWidth: "550px", margin: "auto" }}
      >
        <Card.Body className="p-4">
          <div className="text-center mb-4">
            <BsShieldCheck size={45} className="text-primary mb-2" />
            <h4 className="fw-bold mb-1">Certificate Verification</h4>
            <p className="text-muted mb-0">
              Enter your certificate ID to verify authenticity
            </p>
          </div>

          <InputGroup>
            <Form.Control
              placeholder="Enter Certificate ID"
              value={certVerifyId}
              onChange={(e) => setCertVerifyId(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && verifyCertificate()
              }
            />

            <button
              className="btn btn-primary px-4"
              onClick={verifyCertificate}
              disabled={certVerifyLoading}
            >
              {certVerifyLoading ? (
                <>
                  <Spinner
                    animation="border"
                    size="sm"
                    className="me-2"
                  />
                  Checking
                </>
              ) : (
                "Verify"
              )}
            </button>
          </InputGroup>

          {certVerifyState && (
            <div
              className={`mt-4 p-3 rounded-3 border ${
                certVerifyState.verified
                  ? "border-success bg-light"
                  : "border-danger bg-light"
              }`}
            >
              <div className="d-flex align-items-center gap-2 mb-2">
                <BsPatchCheckFill
                  size={20}
                  className={
                    certVerifyState.verified
                      ? "text-success"
                      : "text-danger"
                  }
                />

                <Badge
                  bg={certVerifyState.verified ? "success" : "danger"}
                >
                  {certVerifyState.verified
                    ? "Verified"
                    : "Not Verified"}
                </Badge>
              </div>

              <div
                className={
                  certVerifyState.verified
                    ? "text-success"
                    : "text-danger"
                }
              >
                {certVerifyState.message}
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}