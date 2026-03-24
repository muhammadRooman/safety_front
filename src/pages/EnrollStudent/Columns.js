 "use client";
import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import { MdEdit, MdDelete } from "react-icons/md";
import { BsSendPlus } from "react-icons/bs";

const Columns = ({ handleEdit, handleDelete, handleProvideLink, onlineStudentIds = [] }) => [
  {
    name: "ID",
    cell: (row, index) => index + 1,
    width: "60px",
  },
  {
    name: "Name",
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
              backgroundColor: isOnline ? "#28a745" : "#dc3545", // green if online, red if offline
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
  },
  {
    name: "Phone",
    selector: (row) => row.phone,
  },
  {
    name: "Courses",
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
              backgroundColor: "#dc3545",
              color: "#fff",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "12px",
            }}
          >
            OHS Courses Academy
          </span>
        ) : (
          <span
            // className="blink-text"
            // style={{
            //   backgroundColor: "orange",
            //   color: "#fff",
            //   padding: "2px 6px",
            //   borderRadius: "4px",
            //   fontSize: "12px",
            // }}
          >
            No Course Assigned
          </span>
        )}
      </div>
    ),
  },

  {
    name: "Action",
    cell: (row) => (
      <div className="d-flex gap-2">
        {row.role === "teacher" ? (
          <div className="text-center w-100">
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Admin Role</Tooltip>}
            >
              <button className="btn btn-sm btn-warning px-4">Admin</button>
            </OverlayTrigger>
          </div>
        ) : (
          <>
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Edit Student</Tooltip>}
            >
              <button
                className="btn btn-sm btn-success btnn"
                onClick={() => handleEdit(row)}
              >
                <MdEdit size={25}  />
              </button>
            </OverlayTrigger>

            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Delete Student</Tooltip>}
            >
              <button
                className="btn btn-sm btn-danger"
                onClick={() => handleDelete(row)}
              >
               <MdDelete size={25} />
              </button>
            </OverlayTrigger>

            {/* ✅ Provide/Send Link Button with Tooltip */}
            <OverlayTrigger
              placement="top"
              overlay={
                <Tooltip>
                  {row.hasLink ?  "Sended Google Meet Link":  "Provide Google Meet Link"}
                </Tooltip>
              }
            >
              <button
                className={`btn btn-sm ${
                  row.hasLink ? "ee" : "btn-primary"
                }`}
                onClick={() => handleProvideLink(row)}
              >
                {row.hasLink ? <img src="/meet.png" alt="Provide Link" style={{ width: 28, height: 28 }} /> : <BsSendPlus size={25} /> }
              </button>
            </OverlayTrigger>
          </>
        )}
      </div>
    ),
  },
];

export default Columns;