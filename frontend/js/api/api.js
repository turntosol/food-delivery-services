export const API_BASE_URL = "https://backend-food-delivery-services.onrender.com/api";

function parseErrorMessage(data, status) {
    if (!data) return `API Error: ${status}`;
    if (typeof data === "string") return data;
    if (data.detail) return data.detail;
    if (data.message) return data.message;

    if (typeof data === "object") {
        const firstKey = Object.keys(data)[0];
        if (firstKey) {
            const firstError = data[firstKey];
            if (Array.isArray(firstError) && firstError.length > 0) {
                return `${firstKey}: ${firstError[0]}`;
            }
            if (typeof firstError === "string") {
                return `${firstKey}: ${firstError}`;
            }
        }
    }

    return `API Error: ${status}`;
}

export async function apiRequest(
    endpoint,
    options = {},
    retry = true
) {
    const accessToken = localStorage.getItem("access_token");

    const headers = {
        ...(options.headers || {})
    };

    if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
    }

    if (options.body instanceof FormData) {
        delete headers["Content-Type"];
        delete headers["content-type"];
    }

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,
            headers
        }
    );

    if (response.status === 401 && retry) {
        const refreshed = await refreshAccessToken();

        if (refreshed) {
            return await apiRequest(
                endpoint,
                options,
                false
            );
        }

        logout();
        return;
    }

    // Response 204 No Content
    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get("content-type") || "";
    let responseData = null;

    try {
        if (contentType.includes("application/json")) {
            responseData = await response.json();
        } else {
            responseData = await response.text();
        }
    } catch (error) {
        console.error("Failed to read API response:", error);
        responseData = null;
    }

    if (!response.ok) {
        console.error("API Error:", response.status, responseData);

        const errorMessage = parseErrorMessage(responseData, response.status);
        const error = new Error(errorMessage);

        error.status = response.status;
        error.data = responseData;

        throw error;
    }

    return responseData;
}

async function refreshAccessToken() {
    const refreshToken = localStorage.getItem("refresh_token");

    if (!refreshToken) {
        return false;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/auth/refresh/`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    refresh: refreshToken
                })
            }
        );

        if (!response.ok) {
            return false;
        }

        const data = await response.json();

        localStorage.setItem("access_token", data.access);

        return true;
    } catch (error) {
        console.error("Refresh token error:", error);
        return false;
    }
}

function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("current_user");

    window.location.href = "/pages/auth/login.html";
}