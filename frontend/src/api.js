import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3000",
});

// coloca o token automaticamente em toda requisição
// assim não precisa repetir localStorage.getItem em cada tela
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// se o token expirou (401), limpa e manda pro login
// em vez da tela ficar quebrada sem explicação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const ehLogin = error.config && error.config.url === "/login";
    if (error.response && error.response.status === 401 && !ehLogin) {
      localStorage.removeItem("token");
      alert("Sua sessão expirou. Faça login de novo.");
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;
