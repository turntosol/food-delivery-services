import {
    getProfile,
    updateProfile,
    getAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
} from "../api/settingApi.js";

let currentAddresses = [];
let editingAddressId = null;


/* ================================
   INIT
================================ */

document.addEventListener("DOMContentLoaded", async () => {

    await loadProfile();
    await loadAddresses();

    setupAvatar();
    setupProfile();
    setupAddress();
    setupLogout();

});


/* ================================
   PROFILE
================================ */

async function loadProfile() {

    try {

        const profile = await getProfile();

        document.querySelector("#first-name").value =
            profile.first_name || "";

        document.querySelector("#last-name").value =
            profile.last_name || "";

        document.querySelector("#username").value =
            profile.username || "";

        document.querySelector("#email").value =
            profile.email || "";

        document.querySelector("#phone").value =
            profile.phone || "";


        const fullName =
            `${profile.first_name || ""} ${profile.last_name || ""}`
                .trim();


        document.querySelector("#profile-name").textContent =
            fullName || profile.username || "User";


        document.querySelector("#profile-username").textContent =
            `@${profile.username || ""}`;


        if (profile.avatar) {

            document.querySelector("#profile-avatar").src =
                profile.avatar;

        }

    } catch (error) {

        console.error("Failed to load profile:", error);

    }

}


function setupProfile() {

    const form =
        document.querySelector("#profile-form");


    form.addEventListener("submit", async (event) => {

        event.preventDefault();


        try {

            const formData = new FormData();

            formData.append(
                "first_name",
                document.querySelector("#first-name").value
            );

            formData.append(
                "last_name",
                document.querySelector("#last-name").value
            );

            formData.append(
                "phone",
                document.querySelector("#phone").value
            );


            const avatarInput =
                document.querySelector("#avatar-input");


            if (avatarInput.files.length > 0) {

                formData.append(
                    "avatar",
                    avatarInput.files[0]
                );

            }


            await updateProfile(formData);

            alert("Profile updated successfully.");

            await loadProfile();

        } catch (error) {

            console.error(error);

            alert("Failed to update profile.");

        }

    });

}


/* ================================
   AVATAR
================================ */

function setupAvatar() {

    const button =
        document.querySelector("#change-avatar-btn");

    const input =
        document.querySelector("#avatar-input");

    const preview =
        document.querySelector("#profile-avatar");


    button.addEventListener("click", () => {
        input.click();
    });


    input.addEventListener("change", () => {

        const file = input.files[0];

        if (!file) {
            return;
        }

        const imageUrl =
            URL.createObjectURL(file);

        preview.src = imageUrl;

    });

}


/* ================================
   ADDRESS
================================ */

async function loadAddresses() {

    try {

        currentAddresses =
            await getAddresses();

        renderAddresses();

    } catch (error) {

        console.error(
            "Failed to load addresses:",
            error
        );

    }

}


function renderAddresses() {

    const container =
        document.querySelector("#address-list");


    if (!currentAddresses.length) {

        container.innerHTML = `
            <div class="empty-address">
                <ion-icon name="location-outline"></ion-icon>
                <p>
                    You don't have any saved address yet.
                </p>
            </div>
        `;

        return;
    }


    container.innerHTML =
        currentAddresses.map(address => {

            return `
                <div class="address-item">

                    <div class="address-main">

                        <div class="address-icon">
                            <ion-icon name="location-outline"></ion-icon>
                        </div>

                        <div class="address-info">

                            <h3>
                                ${escapeHTML(address.receiver_name)}
                            </h3>

                            <p>
                                ${escapeHTML(address.phone)}
                            </p>

                            <p>
                                ${escapeHTML(address.address)}
                            </p>

                            ${
                                address.is_default
                                    ? `
                                        <span class="default-badge">
                                            Default
                                        </span>
                                    `
                                    : ""
                            }

                        </div>

                    </div>


                    <div class="address-actions">

                        ${
                            !address.is_default
                                ? `
                                    <button
                                        class="address-action"
                                        data-default="${address.id}"
                                        title="Set default"
                                    >
                                        <ion-icon name="checkmark-outline"></ion-icon>
                                    </button>
                                `
                                : ""
                        }

                        <button
                            class="address-action"
                            data-edit="${address.id}"
                            title="Edit"
                        >
                            <ion-icon name="create-outline"></ion-icon>
                        </button>

                        <button
                            class="address-action delete"
                            data-delete="${address.id}"
                            title="Delete"
                        >
                            <ion-icon name="trash-outline"></ion-icon>
                        </button>

                    </div>

                </div>
            `;

        }).join("");


    setupAddressActions();

}


/* ================================
   ADDRESS ACTIONS
================================ */

function setupAddressActions() {

    document.querySelectorAll(
        "[data-edit]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const id =
                    Number(button.dataset.edit);

                openEditAddress(id);

            }
        );

    });


    document.querySelectorAll(
        "[data-delete]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            async () => {

                const id =
                    Number(button.dataset.delete);

                await handleDeleteAddress(id);

            }
        );

    });


    document.querySelectorAll(
        "[data-default]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            async () => {

                const id =
                    Number(button.dataset.default);

                await handleSetDefault(id);

            }
        );

    });

}


/* ================================
   ADDRESS MODAL
================================ */

function setupAddress() {

    const modal =
        document.querySelector("#address-modal");


    const addButton =
        document.querySelector("#add-address-btn");


    const closeButton =
        document.querySelector("#close-address-btn");


    const cancelButton =
        document.querySelector("#cancel-address-btn");


    const form =
        document.querySelector("#address-form");


    addButton.addEventListener(
        "click",
        () => openAddAddress()
    );


    closeButton.addEventListener(
        "click",
        closeAddressModal
    );


    cancelButton.addEventListener(
        "click",
        closeAddressModal
    );


    modal.addEventListener(
        "click",
        event => {

            if (event.target === modal) {
                closeAddressModal();
            }

        }
    );


    form.addEventListener(
        "submit",
        handleAddressSubmit
    );

}


function openAddAddress() {

    editingAddressId = null;


    document.querySelector(
        "#address-modal-title"
    ).textContent = "Add Address";


    document.querySelector(
        "#receiver-name"
    ).value = "";


    document.querySelector(
        "#address-phone"
    ).value = "";


    document.querySelector(
        "#delivery-address"
    ).value = "";


    document.querySelector(
        "#address-default"
    ).checked = false;


    document.querySelector(
        "#address-modal"
    ).classList.add("show");

}


function openEditAddress(id) {

    const address =
        currentAddresses.find(
            item => item.id === id
        );


    if (!address) {
        return;
    }


    editingAddressId = id;


    document.querySelector(
        "#address-modal-title"
    ).textContent = "Edit Address";


    document.querySelector(
        "#receiver-name"
    ).value = address.receiver_name;


    document.querySelector(
        "#address-phone"
    ).value = address.phone;


    document.querySelector(
        "#delivery-address"
    ).value = address.address;


    document.querySelector(
        "#address-default"
    ).checked = address.is_default;


    document.querySelector(
        "#address-modal"
    ).classList.add("show");

}


function closeAddressModal() {

    document.querySelector(
        "#address-modal"
    ).classList.remove("show");

}


/* ================================
   ADDRESS SUBMIT
================================ */

async function handleAddressSubmit(event) {

    event.preventDefault();


    const data = {

        receiver_name:
            document.querySelector(
                "#receiver-name"
            ).value,

        phone:
            document.querySelector(
                "#address-phone"
            ).value,

        address:
            document.querySelector(
                "#delivery-address"
            ).value,

        is_default:
            document.querySelector(
                "#address-default"
            ).checked

    };


    try {

        if (editingAddressId) {

            await updateAddress(
                editingAddressId,
                data
            );

        } else {

            await createAddress(data);

        }


        closeAddressModal();

        await loadAddresses();

    } catch (error) {

        console.error(error);

        alert("Failed to save address.");

    }

}


/* ================================
   DELETE ADDRESS
================================ */

async function handleDeleteAddress(id) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this address?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await deleteAddress(id);

        await loadAddresses();

    } catch (error) {

        console.error(error);

        alert("Failed to delete address.");

    }

}


/* ================================
   DEFAULT ADDRESS
================================ */

async function handleSetDefault(id) {

    try {

        await setDefaultAddress(id);

        await loadAddresses();

    } catch (error) {

        console.error(error);

        alert("Failed to set default address.");

    }

}


/* ================================
   LOGOUT
================================ */

function setupLogout() {

    const button =
        document.querySelector("#logout-btn");

    if (!button) {
        return;
    }

    button.addEventListener("click", () => {

        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("current_user");

        window.location.href =
            "../auth/login.html";

    });

}


/* ================================
   ESCAPE HTML
================================ */

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}