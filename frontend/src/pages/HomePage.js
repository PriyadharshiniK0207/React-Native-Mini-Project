import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './MasterScreen.css'; // Make sure this matches the correct path later if needed

const HomePage = () => {
  const { user, isAuthenticated } = useContext(AuthContext);

  return (
    <div className="master-screen">
      <div className="screen-header">
        <div>
          <h1>Welcome to TMS</h1>
          <p className="hero-subtitle">Complaint Management System</p>
        </div>
      </div>

      <div className="glass-panel">
        {isAuthenticated ? (
          <div className="welcome-section">
            <h2 style={{ fontSize: '24px', marginBottom: 'var(--space-2)', color: 'var(--text-main)' }}>
              Hello, {user?.username}!
            </h2>
            <p style={{ color: 'var(--accent-teal)', fontWeight: '600', marginBottom: 'var(--space-3)' }}>
              Role: {user?.role}
            </p>

            {user?.role === 'SuperAdmin' && (
              <div style={{
                background: 'rgba(155, 93, 229, 0.1)',
                borderLeft: '4px solid var(--highlight-lilac)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)'
              }}>
                <p style={{ color: 'var(--text-main)', fontWeight: '500', marginBottom: 'var(--space-2)' }}>
                  You have access to all master screens.
                </p>
                <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                  Navigate using the menu to manage:
                </p>
                <ul style={{
                  listStyle: 'none',
                  paddingLeft: 0,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: 'var(--space-2)',
                  marginTop: 'var(--space-2)'
                }}>
                  {['Departments', 'Programmes', 'Blocks', 'Rooms', 'Roles', 'Users'].map(item => (
                    <li key={item} style={{
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-main)',
                      fontSize: '14px'
                    }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '18px' }}>Please login to access the system</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
