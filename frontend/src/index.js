import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// se quiser medir performance da aplicação, passa uma função
// pra logar os resultados (ex: reportWebVitals(console.log))
// ou manda pra um endpoint de analytics. mais infos: https://bit.ly/CRA-vitals
reportWebVitals();
