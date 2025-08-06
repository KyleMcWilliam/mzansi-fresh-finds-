# Mzansi Fresh Finds

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white) ![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white) ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=for-the-badge) ![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)

Mzansi Fresh Finds is a web application that connects users with local South African businesses offering deals on near-dated food items, helping to reduce food waste and save money. This project serves as a practical application of web development principles and aims to address food sustainability using the MERN stack.

## Project Goals & Motivation
The primary goal of Mzansi Fresh Finds was to create a practical application that solves a real-world problem—reducing food waste by connecting consumers with businesses offering discounts on near-dated food items. This project was also undertaken as a learning experience to apply the MERN (MongoDB, Express.js, React, Node.js) stack in building a full-featured e-commerce platform. It provided an opportunity to implement best practices in web development, including creating a responsive user interface, managing application state effectively, and developing a RESTful API.

## Key Features

*   **Discover Deals:** Users can easily browse and find a variety of discounted food items that are approaching their best-before dates.
*   **API-driven Content:** The platform is powered by a robust Node.js and Express backend, serving deal data from a MongoDB database.
*   **Modern Frontend:** A responsive and interactive user interface built with React and Redux for efficient state management.
*   **Combined Development Workflow:** The frontend and backend can be run concurrently with a single command for a seamless development experience.
*   **Ready for Production:** The Express server is configured to serve the built React application, making deployment straightforward.

## Technologies Used

*   **Frontend:**
    *   **React:** For building the user interface.
    *   **Redux:** For predictable state management.
    *   **React Router:** For client-side routing.
    *   **Bootstrap & React-Bootstrap:** For UI components and styling.
    *   **Axios:** For making API requests.
*   **Backend:**
    *   **Node.js:** As the JavaScript runtime environment.
    *   **Express.js:** As the web application framework.
    *   **MongoDB:** As the NoSQL database for storing data.
    *   **Mongoose:** As the Object Data Modeling (ODM) library for MongoDB.
    *   **JWT (JSON Web Tokens):** For user authentication and authorization.
*   **Testing:**
    *   **Jest & Supertest:** For backend API testing.
    *   **React Testing Library:** For frontend component testing.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   **Node.js and npm:** Make sure you have Node.js and npm installed. You can download them from [nodejs.org](https://nodejs.org/).
*   **MongoDB:** You will need a running MongoDB instance. You can use a local installation or a cloud service like MongoDB Atlas. Your connection string should be placed in `backend/config/config.js`.

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **Install dependencies for both frontend and backend:**
    This single command will install all necessary packages for both the server and the client.
    ```sh
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `config.js` file in the `backend/config/` directory and add your MongoDB connection string and a JWT secret.
    ```javascript
    // backend/config/config.js
    module.exports = {
      mongoURI: 'YOUR_MONGODB_CONNECTION_STRING',
      jwtSecret: 'YOUR_JWT_SECRET',
    };
    ```

### Running the Application

*   **Development Mode:**
    To run both the frontend and backend servers concurrently in development mode (with hot-reloading), use the following command from the project root:
    ```sh
    npm run dev
    ```
    This will start the React development server on `http://localhost:3000` and the Node.js API server on `http://localhost:5000`.

*   **Production Mode:**
    To build the React app and have the backend server serve it, follow these steps:
    1.  Build the frontend:
        ```sh
        npm run build --prefix frontend
        ```
    2.  Start the backend server:
        ```sh
        npm start --prefix backend
        ```
    Your application will be available at `http://localhost:5000`.

## Project Structure

The project is organized as a monorepo with two main packages: `frontend` and `backend`.

```
.
├── backend/              # Contains the Node.js/Express backend server
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── config/
│   ├── tests/
│   ├── app.js
│   ├── server.js
│   └── package.json
│
├── frontend/             # Contains the React frontend application
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── actions/
│   │   ├── reducers/
│   │   └── store.js
│   └── package.json
│
├── .gitignore
├── package.json          # Root package.json for coordinating the project
└── README.md
```

## License

This project is licensed under the MIT License. See the [LICENSE.md](LICENSE.md) file for details.
