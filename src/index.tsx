import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

import 'jquery/dist/jquery.min.js';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';

import reportWebVitals from './reportWebVitals';
import AuthProvider from './store/AuthProvider';

// Put any other imports below so that CSS from your
// components takes precedence over default styles.

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
