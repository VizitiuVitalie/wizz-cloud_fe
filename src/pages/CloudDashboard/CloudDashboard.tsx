import React, { useEffect, useState } from "react";
import axios from "axios";
import "./CloudDashboard.scss";

interface CloudFile {
  id: number;
  userId: number;
  type: string;
  url: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

const CloudDashboard: React.FC = () => {
  const [nickname, setNickname] = useState(
    localStorage.getItem("nickname") || ""
  );
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<CloudFile | null>(null);
  const [error, setError] = useState("");
  const [fileToUpload, setFileToUpload] = useState<globalThis.File | null>(
    null
  );

  const fetchData = async () => {
    try {
      const accessToken = localStorage.getItem("access_token");
      const response = await axios.get(
        "http://localhost:1222/wizzcloud/content/list",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      console.log("Server response:", response.data);
      setFiles(response.data || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setError("Failed to fetch data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenFile = (file: CloudFile) => {
    setSelectedFile(file);
  };

  const handleCloseFile = () => {
    setSelectedFile(null);
  };

  const handleDeleteFile = async (fileId: number) => {
    try {
      const accessToken = localStorage.getItem("access_token");
      await axios.delete(`http://localhost:1222/wizzcloud/content/${fileId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setFiles(files.filter((file) => file.id !== fileId));
    } catch (error) {
      console.error("Failed to delete file:", error);
      setError("Failed to delete file");
    }
  };

  const handleDownloadFile = async (fileId: number) => {
    try {
      const accessToken = localStorage.getItem("access_token");
      const response = await axios.get(
        `http://localhost:1222/wizzcloud/content/download/${fileId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          responseType: "blob",
        }
      );

      const contentDisposition = response.headers["content-disposition"];
      const fileName = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
        : `file_${fileId}`;

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download file:", error);
      setError("Failed to download file");
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setFileToUpload(file);
    }
  };

  const handleFileUpload = async () => {
    if (fileToUpload) {
      const formData = new FormData();
      formData.append("files", fileToUpload);

      try {
        const accessToken = localStorage.getItem("access_token");
        const userId = JSON.parse(atob(accessToken!.split(".")[1])).userId;

        await axios.post(
          `http://localhost:1222/wizzcloud/content/${userId}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        setFileToUpload(null);

        await fetchData();
      } catch (error) {
        console.error("Failed to upload file:", error);
        setError("Failed to upload file");
      }
    }
  };

  const handleCancelUpload = () => {
    setFileToUpload(null);
  };

  return (
    <div className="cloud-dashboard">
      <h1>Cloud Dashboard</h1>
      <p>Welcome, {nickname}!</p>
      {error && <p className="error">{error}</p>}
      <div className="upload-button">
        <label htmlFor="file-upload" className="custom-file-upload">
          +
        </label>
        <input id="file-upload" type="file" onChange={handleFileSelect} />
      </div>
      {fileToUpload && (
        <div className="file-upload-actions">
          <p>Selected file: {fileToUpload.name}</p>
          <button onClick={handleFileUpload}>Upload</button>
          <button onClick={handleCancelUpload}>Cancel</button>
        </div>
      )}
      <div className="gallery">
        {files.length > 0 ? (
          files.map((file) => (
            <div key={file.id} className="gallery-item">
              <img
                src={file.url}
                alt="file"
                onClick={() => handleOpenFile(file)}
              />
              <div className="gallery-item-actions">
                <button onClick={() => handleDownloadFile(file.id)}>
                  Download
                </button>
                <button onClick={() => handleDeleteFile(file.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No files found</p>
        )}
      </div>
      {selectedFile && (
        <div className="modal">
          <span className="close" onClick={handleCloseFile}>
            &times;
          </span>
          <img className="modal-content" src={selectedFile.url} alt="file" />
          <div className="modal-actions">
            <button onClick={() => handleDownloadFile(selectedFile.id)}>
              Download
            </button>
            <button onClick={() => handleDeleteFile(selectedFile.id)}>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudDashboard;
