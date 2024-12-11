import React, { useEffect, useState } from "react";
import "./CloudDashboard.scss";
import { apiWithInterceptors } from "../../api";

interface CloudFile {
  id: number;
  userId: number;
  name: string;
  type: string;
  fileKey: string;
  url: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

const CloudDashboard: React.FC = () => {
  const [nickname] = useState(localStorage.getItem("nickname") || "");
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<CloudFile | null>(null);
  const [error, setError] = useState("");
  const [fileToUpload, setFileToUpload] = useState<globalThis.File | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const fetchData = async () => {
    try {
      const accessToken = localStorage.getItem("access_token");
      const getMetadata = await apiWithInterceptors.get(
        "http://localhost:1222/wizzcloud/content/metadata/list",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const filesData = getMetadata.data || [];

      const filesWithUrls = await Promise.all(
        filesData.map(async (file: CloudFile) => {
          
          //verifying if the file is cached in localStorage
          const cachedUrl = localStorage.getItem(file.fileKey);
          if (cachedUrl) {
            return { ...file, url: cachedUrl };
          }

          const fileResponse = await apiWithInterceptors.get(
            `http://localhost:1222/wizzcloud/content/bucket/file/${file.fileKey}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              responseType: "blob",
            }
          );

          const url = window.URL.createObjectURL(fileResponse.data);
          localStorage.setItem(file.fileKey, url); // Cahsing URL in localStorage
          return { ...file, url };
        })
      );

      setFiles(filesWithUrls);
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
    if (selectedFile?.url) {
      window.URL.revokeObjectURL(selectedFile.url);
    }
    setSelectedFile(null);
  };

  const handleDeleteFile = async (fileId: number) => {
    try {
      const accessToken = localStorage.getItem("access_token");
      await apiWithInterceptors.delete(
        `http://localhost:1222/wizzcloud/content/${fileId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setFiles(files.filter((file) => file.id !== fileId));
    } catch (error) {
      console.error("Failed to delete file:", error);
      setError("Failed to delete file");
    }
  };

  const handleDownloadFile = async (fileKey: string, fileName: string) => {
    try {
      const accessToken = localStorage.getItem("access_token");
      const response = await apiWithInterceptors.get(
        `http://localhost:1222/wizzcloud/content/bucket/file/${fileKey}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          responseType: "blob",
        }
      );

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
      event.target.value = "";
    }
  };

  const handleFileUpload = async () => {
    if (fileToUpload) {
      const formData = new FormData();
      formData.append("files", fileToUpload);

      setIsLoading(true);
      try {
        const accessToken = localStorage.getItem("access_token");
        const userId = JSON.parse(atob(accessToken!.split(".")[1])).userId;

        await apiWithInterceptors.post(
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
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCancelUpload = () => {
    setFileToUpload(null);
  };

  const handleLogout = async () => {
    try {
      const accessToken = localStorage.getItem("access_token");
      await apiWithInterceptors.post(
        "http://localhost:1222/wizzcloud/auth/logout",
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/signin";
    } catch (error) {
      console.error("Failed to log out:", error);
      setError("Failed to log out");
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account?")) {
      try {
        const accessToken = localStorage.getItem("access_token");
        const userId = JSON.parse(atob(accessToken!.split(".")[1])).userId;

        await apiWithInterceptors.delete(
          `http://localhost:1222/wizzcloud/user/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/signin";
      } catch (error) {
        console.error("Failed to delete account:", error);
        setError("Failed to delete account");
      }
    }
  };

  return (
    <div className="cloud-dashboard">
      <h1>Cloud Dashboard</h1>
      <p>Welcome, {nickname}!</p>
      {error && <p className="error">{error}</p>}
      <div
        className="hamburger-menu"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <div className="line"></div>
        <div className="line"></div>
        <div className="line"></div>
      </div>

      {isMenuOpen && (
        <div className="dropdown-menu">
          <button onClick={handleLogout}>Logout</button>
          <button onClick={handleDeleteAccount}>Delete Account</button>
        </div>
      )}
      <div className="upload-button">
        <label htmlFor="file-upload" className="custom-file-upload">
          +
        </label>
        <input id="file-upload" type="file" onChange={handleFileSelect} />
      </div>
      {fileToUpload && (
        <div className="file-upload-actions">
          <p>Selected file: {fileToUpload.name}</p>
          <button onClick={handleFileUpload} disabled={isLoading}>
            {isLoading ? "Uploading..." : "Upload"}
          </button>
          <button onClick={handleCancelUpload}>Cancel</button>
        </div>
      )}
      <div className="gallery">
        {files.length > 0 ? (
          files.map((file) => (
            <div key={file.fileKey} className="gallery-item">
              <img
                src={file.url}
                alt="file"
                onClick={() => handleOpenFile(file)}
                loading="lazy"
              />
              <div className="gallery-item-actions">
                <button
                  onClick={() => handleDownloadFile(file.fileKey, file.name)}
                >
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
            <button
              onClick={() =>
                handleDownloadFile(selectedFile.fileKey, selectedFile.name)
              }
            >
              Download
            </button>
            <button
              onClick={() => {
                handleDeleteFile(selectedFile.id);
                handleCloseFile();
              }}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudDashboard;
