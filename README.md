# ShareNear

A real-time file sharing and chat application built with React and Node.js.

## Features

- Create and join password-protected rooms
- Real-time chat messaging
- File sharing between users
- Dark/light theme toggle
- WebRTC-based peer-to-peer connections

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install server dependencies:
   ```bash
   cd server
   npm install
   ```

3. Install client dependencies:
   ```bash
   cd client
   npm install
   ```

### Development

1. Start the server:
   ```bash
   cd server
   npm start
   ```

2. Start the client (in a new terminal):
   ```bash
   cd client
   npm start
   ```

3. Open http://localhost:3000 in your browser

### Production Build

1. Build the client:
   ```bash
   cd client
   npm run build
   ```

2. Serve the built files with your preferred web server

### Environment Variables

Copy `.env.example` to `.env` and configure:

- `PORT`: Server port (default: 3001)
- `REACT_APP_SERVER_URL`: Server URL for client connections

## Deployment

The application is ready for deployment on platforms like:
- Heroku
- Vercel
- Netlify (client)
- Railway
- DigitalOcean

Make sure to set the appropriate environment variables for your deployment platform.