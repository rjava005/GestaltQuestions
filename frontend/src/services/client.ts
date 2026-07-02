import axios from "axios";

import { questionAPIURL } from "../config/apiConfig";

axios.defaults.withCredentials = true;

const api = axios.create({
  baseURL: questionAPIURL,
});

export default api;
