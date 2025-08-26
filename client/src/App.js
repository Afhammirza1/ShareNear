import React, { useState } from 'react';
import Room from './components/Room';
import ThemeToggle from './components/ThemeToggle';

function App() {
  const [currentRoom, setCurrentRoom] = useState(null);

  return (
    <div className="App">
      <ThemeToggle />
      <Room 
        currentRoom={currentRoom} 
        setCurrentRoom={setCurrentRoom} 
      />
    </div>
  );
}

export default App;