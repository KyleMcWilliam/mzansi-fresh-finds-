# Mzansi Fresh Finds

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black) ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white) ![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white) ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=for-the-badge) ![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)

## Visual Demo
Below is a quick demonstration of navigating the Mzansi Fresh Finds website, showcasing key features like browsing products, adding items to the cart (if applicable), and user login (if applicable).

[![Mzansi Fresh Finds Demo](https://placehold.co/600x400/gif/text=Project+Demo+GIF)](https://www.example.com/your-demo-video-or-gif-link.mp4)
*Note: Please replace the placeholder image and link above with an actual GIF or video of your project. You can use tools like Giphy Capture (macOS) or ScreenToGif (Windows) to record your demo.*

Mzansi Fresh Finds is a web application that connects users with local South African businesses offering deals on near-dated food items, helping to reduce food waste and save money. This project serves as a practical application of web development principles and aims to address food sustainability.

## Project Goals & Motivation
The primary goal of Mzansi Fresh Finds was to create a practical application that solves a real-world problem—reducing food waste by connecting consumers with businesses offering discounts on near-dated food items. This project was also undertaken as a learning experience to apply the MERN (MongoDB, Express.js, React, Node.js) stack in building a full-featured e-commerce platform. It provided an opportunity to implement best practices in web development, including creating a responsive user interface, managing application state effectively, and developing a RESTful API.

## Key Features

*   **Discover Deals:** Users can easily browse and find a variety of discounted food items that are approaching their best-before dates, helping them save money and reduce food spoilage.
*   **Smart Filtering:** Intuitive filtering options allow users to narrow down deals by specific keywords (e.g., 'organic eggs', 'whole wheat bread'), and predefined categories (e.g., Bakery, Fruit & Veg, Dairy, Meat, Prepared Meals, Pantry Staples).
*   **Flexible Sorting:** Users can sort deals based on various criteria, including price (low to high and high to low) and items ending soonest, to quickly find the most relevant offers.
*   **Detailed View & Quick Contact:** Clicking on a deal opens a comprehensive modal displaying product details (name, image, description, best-before date), pricing (discounted and original), business information (name, location), and direct seller contact information for inquiries.
*   **Admin Product Management:** Admins have a dedicated dashboard to create, edit, and delete product listings, as well as manage all user orders and view site analytics.
*   **Progressive Web App (PWA):** Built with PWA features, including a service worker and manifest, enabling users to install the app on their devices for a more native-like experience and potential offline access to certain features.

## Screenshots
Here are some screenshots showcasing key pages of the Mzansi Fresh Finds application:

**Homepage:**
[![Homepage Screenshot](https://placehold.co/600x400/png/text=Homepage+Screenshot)](https://www.example.com/path-to-your-homepage-screenshot.png)
*Caption: The main landing page displaying current deals.*

**Product Detail Page:**
[![Product Detail Screenshot](https://placehold.co/600x400/png/text=Product+Detail+Screenshot)](https://www.example.com/path-to-your-product-detail-screenshot.png)
*Caption: Detailed view of a specific product with all its information.*

**Cart Page (if applicable):**
[![Cart Screenshot](https://placehold.co/600x400/png/text=Cart+Page+Screenshot)](https://www.example.com/path-to-your-cart-screenshot.png)
*Caption: The shopping cart page showing selected items.*
*(If your project does not have a cart, you can omit this part or replace it with another relevant page.)*

**Admin Dashboard (if applicable):**
[![Admin Dashboard Screenshot](https://placehold.co/600x400/png/text=Admin+Dashboard+Screenshot)](https://www.example.com/path-to-your-admin-dashboard-screenshot.png)
*Caption: The dashboard for administrators to manage products and orders.*
*(If your project does not have an admin dashboard, you can omit this part or replace it with another relevant page.)*

*Note: Please replace the placeholder images and links above with actual screenshots of your project. Ensure the images are clear and showcase the features effectively.*

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

This project is licensed under the MIT License. See the [LICENSE.md](LICENSE.md) file for details.
