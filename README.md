# FaynoSync Dashboard


![demo](https://github.com/user-attachments/assets/17ab8692-d445-44bf-8a30-dc164025f805)



### 🧠 This frontend is the result of vibe coding

The entire UI was built with the help of AI coding assistants — that's what made this possible, since I'm a **DevOps engineer**, not a frontend developer 😅

I did my best, but if you see anything that can be improved — **any suggestions, feedback, or corrections are more than welcome!** 🙌


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


