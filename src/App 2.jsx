import React, { useEffect, useMemo, useState } from 'react';
import layoutHtml from '../layout.html?raw';
import { initApp } from '../script.js';

const App = () => {
  const [initError, setInitError] = useState(null);
  const markup = useMemo(() => ({ __html: layoutHtml }), []);

  useEffect(() => {
    try {
      initApp();
    } catch (e) {
      console.error('Init error', e);
      setInitError(e.message || 'Unknown error');
    }
  }, []);

  return (
    <>
      <div dangerouslySetInnerHTML={markup} />
      {initError ? (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: '#e74c3c', color: '#fff', padding: '12px 16px', borderRadius: 8, zIndex: 9999 }}>
          Failed to init UI: {initError}
        </div>
      ) : null}
    </>
  );
};

export default App;
