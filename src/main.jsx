import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import AdminPage from "./AdminPage";
import "./index.css";

const path = window.location.pathname;

ReactDOM.createRoot(document.getElementById("root")).render(
  path === "/admin" ? <AdminPage /> : <App />
);