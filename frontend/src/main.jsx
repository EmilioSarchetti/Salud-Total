import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
<<<<<<< HEAD
//import './index.css'
import App from './App.jsx'
=======
import App from "./App.jsx";
import './styles.css';
>>>>>>> 316f8a7ba45d30582304a1b1663ebff3e3f72e9d


createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);