# Sharenear

**Sharenear** is a real-time, privacy-focused file sharing platform that enables users to securely transfer large files (up to 10GB) between devices using QR codes or 6-digit codes. It supports both 1-to-1 (WebRTC) and 1-to-many (Socket.IO) connections with fallback support.

## 🌐 Tech Stack

- **Frontend**: React + Vite + UnoCSS
- **Backend**: Node.js + Express + Socket.IO
- **Storage (Optional)**: Firebase / MongoDB / S3
- **Features**: WebRTC, Socket.IO fallback, Chunked Upload, Realtime delivery

## 🚀 Features

- 🔐 Client-side encryption
- 📱 Multi-device support (Mobile/Desktop browsers)
- 📤 Drag and drop multiple files/folders
- 📡 QR Code & 6-digit code based sharing
- 📦 Chunked uploads with resumability
- 👥 Realtime user presence and chat
- ⏳ Auto-expiry and self-destruct options

## 📦 Installation

```bash
git clone https://github.com/your-username/Sharenear.git
cd Sharenear
npm install
npm run dev
