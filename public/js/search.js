// import { BOOK_SEARCH } from "../../data/books.mjs";

document.addEventListener("DOMContentLoaded", function() {
    const searchForm = document.getElementById("searchBookForm");
    const searchInput = document.getElementById("search_term");
    const searchResultsList = document.getElementById("searchResults");
    const nextPageButton = document.getElementById("nextPageButton");
    const prevPageButton = document.getElementById("prevPageButton");

    let currentPage = 0;

    searchForm.addEventListener("submit", async function(event) {
        event.preventDefault(); // Prevent the default form submission behavior

        const searchTerm = searchInput.value.trim();
        if (searchTerm === "") {
            alert("Please enter a search term.");
            return;
        }

        try {
            const books = await bookAPI.BOOK_SEARCH(searchTerm, currentPage);
            displaySearchResults(books);
        } catch (error) {
            console.error(error);
            alert("An error occurred while fetching search results.");
        }
    });

    nextPageButton.addEventListener("click", async function() {
        currentPage++;
        await fetchAndDisplayBooks();
    });

    prevPageButton.addEventListener("click", async function() {
        if (currentPage > 0) {
            currentPage--;
            await fetchAndDisplayBooks();
        }
    });

    async function fetchAndDisplayBooks() {
        const searchTerm = searchInput.value.trim();
        try {
            const books = await searchBooks(searchTerm, currentPage);
            displaySearchResults(books);
        } catch (error) {
            console.error(error);
            alert("An error occurred while fetching search results.");
        }
    }

    function displaySearchResults(books) {
        searchResultsList.innerHTML = "";
        books.forEach(book => {
            const listItem = document.createElement("li");
            const img = document.createElement("img");
            img.src = book.img;
            img.alt = book.title;
            const title = document.createElement("span");
            title.textContent = book.title;
            listItem.appendChild(img);
            listItem.appendChild(title);
            searchResultsList.appendChild(listItem);
        });
    }
});
