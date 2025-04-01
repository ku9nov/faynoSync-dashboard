# FaynoSync Dashboard

![demo-quality](https://github.com/user-attachments/assets/40a80baa-142b-466a-8e5b-c2153dac5cae)

## Description 📄

This frontend is designed to work with the [FaynoSync API](https://github.com/ku9nov/faynoSync), providing seamless service updates.

## Installing Dependencies 📦

To install all necessary dependencies, run the following command:

```
yarn install
```

## Running in Development Mode 🛠️

To start the project in development mode, use the command:

```
yarn dev
```

This will launch a local server, usually on port 3000. You can open it in your browser at `http://localhost:3000`.

## Running in Production Mode 🚀

To run in production mode, first build the project:

```
yarn build
```

## Environment File Setup ⚙️

Create a `.env` file in the root directory of the project and add the following environment variables:

```
VITE_API_URL=http://localhost:9000
VITE_PORT=3000 
```

Alternatively, you can simply copy the `.env.example` file to `.env`:

```
cp .env.example .env
```

Then, add or modify the necessary environment variables if needed.


