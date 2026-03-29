import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

export const fetchDashboard = async () => {
  const res = await axios.get(`${BASE_URL}/sessions/dashboard`);
  return res.data;
};

export const fetchHistory = async () => {
  const res = await axios.get(`${BASE_URL}/sessions/history`);
  return res.data;
};