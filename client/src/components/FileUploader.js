import React, { useState, useEffect } from 'react';

const FileUploader = ({ socket, roomId }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [receivedFiles, setReceivedFiles] = useState([]);

  useEffect(() => {
    if (socket) {
      socket.on('file-meta', (data) => {
        setReceivedFiles(prev => [...prev, { metadata: data.metadata, from: data.from }]);
      });
    }

    return () => {
      if (socket) {
        socket.off('file-meta');
      }
    };
  }, [socket]);

  const handleFileSelect = (event) => {
    setSelectedFiles(Array.from(event.target.files));
  };

  const shareFiles = () => {
    if (selectedFiles.length > 0 && socket) {
      selectedFiles.forEach(file => {
        const metadata = {
          name: file.name,
          size: file.size,
          type: file.type
        };
        socket.emit('file-meta', { metadata, roomId });
      });
      alert('Files shared successfully!');
    }
  };

  return (
    <div className="file-uploader">
      <h3>📁 File Sharing</h3>
      <div className="file-input-container">
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          className="file-input"
        />
      </div>
      <button 
        onClick={shareFiles} 
        disabled={selectedFiles.length === 0}
        className={`btn ${selectedFiles.length > 0 ? 'btn-primary' : ''}`}
      >
        Share {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
      </button>
      
      {receivedFiles.length > 0 && (
        <div className="received-files">
          <h4>📥 Received Files:</h4>
          {receivedFiles.map((file, index) => (
            <div key={index} className="file-item">
              <div className="file-name">{file.metadata.name}</div>
              <div className="file-meta">
                Size: {(file.metadata.size / 1024).toFixed(1)} KB • From: {file.from}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploader;