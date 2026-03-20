import axios from "axios";

const apiBase =
  import.meta.env.VITE_API_BASE_URL !== undefined
    ? import.meta.env.VITE_API_BASE_URL
    : "http://localhost:8000";

const api = axios.create({
  baseURL: apiBase,
});

export default api;

export function audioUrlFromFilePath(filePath) {
  if (!filePath) return "";
  const name = filePath.split(/[/\\]/).pop();
  const base =
    import.meta.env.VITE_API_BASE_URL !== undefined
      ? import.meta.env.VITE_API_BASE_URL
      : "http://localhost:8000";
  return `${base}/uploads/${name}`;
}
