import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Reset CSS básico
const style = document.createElement('style');
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #f4f7fb; }
  input:focus, select:focus, textarea:focus { outline: none; border-color: #005599 !important; box-shadow: 0 0 0 3px rgba(0,85,153,0.12); }
  a { color: inherit; }
  button { font-family: inherit; }
`;
document.head.appendChild(style);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);