import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const HistoryPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentUser) return;

      try {
        const q = query(
          collection(db, 'transfers'),
          where('userId', '==', currentUser.uid),
          orderBy('timestamp', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setHistory(data);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [currentUser]);

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 className="gradient-text" style={{ fontSize: '2rem' }}>Transfer History</h2>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>Back to Home</button>
      </div>

      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '800px', padding: '2rem' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading history...</p>
        ) : history.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No transfer history found.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {history.map((item) => (
              <li key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{item.type === 'sent' ? '⬆️' : '⬇️'}</span>
                  <div>
                    <div style={{ fontWeight: '500' }}>{item.fileName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {formatSize(item.fileSize)} • {new Date(item.timestamp?.toDate()).toLocaleString()}
                    </div>
                  </div>
                </div>
                <span style={{ 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '1rem', 
                  fontSize: '0.8rem', 
                  background: item.type === 'sent' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                  color: item.type === 'sent' ? '#34d399' : '#818cf8'
                }}>
                  {item.type === 'sent' ? 'Sent' : 'Received'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
