import { api } from "./api";
import { GOOGLE_CLIENT_ID } from "../utils/constants";

export const authService = {
  register: (payload) => api.post("/auth/register", payload).then((r) => r.data),
  login: (payload) => api.post("/auth/login", payload).then((r) => r.data),
  adminLogin: (payload) => api.post("/auth/admin-login", payload).then((r) => r.data),
  googleAuth: (payload) =>
    api
      .post("/auth/google", {
        ...payload,
        clientId: GOOGLE_CLIENT_ID
      })
      .then((r) => r.data)
};
