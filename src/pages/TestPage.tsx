import React from 'react';

const TestPage = () => {
  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>
        🎉 Simple CRM is Working!
      </h1>
      <p style={{ color: '#666', fontSize: '18px' }}>
        If you can see this page, your Vite + React app is successfully deployed to GitHub Pages.
      </p>
      <div style={{ 
        marginTop: '30px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h3>Deployment Status: ✅ Success</h3>
        <p>Your app is now live at: <strong>https://ongani3.github.io</strong></p>
      </div>
    </div>
  );
};

export default TestPage;
