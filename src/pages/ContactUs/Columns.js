import { Button } from "react-bootstrap";

export default function Columns({ handleEdit, handleDelete }) {
  return [
    {
      name: "Name",
      selector: (row) => row.name,
      sortable: true,
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
      name: "Message",
      selector: (row) => row.message,
    },
    {
      name: "Action",
      cell: (row) => (
        <>
         
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDelete(row)}
          >
            Delete
          </Button>
        </>
      ),
    },
  ];
}
