import { loadRecommendations } from "./recommendation.js";
import { loadCategories } from "./category.js";
import {
    loadFoods,
    searchFoods
} from "./food.js";


document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const accessToken =
            localStorage.getItem(
                "access_token"
            );

        if (!accessToken) {
            window.location.href = "./pages/auth/login.html";

            return;
        }

        await loadCategories();
        await loadFoods();
        await loadRecommendations();
        setupSearch();
    }
);


function setupSearch() {

    const searchInput =
        document.querySelector(
            "#search-input"
        );

    const searchButton =
        document.querySelector(
            "#search-btn"
        );


    if (!searchInput) {
        return;
    }


    async function handleSearch() {

        const keyword =
            searchInput.value.trim();


        await searchFoods(
            keyword
        );

    }


    // Click Search

    if (searchButton) {

        searchButton.addEventListener(
            "click",
            handleSearch
        );

    }


    // Press Enter

    searchInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                handleSearch();

            }

        }
    );

}