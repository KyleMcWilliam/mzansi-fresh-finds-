import React from 'react';
import ReactDOM from 'react-dom/client'; // For React 18+
// import ReactDOM from 'react-dom'; // For React <18
import App from './App';
// import './bootstrap.min.css'; // Example: if using a Bootstrap CSS file
// import './index.css'; // Global styles

// Ensure the public/index.html has a div with id="root"
const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Failed to find the root element. Ensure your public/index.html has a <div id='root'></div>.");
}


// If using React < 18:
// ReactDOM.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
//   document.getElementById('root')
// );
