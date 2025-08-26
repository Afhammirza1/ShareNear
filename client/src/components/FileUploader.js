import React, { useState, useRef, useEffect, useCallback } from 'react';

const CHUNK_SIZE = 64 * 1024; // 64KB

const deriveKey = async (password, salt) => {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']);
    return window.crypto.subtle.deriveKey({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
};

const FileUploader = ({ socket, roomId, password, peerConnections }) => {
    const [files, setFiles] = useState([]); // { file: File, status: 'pending' | 'uploading' | 'paused' | 'done', progress: number }
    const fileInputRef = useRef(null);
    const folderInputRef = useRef(null);
    const [encryptionKey, setEncryptionKey] = useState(null);
    const fileDataBuffers = useRef({}); // { [fileName]: ArrayBuffer }
    const dataChannels = useRef({}); // { [userId]: RTCDataChannel }

    useEffect(() => {
        deriveKey(password, roomId).then(setEncryptionKey);
    }, [password, roomId]);

    const handleFileSelection = (e) => {
        const selectedFiles = Array.from(e.target.files).map(file => ({
            file,
            status: 'pending',
            progress: 0,
            path: file.webkitRelativePath || file.name
        }));
        setFiles(prev => [...prev, ...selectedFiles]);
    };

    const startFileTransfer = async (fileObj) => {
        if (Object.keys(peerConnections).length === 0) {
            alert("No other users in the room to send files to.");
            return;
        }
        if (!encryptionKey) {
            alert("Encryption key not ready. Please wait.");
            return;
        }

        setFiles(prev => prev.map(f => f.file.name === fileObj.file.name ? { ...f, status: 'uploading' } : f));
        
        const fileBuffer = await fileObj.file.arrayBuffer();
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encryptedFile = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, encryptionKey, fileBuffer);
        
        fileDataBuffers.current[fileObj.path] = encryptedFile;

        const metadata = {
            name: fileObj.path,
            size: encryptedFile.byteLength,
            type: fileObj.file.type,
            iv: Array.from(iv)
        };
        socket.emit('file-meta', { roomId, metadata });
    };

    const sendChunk = useCallback((fileName, index, userId) => {
        const encryptedFile = fileDataBuffers.current[fileName];
        if (!encryptedFile) return;

        const offset = index * CHUNK_SIZE;
        if (offset >= encryptedFile.byteLength) return;

        const chunk = encryptedFile.slice(offset, offset + CHUNK_SIZE);
        
        const pc = peerConnections[userId];
        if (!pc) return;

        if (!dataChannels.current[userId] || dataChannels.current[userId].readyState !== 'open') {
            dataChannels.current[userId] = pc.createDataChannel(`file-${fileName}`, { ordered: true });
        }
        
        const dc = dataChannels.current[userId];

        const send = () => {
            try {
                // We send an object with metadata to help the receiver
                const payload = JSON.stringify({ fileName, index, isLast: (offset + chunk.byteLength) >= encryptedFile.byteLength });
                const combinedData = new Blob([new TextEncoder().encode(payload), '\0', chunk]);
                
                combinedData.arrayBuffer().then(buffer => {
                    dc.send(buffer);
                    const progress = ((offset + chunk.byteLength) / encryptedFile.byteLength) * 100;
                    setFiles(prev => prev.map(f => f.path === fileName ? { ...f, progress } : f));
                });

            } catch (error) {
                console.error("Error sending chunk:", error);
            }
        };

        if (dc.readyState === 'open') {
            send();
        } else {
            dc.onopen = send;
        }
    }, [peerConnections]);

    useEffect(() => {
        const handleRequestChunk = ({ from, fileName, index }) => {
            sendChunk(fileName, index, from);
        };
        socket.on('request-chunk', handleRequestChunk);
        return () => socket.off('request-chunk', handleRequestChunk);
    }, [socket, sendChunk]);

    return (
        <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-4">Share Files</h3>
            <input type="file" multiple onChange={handleFileSelection} ref={fileInputRef} style={{ display: 'none' }} />
            <input type="file" multiple webkitdirectory="" directory="" onChange={handleFileSelection} ref={folderInputRef} style={{ display: 'none' }} />
            <div className="flex space-x-4 mb-4">
                <button onClick={() => fileInputRef.current.click()} className="w-full p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold transition-colors">Select Files</button>
                <button onClick={() => folderInputRef.current.click()} className="w-full p-3 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold transition-colors">Select Folder</button>
            </div>
            <div className="space-y-2">
                {files.map((fileObj, index) => (
                    <div key={index} className="p-2 border dark:border-gray-700 rounded">
                        <span>{fileObj.path} ({Math.round(fileObj.file.size / 1024)} KB)</span>
                        {fileObj.status === 'pending' && <button onClick={() => startFileTransfer(fileObj)} className="ml-4 px-3 py-1 bg-green-500 text-white rounded text-sm">Send</button>}
                        {fileObj.status !== 'pending' && (
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 mt-2">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${fileObj.progress}%` }}></div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FileUploader;

