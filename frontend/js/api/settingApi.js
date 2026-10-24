import { apiRequest } from "./api.js";

export async function getProfile() {

    return await apiRequest(
        "/account/profile/"
    );

}

export async function updateProfile(data) {
    return await apiRequest(
        "/account/profile/",
        {
            method: "PATCH",
            body: data
        }
    );
}

export async function changeAvatar(file) {
    const formData = new FormData();
    formData.append("avatar", file);

    return await apiRequest(
        "/account/change-avatar/",
        {
            method: "PATCH",
            body: formData
        }
    );
}

export async function getAddresses() {

    return await apiRequest(
        "/addresses/"
    );

}

export async function createAddress(
    data
) {
    return await apiRequest(
        "/addresses/",
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json"
            },
            body: JSON.stringify(data)
        }
    );

}

export async function updateAddress(
    id,
    data
) {
    return await apiRequest(
        `/addresses/${id}/`,
        {
            method: "PATCH",
            headers: {
                "Content-Type":
                    "application/json"
            },
            body: JSON.stringify(data)
        }
    );

}

export async function deleteAddress(
    id
) {
    return await apiRequest(
        `/addresses/${id}/`,
        {
            method: "DELETE"
        }
    );

}

export async function setDefaultAddress(
    id
) {
    return await apiRequest(
        `/addresses/${id}/default/`,
        {
            method: "PATCH"
        }
    );

}

export async function getSettings() {

    return await apiRequest(
        "/account/settings/"
    );

}

export async function updateSettings(
    data
) {
    return await apiRequest(
        "/account/settings/",
        {
            method: "PATCH",
            headers: {
                "Content-Type":
                    "application/json"
            },
            body: JSON.stringify(data)
        }
    );

}

export async function changePassword(data) {
    return await apiRequest("/account/change-password/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
}