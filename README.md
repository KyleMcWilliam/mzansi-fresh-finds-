# Mzansi Fresh Finds

Mzansi Fresh Finds is a web application that connects users with local South African businesses offering deals on near-dated food items, helping to reduce food waste and save money.

## Key Features

*   **Discover Deals:** Browse and find discounted food items nearing their best-before dates.
*   **Smart Filtering:** Easily filter deals by:
    *   Keywords (e.g., "bread", "milk", "avo")
    *   Categories (e.g., Bakery, Fruit & Veg, Dairy, Meat, Prepared Meals, Pantry Staples)
*   **Flexible Sorting:** Sort deals to find what you need:
    *   Price: Low to High
    *   Price: High to Low
    *   Ending Soonest
*   **Detailed View:** Click on a deal to see more information in a pop-up modal, including:
    *   Product name and image
    *   Business name and location
    *   Discounted price and original price (if available)
    *   Best before date
    *   Full description
    *   Seller contact information
*   **PWA Ready:** Includes Progressive Web App features like a manifest and service worker for a better user experience (e.g., potential for installation).

## Technologies Used

*   **HTML5:** For the structure and content of the web pages.
*   **CSS3:** For styling the application, making it visually appealing.
    *   Includes [Font Awesome](https://fontawesome.com/) for icons.
*   **JavaScript (ES6 Modules):** For client-side logic, interactivity, filtering, sorting, and dynamic content updates.
*   **JSON:** For storing and managing the deals data.
*   **Service Worker:** Enabling Progressive Web App (PWA) capabilities for an improved user experience and potential offline features.

## Getting Started

To run this project locally, you can simply open the `index.html` file in your web browser.

Alternatively, for a more robust local development experience that mimics a live server environment (especially for PWA features and to avoid potential CORS issues if you were to fetch data from a separate local server), you can use a simple HTTP server.

**Using Python's built-in HTTP server (if you have Python installed):**

1.  Navigate to the project's root directory in your terminal.
2.  Run one of the following commands (depending on your Python version):
    *   Python 3: `python -m http.server`
    *   Python 2: `python -m SimpleHTTPServer`
3.  Open your browser and go to `http://localhost:8000` (or the port indicated by the server).

**Using Node.js `http-server` (if you have Node.js and npm installed):**

1.  If you don't have `http-server` installed globally, install it:
    ```bash
    npm install -g http-server
    ```
2.  Navigate to the project's root directory in your terminal.
3.  Run the server:
    ```bash
    http-server
    ```
4.  Open your browser and go to the URL provided by `http-server` (usually `http://localhost:8080`).

No complex build steps are required for this project as it's composed of static assets.

## Project Structure

Here's a brief overview of the main files and directories:

```
.
├── index.html            # Main landing page, displays deals
├── about.html            # About Us page
├── contact.html          # Contact page
├── business-signup.html  # Page for businesses to sign up (frontend structure)
├── privacy.html          # Privacy Policy page
├── style.css             # Main stylesheet for the application
├── manifest.json         # PWA manifest file
├── sw.js                 # Service Worker for PWA functionality
│
├── js/                   # Contains JavaScript files
│   ├── app.js            # Main application logic, initialization
│   ├── deals.js          # Handles fetching, filtering, and sorting of deals
│   ├── ui.js             # Manages UI updates and event handling
│   ├── modal.js          # Controls the deal detail modal
│   ├── config.js         # Configuration constants (e.g., localStorage keys)
│   └── utils.js          # Utility functions (e.g., date formatting)
│
├── data/
│   └── deals.json        # JSON file storing the deal data
│
└── images/               # (Assumed) Likely contains images for deals, icons, etc.
    └── (various images)
```
*(Note: The `images/` directory is assumed based on common practice and references like `/images/icons/icon-192x192.png` in `index.html` and `modalImage.src = deal.imageUrl || getPlaceholderImage(deal.category);` in `modal.js`. Actual image paths might vary within `deals.json`.)*

## Contributing

Currently, contributions are not formally structured. However, if you have suggestions or find issues, please feel free to open an issue on the project's repository (if available).

## License

This project is currently unlicensed. All rights reserved.
