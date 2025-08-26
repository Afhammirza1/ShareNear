import React, { useState, useEffect, useRef, useCallback } from 'react';
import FileUploader from './FileUploader';
import Chat from './Chat';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const CHUNK_SIZE = 16384; // 16KB chunks


const deriveKey = async (password, salt) => {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']);
  return window.crypto.subtle.deriveKey({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
};

const Room = ({ socket, roomId, password }) => {
  const [users, setUsers] = useState([]);
  const [receivedFiles, setReceivedFiles] = useState({}); // { [fileName]: { from, progress, isComplete, url, error, chunks: [] } }
  const peerConnections = useRef({});
  const [encryptionKey, setEncryptionKey] = useState(null);

  // Early return if socket is not available
  if (!socket) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px auto'
          }}></div>
          <p>Connecting to server...</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    deriveKey(password, roomId).then(setEncryptionKey);
  }, [password, roomId]);

  const handleDownloadAll = async () => {
    const zip = new JSZip();
    for (const fileName in receivedFiles) {
      const file = receivedFiles[fileName];
      if (file.isComplete && file.url) {
        const response = await fetch(file.url);
        const blob = await response.blob();
        zip.file(fileName, blob);
      }
    }
    zip.generateAsync({ type: 'blob' }).then(content => {
      saveAs(content, `sharenear_${roomId}.zip`);
    });
  };

  const processReceivedChunk = useCallback(async (data, from) => {
    const separatorIndex = data.indexOf(0);
    const metadataStr = new TextDecoder().decode(data.slice(0, separatorIndex));
    const chunk = data.slice(separatorIndex + 1);
    const { fileName, index, isLast } = JSON.parse(metadataStr);

    const fileState = receivedFiles[fileName];
    if (!fileState) return;

    fileState.chunks[index] = chunk;
    const receivedSize = fileState.chunks.reduce((acc, c) => acc + (c ? c.byteLength : 0), 0);
    const progress = (receivedSize / fileState.size) * 100;

    setReceivedFiles(prev => ({ ...prev, [fileName]: { ...prev[fileName], progress } }));

    if (!isLast) {
      socket.emit('request-chunk', { to: from, fileName, index: index + 1 });
    } else {
      // Check if all chunks are received
      const allChunksReceived = fileState.chunks.length === Math.ceil(fileState.size / CHUNK_SIZE);
      if (allChunksReceived) {
        console.log(`File ${fileName} received completely.`);
        const orderedChunks = [];
        for (let i = 0; i < fileState.chunks.length; i++) {
          orderedChunks.push(fileState.chunks[i]);
        }
        const encryptedBlob = new Blob(orderedChunks);
        const encryptedBuffer = await encryptedBlob.arrayBuffer();

        try {
          const decryptedBuffer = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv: fileState.iv }, encryptionKey, encryptedBuffer);
          const decryptedBlob = new Blob([decryptedBuffer], { type: fileState.type });
          const url = URL.createObjectURL(decryptedBlob);
          setReceivedFiles(prev => ({ ...prev, [fileName]: { ...prev[fileName], url, isComplete: true } }));
        } catch (error) {
          console.error("Decryption failed:", error);
          setReceivedFiles(prev => ({ ...prev, [fileName]: { ...prev[fileName], error: "Decryption failed. Check password." } }));
        }
      }
    }
  }, [receivedFiles, encryptionKey, socket]);

  const createPeerConnection = useCallback((userId, initiator = false) => {
    if (peerConnections.current[userId]) return peerConnections.current[userId];
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

    pc.onicecandidate = (event) => {
      if (event.candidate) socket.emit('ice-candidate', { to: userId, candidate: event.candidate });
    };

    pc.ondatachannel = (event) => {
      event.channel.onmessage = (e) => processReceivedChunk(e.data, userId);
    };

    peerConnections.current[userId] = pc;
    setUsers(prev => [...new Set([...prev, userId])]);

    if (initiator) {
      pc.createOffer().then(offer => pc.setLocalDescription(offer)).then(() => {
        socket.emit('offer', { to: userId, sdp: pc.localDescription });
      });
    }
    return pc;
  }, [socket, processReceivedChunk]);

  useEffect(() => {
    if (!socket) return;

    const handleUserJoined = ({ userId, users: allUsers }) => {
      setUsers(allUsers.filter(id => id !== socket.id));
      createPeerConnection(userId, true);
    };
    const handleOffer = (data) => {
      const pc = createPeerConnection(data.from);
      pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
        .then(() => pc.createAnswer()).then(answer => pc.setLocalDescription(answer))
        .then(() => socket.emit('answer', { to: data.from, sdp: pc.localDescription }));
    };
    const handleAnswer = (data) => {
      const pc = peerConnections.current[data.from];
      if (pc) pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
    };
    const handleIceCandidate = (data) => {
      const pc = peerConnections.current[data.from];
      if (pc) pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    };
    const handleFileMeta = ({ metadata, from }) => {
      setReceivedFiles(prev => ({
        ...prev,
        [metadata.name]: {
          from,
          size: metadata.size,
          type: metadata.type,
          iv: new Uint8Array(metadata.iv),
          progress: 0,
          isComplete: false,
          url: null,
          error: null,
          chunks: new Array(Math.ceil(metadata.size / CHUNK_SIZE))
        }
      }));
      socket.emit('request-chunk', { to: from, fileName: metadata.name, index: 0 });
    };
    const handleUserLeft = (userId) => {
      if (peerConnections.current[userId]) {
        peerConnections.current[userId].close();
        delete peerConnections.current[userId];
      }
      setUsers(prev => prev.filter(id => id !== userId));
    };

    socket.on('user-joined', handleUserJoined);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('file-meta', handleFileMeta);
    socket.on('user-left', handleUserLeft);

    return () => {
      socket.off('user-joined'); socket.off('offer'); socket.off('answer');
      socket.off('ice-candidate'); socket.off('file-meta'); socket.off('user-left');
      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};
    };
  }, [socket, createPeerConnection]);

  return (
    <div className="room-grid">
      <div>
        <FileUploader socket={socket} roomId={roomId} password={password} peerConnections={peerConnections.current} />
        <div className="file-uploader" style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>📥 Received Files</h3>
            <button
              onClick={handleDownloadAll}
              className="btn btn-primary"
              style={{ width: 'auto', padding: '8px 16px', fontSize: '14px' }}
            >
              Download All as ZIP
            </button>
          </div>
          {Object.keys(receivedFiles).length === 0 && <p>No files received yet.</p>}
          <div>
            {Object.entries(receivedFiles).map(([fileName, file]) => (
              <div key={fileName} className="file-item">
                <p>From: {file.from.substring(0, 6)}...</p>
                <p className="file-name">{fileName}</p>
                {file.error && <p style={{ color: '#e74c3c' }}>{file.error}</p>}
                {!file.isComplete && !file.error ? (
                  <div style={{
                    width: '100%',
                    backgroundColor: '#ecf0f1',
                    borderRadius: '10px',
                    height: '10px',
                    marginTop: '8px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      backgroundColor: '#27ae60',
                      height: '100%',
                      borderRadius: '10px',
                      width: `${file.progress}%`,
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                ) : (
                  !file.error && <a href={file.url} download={fileName} style={{ color: '#3498db', textDecoration: 'underline' }}>Download</a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div>
        <div className="file-uploader" style={{ marginBottom: '20px' }}>
          <h3>👥 Connected Users</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ fontWeight: 'bold', marginBottom: '8px' }}>You: {socket?.id?.substring(0, 6) || 'Connecting...'}...</li>
            {users.map(user => <li key={user} style={{ marginBottom: '4px' }}>{user.substring(0, 6)}...</li>)}
          </ul>
        </div>
        <Chat socket={socket} roomId={roomId} />
      </div>
    </div>
  );
};

export default Room;
