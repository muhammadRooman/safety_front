"use client";

import { MdEdit, MdDelete } from "react-icons/md";
import { BsSendPlus } from "react-icons/bs";

const Columns = ({ handleEdit, handleDelete, handleProvideLink, onlineStudentIds = [] }) => [
  // ==================== ID COLUMN HAT GAYA ====================
  
  {
    name: "Name",
    grow: 1.5,
    minWidth: "110px",
    cell: (row) => {
      const isOnline = onlineStudentIds.some(
        (id) => String(id) === String(row._id)
      );

      return (
        <div className="d-flex align-items-center gap-2">
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: isOnline ? "#28a745" : "#dc3545",
              boxShadow: `0 0 4px ${isOnline ? "rgba(40, 167, 69, 0.8)" : "rgba(220, 53, 69, 0.8)"}`,
            }}
          />
          <span>{row.name}</span>
        </div>
      );
    },
  },
  {
    name: "Email",
    selector: (row) => row.email,
    grow: 2,
    minWidth: "140px",
  },
  {
    name: "Phone",
    selector: (row) => row.phone,
    minWidth: "100px",
    grow: 0,
  },
  {
    name: "Courses",
    grow: 1.5,
    minWidth: "120px",
    wrap: true,
    cell: (row) => (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
        {row.subject && row.subject.length > 0 ? (
          row.subject.map((sub, index) => (
            <span
              key={index}
              style={{
                backgroundColor: "rgb(62 100 171)",
                color: "#fff",
                padding: "2px 6px",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              {sub}
            </span>
          ))
        ) : row.role === "teacher" ? (
          <span
            style={{
              backgroundColor: "#1dcc2b",
              color: "#fff",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "12px",
            }}
          >
            CEO Farooq Khan
          </span>
        ) : (
          <span>No Course Assigned</span>
        )}
      </div>
    ),
  },
  {
    name: "Video lang",
    width: "96px",
    minWidth: "88px",
    grow: 0,
    cell: (row) =>
      row.role === "teacher" ? (
        <span className="text-muted">—</span>
      ) : (
        <span className="text-capitalize">{row.videoLanguage || "English"}</span>
      ),
  },
  {
    name: "Action",
    button: true,
    grow: 0,
    minWidth: "148px",
    width: "160px",
    cell: (row) => (
      <div className="d-flex gap-2 align-items-center student-action-cell-inner">
        {row.role === "teacher" ? (
          <div className="text-center w-100">
            <button
              type="button"
              className="btn btn-sm btn-warning px-4 fw-bold text-dark"
              title="Admin Role"
              disabled
              style={{ opacity: 1, cursor: "not-allowed" }}
            >
              Supper Admin
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-sm btn-success student-table-action-btn"
              title="Edit Student"
              onClick={() => handleEdit(row)}
            >
              <MdEdit size={22} />
            </button>

            <button
              type="button"
              className="btn btn-sm btn-danger student-table-action-btn"
              title="Delete Student"
              onClick={() => handleDelete(row)}
            >
              <MdDelete size={22} />
            </button>

            <button
              type="button"
              className={`btn btn-sm student-table-action-btn ${
                row.hasLink ? "ee" : "btn-primary"
              }`}
              title={row.hasLink ? "Sended Google Meet Link" : "Provide Google Meet Link"}
              onClick={() => handleProvideLink(row)}
            >
              {row.hasLink ? (
                <img src="/meet.png" alt="" width={24} height={24} style={{ display: "block" }} />
              ) : (
                <BsSendPlus size={22} />
              )}
            </button>
          </>
        )}
      </div>
    ),
  },
];

export default Columns;