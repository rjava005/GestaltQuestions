

import { createStore } from "zustand";
import type { ChatState, ChatStore } from "./types";
import ChatApi from "../ChatApi";
const initialState: ChatState = {
    theadId: null,
};

export function createChatStore(preloaded?: Partial<ChatState>) {
    return createStore<ChatStore>()((set) => ({
        ...preloaded, ...initialState,
        setThreadId: (val) => set({ theadId: val }),
        onThreadId: (val) => {
            console.log(val);
        },
        createdThread: async (token: string, threadId: string) => {
            try {
                const res = await ChatApi.createThreadId(token, threadId);
                return res;
            } catch (error) {
                throw new Error("Could not generate thread id");
            }
        },
        getUserThreads: async (token: string) => {
            try {
                return await ChatApi.getUserThreads(token);
            } catch (error) {
                throw new Error("Could not load user threads");
            }
        },
        getUserThreadMessages: async (token: string, threadId: string) => {
            try {
                return await ChatApi.getUserThreadMessages(token, threadId);
            } catch (error) {
                throw new Error("Could not load thread messages");
            }
        },
    }));
}
