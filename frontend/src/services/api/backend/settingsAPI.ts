import api from "../client";

type Settings = {
    STORAGE_TYPE: "cloud" | "local";
};
export const getSettings = async () => {
    try {
        const response = await api.get<Settings>("/settings");
        return response.data.STORAGE_TYPE;
    } catch (error) {
        console.error("Could not fetch question settings", error);
    }
};