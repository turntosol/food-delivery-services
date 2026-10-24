import {
    getProfile,
    updateProfile,
    changeAvatar,
    getAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getSettings,
    updateSettings,
    changePassword
} from "../api/settingApi.js";

import {
    logoutUser
} from "../api/authApi.js";


// ==================================================
// STATE
// ==================================================

let currentAddresses = [];
let editingAddressId = null;


// ==================================================
// INITIALIZE
// ==================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadProfile();

        await loadAddresses();

        await loadSettings();

        setupProfile();

        setupAddress();

        setupNotifications();

        setupPassword();

        setupLogout();
    }
);


// ==================================================
// PROFILE
// ==================================================

async function loadProfile() {
    try {
        const profile = await getProfile();
        console.log("Profile data from API:", profile); 

        const avatarPreview = document.querySelector("#avatar-preview");

        const avatarUrl = profile.avatar_url || profile.avatar;

        if (avatarPreview && avatarUrl) {
            avatarPreview.src = `${avatarUrl}?t=${new Date().getTime()}`;
        }

        if (document.querySelector("#first-name")) {
            document.querySelector("#first-name").value = profile.first_name || "";
        }
        if (document.querySelector("#last-name")) {
            document.querySelector("#last-name").value = profile.last_name || "";
        }
        if (document.querySelector("#username")) {
            document.querySelector("#username").value = profile.username || "";
        }
        if (document.querySelector("#email")) {
            document.querySelector("#email").value = profile.email || "";
        }
        if (document.querySelector("#phone")) {
            document.querySelector("#phone").value = profile.phone || "";
        }

        const currentUser = JSON.parse(localStorage.getItem("current_user") || "{}");
        localStorage.setItem(
            "current_user",
            JSON.stringify({
                ...currentUser,
                ...profile,
                avatar: avatarUrl,
                avatar_url: avatarUrl
            })
        );
    } catch (error) {
        console.error("Error loading profile:", error);
    }
}


async function handleAvatarChange(file) {
    if (!file) return;

    // 1. Kiểm tra định dạng ảnh cho phép
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
        showMessage("Vui lòng chọn định dạng file JPG, PNG hoặc WEBP.", "error");
        return;
    }

    // 2. Kiểm tra dung lượng (Max 5MB = 5 * 1024 * 1024 bytes)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        showMessage("Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh khác.", "error");
        return;
    }

    const avatarPreview = document.querySelector("#avatar-preview");
    const oldAvatarSrc = avatarPreview ? avatarPreview.src : null;

    // 3. Preview tạm thời trên giao diện
    if (avatarPreview) {
        avatarPreview.src = URL.createObjectURL(file);
    }

    try {
        // 4. Gọi API upload
        const updatedProfile = await changeAvatar(file);

        // 5. Cập nhật ảnh chính thức từ URL backend trả về
        const newAvatarUrl = updatedProfile.avatar;
        if (avatarPreview && newAvatarUrl) {
            avatarPreview.src = newAvatarUrl;
        }

        // 6. Đồng bộ vào localStorage
        const currentUser = JSON.parse(
            localStorage.getItem("current_user") || "{}"
        );
        localStorage.setItem(
            "current_user",
            JSON.stringify({
                ...currentUser,
                avatar: newAvatarUrl || currentUser.avatar,
            })
        );

        showMessage("Cập nhật ảnh đại diện thành công.", "success");

    } catch (error) {
        console.error("Lỗi cập nhật avatar:", error);

        // Phục hồi lại ảnh cũ nếu xảy ra lỗi
        if (avatarPreview && oldAvatarSrc) {
            avatarPreview.src = oldAvatarSrc;
        }

        showMessage(
            error.message || "Không thể cập nhật ảnh đại diện.",
            "error"
        );
    }
}

// ==================================================
// PROFILE UPDATE
// ==================================================

function setupProfile() {
    const profileForm = document.getElementById("profile-form");
    const avatarInput = document.getElementById("avatar");

    // ==========================================
    // LẮNG NGHE SỰ KIỆN ĐỔI AVATAR TỰ ĐỘNG
    // ==========================================
    avatarInput?.addEventListener("change", async (event) => {
        const file = event.target.files[0];
        if (file) {
            await handleAvatarChange(file);
            // Reset input để có thể chọn lại cùng 1 file nếu vừa tải thất bại
            avatarInput.value = "";
        }
    });

    if (!profileForm) return;

    // ==========================================
    // LƯU THÔNG TIN CÁ NHÂN (TEXT FIELDS)
    // ==========================================
    profileForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData();
        formData.append(
            "first_name",
            document.getElementById("first-name").value.trim()
        );
        formData.append(
            "last_name",
            document.getElementById("last-name").value.trim()
        );
        formData.append(
            "phone",
            document.getElementById("phone").value.trim()
        );

        try {
            const profile = await updateProfile(formData);

            const currentUser = JSON.parse(
                localStorage.getItem("current_user") || "{}"
            );

            localStorage.setItem(
                "current_user",
                JSON.stringify({
                    ...currentUser,
                    ...profile
                })
            );

            showMessage("Profile updated successfully.", "success");

        } catch (error) {
            console.error("Update profile error:", error);
            showMessage(
                error.message || "Failed to update profile.",
                "error"
            );
        }
    });
}
// ==================================================
// ADDRESS
// ==================================================

async function loadAddresses() {

    try {

        currentAddresses =
            await getAddresses();

        renderAddresses();

    } catch (error) {

        console.error(
            "Error loading addresses:",
            error
        );
    }
}


function renderAddresses() {

    const addressList =
        document.querySelector(
            "#address-list"
        );

    if (!addressList) return;

    addressList.innerHTML = "";


    if (currentAddresses.length === 0) {

        addressList.innerHTML = `
            <div class="empty-address">
                <p>No delivery address found.</p>
            </div>
        `;

        return;
    }


    currentAddresses.forEach(
        address => {

            const card =
                document.createElement("div");

            card.classList.add(
                "address-card"
            );


            card.innerHTML = `

                <div class="address-info">

                    <div class="address-header">

                        <h4>
                            ${escapeHTML(
                                address.receiver_name
                            )}
                        </h4>

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


                    <p>
                        <ion-icon
                            name="call-outline">
                        </ion-icon>

                        ${escapeHTML(
                            address.phone
                        )}
                    </p>


                    <p>
                        <ion-icon
                            name="location-outline">
                        </ion-icon>

                        ${escapeHTML(
                            address.address
                        )}
                    </p>

                </div>


                <div class="address-actions">

                    <button
                        class="edit-address"
                        data-id="${address.id}">
                        Edit
                    </button>


                    <button
                        class="delete-address"
                        data-id="${address.id}">
                        Delete
                    </button>


                    ${
                        !address.is_default
                            ? `
                                <button
                                    class="default-address"
                                    data-id="${address.id}">
                                    Set as Default
                                </button>
                              `
                            : ""
                    }

                </div>

            `;


            addressList.appendChild(card);
        }
    );


    setupAddressButtons();
}


// ==================================================
// ADDRESS BUTTONS
// ==================================================

function setupAddressButtons() {

    const editButtons =
        document.querySelectorAll(
            ".edit-address"
        );

    editButtons.forEach(
        button => {

            button.onclick = function () {

                const id =
                    Number(
                        this.dataset.id
                    );

                openEditAddress(id);
            };
        }
    );


    const deleteButtons =
        document.querySelectorAll(
            ".delete-address"
        );

    deleteButtons.forEach(
        button => {

            button.onclick = async function () {

                const id =
                    Number(
                        this.dataset.id
                    );

                await handleDeleteAddress(id);
            };
        }
    );


    const defaultButtons =
        document.querySelectorAll(
            ".default-address"
        );

    defaultButtons.forEach(
        button => {

            button.onclick = async function () {

                const id =
                    Number(
                        this.dataset.id
                    );

                await handleSetDefaultAddress(
                    id
                );
            };
        }
    );
}


// ==================================================
// ADDRESS SETUP
// ==================================================

function setupAddress() {

    const addButton =
        document.querySelector(
            "#add-address-btn"
        );

    if (addButton) {

        addButton.onclick = function () {

            openAddAddress();
        };
    }


    const cancelButton =
        document.querySelector(
            "#cancel-address-btn"
        );

    if (cancelButton) {

        cancelButton.onclick = function () {

            closeAddressModal();
        };
    }


    const form =
        document.querySelector(
            "#address-form"
        );

    if (form) {

        form.addEventListener(
            "submit",
            handleAddressSubmit
        );
    }
}


// ==================================================
// ADD ADDRESS
// ==================================================

function openAddAddress() {

    editingAddressId = null;


    const modal =
        document.querySelector(
            "#address-modal"
        );

    if (!modal) return;


    const title =
        document.querySelector(
            "#address-modal-title"
        );

    if (title) {

        title.textContent =
            "Add New Address";
    }


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


    modal.classList.add("active");
}


// ==================================================
// EDIT ADDRESS
// ==================================================

function openEditAddress(id) {

    const address =
        currentAddresses.find(
            item => item.id === id
        );

    if (!address) return;


    editingAddressId = id;


    const modal =
        document.querySelector(
            "#address-modal"
        );

    if (!modal) return;


    const title =
        document.querySelector(
            "#address-modal-title"
        );

    if (title) {

        title.textContent =
            "Edit Address";
    }

    const closeAddressBtn = document.getElementById("close-address-btn");

    closeAddressBtn?.addEventListener("click", () => {
        const modal =
            document.getElementById("address-modal");

        modal?.classList.remove("active");
    });


    document.querySelector(
        "#receiver-name"
    ).value =
        address.receiver_name || "";


    document.querySelector(
        "#address-phone"
    ).value =
        address.phone || "";


    document.querySelector(
        "#delivery-address"
    ).value =
        address.address || "";


    document.querySelector(
        "#address-default"
    ).checked =
        address.is_default;


    modal.classList.add("active");
}


// ==================================================
// ADDRESS SUBMIT
// ==================================================

async function handleAddressSubmit(event) {

    event.preventDefault();


    const receiverName =
        document.querySelector(
            "#receiver-name"
        ).value.trim();


    const phone =
        document.querySelector(
            "#address-phone"
        ).value.trim();


    const address =
        document.querySelector(
            "#delivery-address"
        ).value.trim();


    const isDefault =
        document.querySelector(
            "#address-default"
        ).checked;


    const data = {

        receiver_name:
            receiverName,

        phone:
            phone,

        address:
            address,

        is_default:
            isDefault
    };


    try {

        if (editingAddressId) {

            await updateAddress(
                editingAddressId,
                data
            );

            showMessage(
                "Address updated successfully.",
                "success"
            );

        } else {

            await createAddress(data);

            showMessage(
                "Address added successfully.",
                "success"
            );
        }


        closeAddressModal();

        await loadAddresses();

    } catch (error) {

        console.error(
            "Error saving address:",
            error
        );

        showMessage(
            "Failed to save address.",
            "error"
        );
    }
}


// ==================================================
// DELETE ADDRESS
// ==================================================

async function handleDeleteAddress(id) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this address?"
        );


    if (!confirmed) return;


    try {

        await deleteAddress(id);

        showMessage(
            "Address deleted successfully.",
            "success"
        );

        await loadAddresses();

    } catch (error) {

        console.error(
            "Error deleting address:",
            error
        );

        showMessage(
            "Failed to delete address.",
            "error"
        );
    }
}


// ==================================================
// SET DEFAULT ADDRESS
// ==================================================

async function handleSetDefaultAddress(id) {

    try {

        await setDefaultAddress(id);

        showMessage(
            "Default address updated.",
            "success"
        );

        await loadAddresses();

    } catch (error) {

        console.error(
            "Error setting default address:",
            error
        );

        showMessage(
            "Failed to set default address.",
            "error"
        );
    }
}


// ==================================================
// CLOSE ADDRESS MODAL
// ==================================================

function closeAddressModal() {

    const modal =
        document.querySelector(
            "#address-modal"
        );

    if (!modal) return;

    modal.classList.remove("active");

    editingAddressId = null;
}


// ==================================================
// SETTINGS
// ==================================================

    async function loadSettings() {

        try {

            const settings = await getSettings();

            const emailCheckbox =
                document.querySelector(
                    "#email-notifications"
                );

            const orderCheckbox =
                document.querySelector(
                    "#order-notifications"
                );

            const promotionalCheckbox =
                document.querySelector(
                    "#promotional-notifications"
                );


            if (emailCheckbox) {
                emailCheckbox.checked =
                    settings.email_notifications;
            }


            if (orderCheckbox) {
                orderCheckbox.checked =
                    settings.order_notifications;
            }


            if (promotionalCheckbox) {
                promotionalCheckbox.checked =
                    settings.promotional_notifications;
            }

        } catch (error) {

            console.error(
                "Failed to load notification settings:",
                error
            );

            showMessage(
                "Failed to load notification settings.",
                "error"
            );
        }
    }

// ==================================================
// NOTIFICATIONS
// ==================================================

    function setupNotifications() {

        const emailCheckbox =
            document.querySelector(
                "#email-notifications"
            );

        const orderCheckbox =
            document.querySelector(
                "#order-notifications"
            );

        const promotionalCheckbox =
            document.querySelector(
                "#promotional-notifications"
            );


        emailCheckbox?.addEventListener(
            "change",
            async () => {

                try {

                    await updateSettings({
                        email_notifications:
                            emailCheckbox.checked
                    });

                } catch (error) {

                    console.error(error);

                    // Rollback UI nếu API thất bại
                    emailCheckbox.checked =
                        !emailCheckbox.checked;

                    showMessage(
                        "Failed to update email notification setting.",
                        "error"
                    );
                }

            }
        );


        orderCheckbox?.addEventListener(
            "change",
            async () => {

                try {

                    await updateSettings({
                        order_notifications:
                            orderCheckbox.checked
                    });

                } catch (error) {

                    console.error(error);

                    orderCheckbox.checked =
                        !orderCheckbox.checked;

                    showMessage(
                        "Failed to update order notification setting.",
                        "error"
                    );
                }

            }
        );


        promotionalCheckbox?.addEventListener(
            "change",
            async () => {

                try {

                    await updateSettings({
                        promotional_notifications:
                            promotionalCheckbox.checked
                    });

                } catch (error) {

                    console.error(error);

                    promotionalCheckbox.checked =
                        !promotionalCheckbox.checked;

                    showMessage(
                        "Failed to update promotional notification setting.",
                        "error"
                    );
                }

            }
        );
    }


    async function updateNotificationSetting(
        field,
        value
    ) {

        try {

            await updateSettings({
                [field]: value
            });

        } catch (error) {

            console.error(
                "Error updating notification setting:",
                error
            );

            await loadSettings();

            showMessage(
                "Failed to update notification setting.",
                "error"
            );
        }
    }

// ==================================================
// DARK MODE
// ==================================================


// ==================================================
// PASSWORD
// ==================================================

    function setupPassword() {
        const passwordForm =
            document.getElementById("password-form");

        if (!passwordForm) return;

        passwordForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const currentPassword =
                document
                    .getElementById("current-password")
                    .value
                    .trim();

            const newPassword =
                document
                    .getElementById("new-password")
                    .value
                    .trim();

            const confirmPassword =
                document
                    .getElementById("confirm-password")
                    .value
                    .trim();

            // Validate current password
            if (!currentPassword) {
                showMessage(
                    "Please enter your current password.",
                    "error"
                );
                return;
            }

            // Validate new password
            if (!newPassword) {
                showMessage(
                    "Please enter your new password.",
                    "error"
                );
                return;
            }

            // Confirm password
            if (newPassword !== confirmPassword) {
                showMessage(
                    "New passwords do not match.",
                    "error"
                );
                return;
            }

            // Prevent using the same password
            if (newPassword === currentPassword) {
                showMessage(
                    "New password must be different from current password.",
                    "error"
                );
                return;
            }

            try {
                await changePassword({
                    old_password: currentPassword,
                    new_password: newPassword
                });

                logoutUser();

                window.location.href =
                    "../auth/login.html?password_changed=true";

            } catch (error) {
                console.error(
                    "Change password error:",
                    error
                );

                showMessage(
                    error.message ||
                    "Failed to change password.",
                    "error"
                );
            }
        });
    }

// ==================================================
// LOGOUT
// ==================================================

    function setupLogout() {

        const logoutButton =
            document.querySelector(
                "#logout-btn"
            );


        logoutButton?.addEventListener(
            "click",
            () => {

                logoutUser();

                window.location.href =
                    "../auth/login.html";

            }
        );
    }


// ==================================================
// MESSAGE
// ==================================================

    function showMessage(
        message,
        type = "success"
    ) {

        let messageBox =
            document.querySelector(
                "#setting-message"
            );


        if (!messageBox) {

            messageBox =
                document.createElement(
                    "div"
                );

            messageBox.id =
                "setting-message";

            document.body.appendChild(
                messageBox
            );
        }


        messageBox.textContent =
            message;

        messageBox.className =
            `setting-message ${type}`;


        setTimeout(
            () => {

                messageBox.remove();

            },
            3000
        );
    }


// ==================================================
// ESCAPE HTML
// ==================================================

function escapeHTML(value) {

    if (value === null ||
        value === undefined) {

        return "";
    }


    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}