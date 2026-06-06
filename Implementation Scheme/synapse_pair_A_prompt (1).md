# Synapse — Pair A (Backend Team) Master Prompt
### Give this prompt to Claude Opus 4.8

---

## Who You Are Talking To

You are acting as a **senior backend engineer and technical mentor** for a team of two CS sophomore beginners at UET Peshawar, Pakistan. They have basic knowledge of JavaScript and have just learned Node.js and Express in class. They have never built a real API before, never used MongoDB, and have never touched Socket.io. They need every single step explained with the actual code written out, not just described. Do not assume they know what a "middleware" is, what "JWT" means, or how Mongoose works — explain everything the first time you use it.

---

## The Project: Synapse

Synapse is a real-time communication platform built with the MERN stack (MongoDB, Express.js, React.js, Node.js), inspired by Discord. It connects people through servers, text channels, and direct messages — named after the neural synapses that link neurons.

**Core features to build:**
- User registration and login with JWT authentication
- Servers (like Discord servers) that users can create and join
- Text channels inside servers
- Real-time messaging using Socket.io — messages appear instantly for all users in a channel without page refresh
- Direct messages between two users
- Emoji reactions on messages
- File sharing (images/documents) in channels
- Role-based access: server owners are admins, others are members

---

## Your Responsibility: The Backend

Pair A owns everything on the server side. Pair B is building the React frontend simultaneously. Your code must work correctly so Pair B can connect to it — they are depending on every API route you write.

**Your stack:**
- Node.js + Express.js — the server framework
- MongoDB Atlas (free cloud database) + Mongoose — data storage and schema
- bcryptjs — password hashing
- jsonwebtoken (JWT) — authentication tokens
- Socket.io — real-time bidirectional communication
- Multer — file uploads
- dotenv — environment variables
- cors — allow the React app on port 3000 to talk to your server on port 5000

**Your folder structure:**
```
server/
├── index.js              ← entry point, Express + Socket.io setup
├── .env                  ← secrets (never push to GitHub)
├── middleware/
│   └── auth.js           ← JWT verification middleware
├── models/
│   ├── User.js
│   ├── Server.js
│   ├── Channel.js
│   └── Message.js
└── routes/
    ├── auth.js           ← /api/auth/register, /api/auth/login
    ├── servers.js        ← /api/servers
    ├── channels.js       ← /api/channels
    └── messages.js       ← /api/messages/:channelId
```

---

## The API Contract (what Pair B's frontend will call)

Pair B's React app will make HTTP requests to these exact endpoints. Do not change the route names — Pair B is hardcoding them.

```
POST   /api/auth/register         body: { username, email, password }
POST   /api/auth/login            body: { email, password }
GET    /api/servers               header: Authorization Bearer <token>
POST   /api/servers               header: Auth, body: { name }
GET    /api/channels?server=:id   header: Auth
POST   /api/channels              header: Auth, body: { name, serverId }
GET    /api/messages/:channelId   header: Auth
```

**Socket.io events Pair B will emit and listen for:**
```
Client emits → Server listens:
  joinChannel    { channelId }
  sendMessage    { content, authorId, channelId }
  leaveChannel   { channelId }

Server emits → Client listens:
  newMessage     { full message object with populated author }
  userJoined     { username, channelId }
```

**Every API response must follow this shape:**
- Success: `{ data: <payload> }` or `{ message: "..." }` with status 200/201
- Error: `{ error: "description" }` with status 400/401/404/500

---

## The 4-Day Schedule

### Day 1 — Setup + Express Server + MongoDB Connection
Install Node.js, set up the project with `npm init`, install all dependencies. Write the base `index.js` with Express running on port 5000. Connect to MongoDB Atlas (sign up for free at mongodb.com/atlas, create a free M0 cluster, get the connection string). Create the `.env` file. Create the `User` model with username, email, password, avatar fields. Write and test the `/api/auth/register` and `/api/auth/login` routes. At end of day, push to GitHub `dev` branch.

### Day 2 — All Models + Server/Channel Routes
Create the `Server`, `Channel`, and `Message` Mongoose models exactly as specified. Create the auth middleware that reads the JWT from the `Authorization` header. Write all server routes (create server, get servers for user). Write all channel routes (create channel, get channels by server). Write the messages GET route. Test every single route with Thunder Client in VS Code. At end of day, send Pair B the confirmed list of working routes.

### Day 3 — Socket.io Real-time Engine
Upgrade `index.js` from a plain Express server to an `http.createServer` + Socket.io server. Implement the `joinChannel`, `sendMessage`, and `leaveChannel` socket events. When a message is sent via socket, save it to MongoDB and emit `newMessage` back to everyone in that channel room. Add Multer for file uploads (`POST /api/upload`). Do a live test: open two browser tabs with a tool like Postman or directly coordinate with Pair B to test real-time messaging.

### Day 4 — Bug Fixes + Presentation Prep
Fix any bugs Pair B found during integration. Make sure CORS is configured correctly. Prepare to explain your architecture in the presentation: what each model does, how JWT works, how Socket.io rooms work.

---

## GitHub Workflow

Your branch: `feat/backend`

```bash
git checkout dev
git pull origin dev
git checkout -b feat/backend

# ... do your work ...

git add .
git commit -m "feat: add user auth routes"
git push origin feat/backend
# Then open Pull Request on GitHub → merge into dev
```

**Never push `.env` to GitHub.** Your `.gitignore` in `server/`:
```
node_modules/
.env
```

Communicate with Pair B daily. If you change a route name or response shape, tell them immediately.

---

## What to Ask Claude Opus 4.8

Ask for:
1. The complete, copy-paste ready code for every file listed in the folder structure above
2. A step-by-step setup guide for MongoDB Atlas for a beginner
3. An explanation of how JWT authentication works in plain language, then how it is implemented in this project
4. How Socket.io rooms work and why `socket.join(channelId)` is the key line
5. How to test every API route using Thunder Client with screenshots or step-by-step instructions
6. Common errors beginners make with Mongoose (like forgetting `await`, not populating references) and how to fix them
7. How to handle file uploads with Multer and store file paths in the Message model
8. A complete `index.js` that wires everything together including Socket.io

---

## Compatibility Note (Read This Carefully)

Pair B (the frontend team) is also giving their own prompt to Claude Opus 4.8. Their prompt describes the same project but from the React side. The outputs of both prompts must be **compatible** — meaning:

- The API route names, request bodies, and response shapes described above are the contract. Do not deviate.
- The Socket.io event names (`joinChannel`, `sendMessage`, `newMessage`) are fixed. Both teams must use exactly these names.
- The JWT token must be sent by Pair B as `Authorization: Bearer <token>` in every protected request header. Your middleware must read it exactly this way.
- MongoDB ObjectIds will be sent as strings from the frontend — your routes must handle `mongoose.Types.ObjectId` conversion where needed.
- Pair B's React app runs on `http://localhost:3000`. Your CORS config must explicitly allow this origin.

If Claude suggests an alternative architecture that changes any of the above, reject it and ask Claude to stick to the contract defined here.

---

## Minimum Viable Product Priority

If time is short, build in this exact order and stop when time runs out:
1. Register + Login (Day 1 — non-negotiable)
2. Create server + get servers (Day 2)
3. Create channel + get channels (Day 2)
4. Get messages for a channel (Day 2)
5. Socket.io sendMessage + newMessage (Day 3 — the demo moment)
6. File uploads (Day 3 — bonus)
7. Emoji reactions (Day 3 — bonus)
8. Direct messages (Day 3 — bonus if time allows)
