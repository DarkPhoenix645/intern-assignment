const ROUTER_BOOK = {
  USER_AUTH: {
    REGISTER: { method: "POST", path: "/api/auth/register" },
    LOGIN: { method: "POST", path: "/api/auth/login" },
    GEN_OTP: { method: "POST", path: "/api/auth/gen-otp" },
    LOGIN_OTP: { method: "POST", path: "/api/auth/login-otp" },
    LOGOUT: { method: "POST", path: "/api/auth/logout" },
    GEN_RESET_OTP: { method: "POST", path: "/api/auth/gen-reset-otp" },
    RESET_PASSWORD: { method: "POST", path: "/api/auth/reset-password" },
    REFRESH_TOKEN: { method: "POST", path: "/api/auth/refresh" },
  },
  NOTES: {
    CREATE: { method: "POST", path: "/api/notes" },
    LIST: { method: "GET", path: "/api/notes" }, // optional query: ?q=searchTerm&tags=tag1,tag2
    GET_BY_ID: { method: "GET", path: "/api/notes/:id" },
    UPDATE_BY_ID: { method: "PUT", path: "/api/notes/:id" },
    DELETE_BY_ID: { method: "DELETE", path: "/api/notes/:id" },
  },
  BOOKMARKS: {
    CREATE: { method: "POST", path: "/api/bookmarks" },
    LIST: { method: "GET", path: "/api/bookmarks" }, // optional query: ?q=searchTerm&tags=tag1,tag2
    GET_BY_ID: { method: "GET", path: "/api/bookmarks/:id" },
    UPDATE_BY_ID: { method: "PUT", path: "/api/bookmarks/:id" },
    DELETE_BY_ID: { method: "DELETE", path: "/api/bookmarks/:id" },
  },
};

export default ROUTER_BOOK;
