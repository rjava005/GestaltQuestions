import axios from "axios";
import { questionAPIURL, aiWorkspaceURL } from "../config";

axios.defaults.withCredentials = true;

const api = axios.create({
  baseURL: questionAPIURL,
});

export const aiApi = axios.create({
  baseURL: aiWorkspaceURL,
});

export default api;
