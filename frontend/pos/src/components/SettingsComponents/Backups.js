import React, { useEffect, useState } from "react";
import BackupIcon from "@material-ui/icons/Backup";
import backupImg from "../../res/img/backupImg.png";
import CachedIcon from "@material-ui/icons/Cached";
import Swal from "sweetalert2";
import Moment from "react-moment";
import apis from "../../apis/apis";

const Backups = () => {
  const [latestBackup, setLatestBackup] = useState(null);
  const makeBackup = async () => {
    Swal.fire(
      "Backup successful",
      `system was backupped successfully`,
      "success"
    );
  };

  useEffect(() => {
    getLatestBackup();
  }, []);

  const getLatestBackup = async () => {
    let latest = await apis.backupApi.latest();
    setLatestBackup(latest);
  };

  return (
    <div className="container">
      <div class="card shadow">
        <div class="card-body">
          <h4>Backups</h4>
          <div className="d-flex justify-content-center align-items-center flex-column">
            <div className="w-50">
              <p className="text-center text m-0">
                Backups are saved in{" "}
                <strong>{latestBackup ? latestBackup.path : ""}</strong>
              </p>
            </div>
            <img
              src={backupImg}
              alt="backup image"
              style={{ width: 100, height: 100, margin: "2rem 0" }}
            />
            <button
              onClick={() => makeBackup()}
              className="btn btn-primary mb-3 "
            >
              <p className="m-0 d-flex justify-content-center align-items-center">
                <BackupIcon fontSize="large" />
                <span className="ml-2">Backup now</span>
              </p>
            </button>
            <p className="text d-flex justify-content-center align-items-center">
              {latestBackup ? (
                <>
                  <CachedIcon />{" "}
                  <span className="ml-2">
                    Last backup was on,{" "}
                    <Moment
                      date={new Date(latestBackup.created_at)}
                      format="ddd MMM DD, HH:mm"
                    />
                  </span>
                </>
              ) : (
                <>
                  <span className="ml-2">No backups have been made yet</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Backups;
