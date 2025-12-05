import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { iceServers } from '../utils/webRTC';
import { QRCodeSVG } from 'qrcode.react';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const CHUNK_SIZE = 16384; // 16KB

const ShareRoom = () => {
  const { roomId } = useParams();
  const socket = useSocket();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState('Connecting...');
  const [file, setFile] = useState(null);
  const [transferProgress, setTransferProgress] = useState(0);
  const [receivedFiles, setReceivedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const peerConnection = useRef(null);
  const dataChannel = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    socket.emit('join-room', { code: roomId }, (response) => {
      if (response.error) {
        alert(response.error);
        navigate('/');
      } else {
        setUsers(response.users);
        setStatus('Waiting for peer...');
      }
    });

    socket.on('user-joined', ({ userId }) => {
      setUsers((prev) => [...prev, userId]);
      setStatus('Peer connected! Initializing connection...');
      createOffer(userId);
    });

    socket.on('user-left', ({ userId }) => {
      setUsers((prev) => prev.filter((id) => id !== userId));
      setStatus('Peer disconnected. Waiting...');
      cleanupConnection();
    });

    socket.on('signal', async ({ from, signal }) => {
      if (!peerConnection.current) {
        createPeerConnection(from);
      }
      
      try {
        if (signal.type === 'offer') {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await peerConnection.current.createAnswer();
          await peerConnection.current.setLocalDescription(answer);
          socket.emit('signal', { to: from, signal: answer });
        } else if (signal.type === 'answer') {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal));
        } else if (signal.candidate) {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(signal));
        }
      } catch (error) {
        console.error('Error handling signal:', error);
      }
    });

    return () => {
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('signal');
      cleanupConnection();
    };
  }, [socket, roomId, navigate]);

  const createPeerConnection = (targetUserId) => {
    peerConnection.current = new RTCPeerConnection(iceServers);

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('signal', { to: targetUserId, signal: event.candidate });
      }
    };

    peerConnection.current.ondatachannel = (event) => {
      setupDataChannel(event.channel);
    };

    peerConnection.current.onconnectionstatechange = () => {
      if (peerConnection.current.connectionState === 'connected') {
        setStatus('Connected via WebRTC! Ready to share.');
      }
    };
  };

  const createOffer = async (targetUserId) => {
    createPeerConnection(targetUserId);
    dataChannel.current = peerConnection.current.createDataChannel('file-transfer');
    setupDataChannel(dataChannel.current);

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);
    socket.emit('signal', { to: targetUserId, signal: offer });
  };

  const setupDataChannel = (channel) => {
    channel.onopen = () => {
      console.log('Data channel open');
    };

    let receivedBuffer = [];
    let receivedSize = 0;
    let currentFileInfo = null;

    channel.onmessage = (event) => {
      const data = event.data;

      if (typeof data === 'string') {
        const message = JSON.parse(data);
        if (message.type === 'file-start') {
          currentFileInfo = message;
          receivedBuffer = [];
          receivedSize = 0;
          setTransferProgress(0);
        } else if (message.type === 'file-end') {
          const blob = new Blob(receivedBuffer);
          const url = URL.createObjectURL(blob);
          setReceivedFiles((prev) => [...prev, { name: currentFileInfo.name, url, size: currentFileInfo.size }]);
          setTransferProgress(100);
          
          // Save metadata to Firestore
          if (currentUser) {
            addDoc(collection(db, 'transfers'), {
              userId: currentUser.uid,
              fileName: currentFileInfo.name,
              fileSize: currentFileInfo.size,
              type: 'received',
              timestamp: serverTimestamp()
            }).catch(err => console.error("Error saving metadata:", err));
          }

          currentFileInfo = null;
        }
      } else {
        receivedBuffer.push(data);
        receivedSize += data.byteLength;
        if (currentFileInfo) {
          setTransferProgress(Math.round((receivedSize / currentFileInfo.size) * 100));
        }
      }
    };
  };

  const cleanupConnection = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (dataChannel.current) {
      dataChannel.current.close();
      dataChannel.current = null;
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const sendFile = async () => {
    if (!file || !dataChannel.current || dataChannel.current.readyState !== 'open') return;

    dataChannel.current.send(JSON.stringify({
      type: 'file-start',
      name: file.name,
      size: file.size
    }));

    const fileReader = new FileReader();
    let offset = 0;

    fileReader.onload = (e) => {
      dataChannel.current.send(e.target.result);
      offset += e.target.result.byteLength;
      setTransferProgress(Math.round((offset / file.size) * 100));

      if (offset < file.size) {
        readSlice(offset);
      } else {
        dataChannel.current.send(JSON.stringify({ type: 'file-end' }));
        
        // Save metadata to Firestore
        if (currentUser) {
          addDoc(collection(db, 'transfers'), {
            userId: currentUser.uid,
            fileName: file.name,
            fileSize: file.size,
            type: 'sent',
            timestamp: serverTimestamp()
          }).catch(err => console.error("Error saving metadata:", err));
        }
      }
    };

    const readSlice = (o) => {
      const slice = file.slice(o, o + CHUNK_SIZE);
      fileReader.readAsArrayBuffer(slice);
    };

    readSlice(0);
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="glass-panel animate-fade-in" style={{ padding: '1rem 2rem', marginBottom: '2rem', display: 'inline-flex', alignItems: 'center', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Room Code</span>
          <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#818cf8', letterSpacing: '0.1em', lineHeight: 1 }}>{roomId}</span>
        </div>
        <div style={{ background: 'white', padding: '0.5rem', borderRadius: '0.5rem', height: '64px' }}>
          <QRCodeSVG value={window.location.href} size={64} />
        </div>
      </div>

      <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }} className="delay-100 animate-fade-in">{status}</p>
      
      <div className="glass-panel delay-200 animate-fade-in" style={{ padding: '2rem', width: '100%', maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>File Transfer</h3>
          <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(255,255,255,0.1)', borderRadius: '1rem', fontSize: '0.875rem' }}>
            {users.length} User{users.length !== 1 ? 's' : ''} Connected
          </span>
        </div>
        
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{ 
            marginTop: '1rem', 
            padding: '3rem', 
            border: `2px dashed ${isDragging ? '#818cf8' : 'var(--border-glass)'}`, 
            borderRadius: '1rem',
            backgroundColor: isDragging ? 'rgba(129, 140, 248, 0.1)' : 'transparent',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onClick={() => fileInputRef.current.click()}
        >
          <input type="file" onChange={handleFileSelect} ref={fileInputRef} style={{ display: 'none' }} />
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
          {file ? (
            <div>
              <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{file.name}</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{formatSize(file.size)}</p>
            </div>
          ) : (
            <div>
              <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Click or Drag file here</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Any file type, no size limit</p>
            </div>
          )}
        </div>

        <button 
          className="btn btn-primary" 
          onClick={sendFile} 
          disabled={!file || status !== 'Connected via WebRTC! Ready to share.'} 
          style={{ 
            marginTop: '2rem', 
            width: '100%',
            opacity: (!file || status !== 'Connected via WebRTC! Ready to share.') ? 0.5 : 1,
            cursor: (!file || status !== 'Connected via WebRTC! Ready to share.') ? 'not-allowed' : 'pointer'
          }}
        >
          Send File
        </button>

        {transferProgress > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span>Transferring...</span>
              <span>{transferProgress}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${transferProgress}%`, height: '100%', background: 'var(--primary-gradient)', transition: 'width 0.2s ease' }}></div>
            </div>
          </div>
        )}

        {receivedFiles.length > 0 && (
          <div style={{ marginTop: '3rem', textAlign: 'left' }}>
            <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>Received Files</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {receivedFiles.map((f, index) => (
                <li key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span>📎</span>
                    <div>
                      <div style={{ fontWeight: '500' }}>{f.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatSize(f.size)}</div>
                    </div>
                  </div>
                  <a href={f.url} download={f.name} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Download</a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareRoom;
