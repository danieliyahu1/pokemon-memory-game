# Pokémon Memory Game

Welcome to the Pokémon Memory Game! This is a fun and interactive memory card game where players match Pokémon cards. The game is designed with a frontend in React and a backend in Node.js using Socket.IO for real-time interactions. Below is a comprehensive guide to setting up and running the project.


## Demo

You can interact with the Pokémon Memory Game through the following demo:
https://pokemon-memory-game-pgh8.onrender.com/


## Features

- **Real-Time Multiplayer**: Players can join and play games in real-time.
- **Dynamic Card Matching**: Uses Cloudinary for card images and manages game logic.
- **Responsive Design**: Frontend designed for various devices using Tailwind CSS.
- **Game Management**: Handles player connection, game initialization, and game state updates.


## Technology

### Frontend

- **React**: A JavaScript library for building user interfaces. Used for creating the interactive components and managing the state of the game.
- **TypeScript**: A statically typed superset of JavaScript that adds optional types. It ensures better code quality and maintainability.
- **Tailwind CSS**: A utility-first CSS framework for designing the application's responsive and modern UI.
- **Vite**: A build tool that provides a faster development experience. Used for bundling and serving the frontend code.

### Backend

- **Node.js**: A JavaScript runtime built on Chrome's V8 JavaScript engine. Used for building the server-side logic of the application.
- **Express**: A web application framework for Node.js. Handles HTTP requests and serves the frontend assets.
- **Socket.IO**: A library for real-time web applications. Manages real-time bidirectional communication between clients and the server.
- **Cloudinary**: A cloud-based service for managing and delivering images. Used for hosting and fetching Pokémon card images.


## Frontend Overview

The frontend of the Pokémon Memory Game is built with React and uses TypeScript. It consists of the following key components:

- **App**: The main component that sets up routes and integrates the game logic.
- **GameBoard**: Displays the game board with Pokémon cards.
- **Card**: Represents individual cards that users can flip.
- **PlayerStatus**: Shows the current status of players, including their names and scores.
- **GameOver**: A component that displays the game results and allows users to restart the game.

The frontend uses Tailwind CSS for styling and ensures a responsive and interactive user interface.

## Backend Overview

The backend is built with Node.js and Express, with real-time communication handled by Socket.IO. Here’s a brief overview of the backend components:

- **index.ts**: Sets up the Express server, handles CORS, serves static files, and initializes the `GameManager` instance.
- **gameManager.ts**: Manages game state, handles player connections, and interacts with Cloudinary to fetch images. It also handles game logic, such as moves and game initialization.
- **socketHandlers.ts**: Contains event handlers for Socket.IO, managing real-time communication between players and the game server.
- **game.ts**: Defines the game logic, including move validation, card matching, and game-over conditions.
- **player.ts**: Manages player state, including moves and scores.

### Key Features:

- **Real-time Gameplay**: Players can interact in real-time with Socket.IO.
- **Image Storage**: Pokémon card images are stored and fetched from Cloudinary.
- **Game Management**: The `GameManager` class handles game initialization, player management, and game logic.