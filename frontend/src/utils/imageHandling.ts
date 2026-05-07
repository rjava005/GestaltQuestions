import { questionAPIURL } from "../config/apiConfig";

export const imageUrl = (path: string) => {
  try {
    return `${questionAPIURL}${path.startsWith("/") ? "" : "/"}${path}`;
  } catch (error) {
    console.log(error);
  }
};
