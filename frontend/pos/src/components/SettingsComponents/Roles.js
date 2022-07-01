import React, { useEffect, useState } from "react";
import ReactTable from "react-table-v6";
import "react-table-v6/react-table.css";
import apis from "../../apis/apis";
import Swal from "sweetalert2";

export default function Roles() {
  const [role, setRole] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function getRoles() {
      setIsLoading(false);

      try {
        let res = await apis.roleApi.roles();

        setRole(res);
        setIsLoading(false);
      } catch (e) {
        setIsLoading(false);
        Swal.fire({
          icon: "error",
          title: "error",
          text: e.message,
        });
      }
    }

    getRoles();
  }, []);

  return (
    <div className="roles__container">
      {isLoading ? (
        <div class="d-flex justify-content-center align-items-center">
          <div
            class="spinner-border"
            style={{ width: "3rem", height: "3rem", color: "#2980B9" }}
            role="status"
          >
            <span class="sr-only">Loading...</span>
          </div>
        </div>
      ) : (
        <ReactTable
          showPagination={false}
          minRows={0}
          data={role}
          defaultPageSize={10}
          style={{ textAlign: "center" }}
          loadingText="Loading Products ..."
          className="-highlight -striped rt-rows-height ReactTable"
          columns={[
            {
              Header: "Role Name",
              accessor: "name",
            },
            {
              Header: "Role Description",
              accessor: "description",
            },
          ]}
        />
      )}
    </div>
  );
}
