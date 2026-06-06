# Synapse — Pair B (Frontend Team) Master Prompt
### Give this prompt to Claude Opus 4.8

---

## Who You Are Talking To

You are acting as a **senior React developer and technical mentor** for a team of two CS sophomore beginners at UET Peshawar, Pakistan. They understand basic HTML, CSS, and JavaScript. They have just started learning React and have never used hooks beyond `useState`, never used React Router, never made an API call from a React app, and have never touched Socket.io. They need every single step explained with the actual code written out. Do not assume they know what a "component lifecycle" is, what `useEffect` does, or how `axios` differs from `fetch` — explain each concept the first time it appears.

---

## The Project: Synapse

Synapse is a real-time communication platform built with the MERN stack (MongoDB, Express.js, React.js, Node.js), inspired by Discord. It connects people through servers, text channels, and direct messages — named after the neural synapses that link neurons.

**Core features to build:**
- User registration and login with JWT authentication
- Servers (like Discord servers) that users can create and join
- Text channels inside servers
- Real-time messaging using Socket.io — messages appear instantly without page refresh
- Direct messages between two users
- Emoji reactions on messages
- File sharing (images/documents) in channels
- Role-based UI — admins see delete/manage options, members do not

---

## Your Responsibility: The Frontend

Pair B owns everything the user sees and interacts with. Pair A is building the Node.js/Express/MongoDB backend simultaneously. Your React app calls their API routes and connects to their Socket.io server. They have already agreed on the exact API contract — you must follow it precisely so your code works with theirs.

**Your stack:**
- React.js (created with Create React App or Vite)
- React Router DOM v6 — for page navigation
- Axios — for HTTP API calls
- Socket.io-client — for real-time messaging
- CSS (plain CSS modules or a single App.css) — for styling

**Your folder structure:**
```
client/
├── public/
└── src/
    ├── index.js             ← renders App, wraps with AuthProvider
    ├── App.jsx              ← Router with all routes defined
    ├── App.css              ← global styles (Discord-dark theme)
    ├── context/
    │   └── AuthContext.js   ← user + token state shared across app
    ├── pages/
    │   ├── LoginPage.jsx
    │   ├── RegisterPage.jsx
    │   └── AppPage.jsx      ← the main layout after login
    └── components/
        ├── ServerSidebar.jsx   ← leftmost column: server icons
        ├── ChannelSidebar.jsx  ← second column: channel list
        ├── ChatArea.jsx        ← main chat window
        └── MessageInput.jsx    ← input bar at bottom of chat
```

---

## The API Contract (what Pair A's backend exposes)

These are the exact HTTP endpoints your React app will call. Do not change route names — Pair A has built their server around these.

```
POST   /api/auth/register         body: { username, email, password }
POST   /api/auth/login            body: { email, password }
GET    /api/servers               header: Authorization: Bearer <token>
POST   /api/servers               header: Auth, body: { name }
GET    /api/channels?server=:id   header: Auth
POST   /api/channels              header: Auth, body: { name, serverId }
GET    /api/messages/:channelId   header: Auth
```

**Socket.io events you will emit and listen for:**
```
You emit → Backend listens:
  joinChannel    { channelId }
  sendMessage    { content, authorId, channelId }
  leaveChannel   { channelId }

Backend emits → You listen:
  newMessage     { full message object with populated author }
  userJoined     { username, channelId }
```

**Every API response shape:**
- Login success: `{ token: "...", user: { id, username } }`
- Error: `{ error: "description" }`

**Sending authenticated requests:**
Every request after login must include this header:
```
Authorization: Bearer <your_jwt_token>
```
You will store the token in `localStorage` after login and read it from `AuthContext` when making requests.

---

## The 4-Day Schedule

### Day 1 — Setup + HTML/CSS Layout Skeleton
Bootstrap the React app (`npx create-react-app client`), install dependencies (`axios`, `socket.io-client`, `react-router-dom`). Delete boilerplate. Write the three-column Discord-style layout in pure CSS first — `server-sidebar` (72px wide, dark), `channel-sidebar` (240px, slightly lighter), `chat-area` (flex:1, main dark). No logic yet — just the skeleton visible in the browser. At end of day push to GitHub `dev` branch.

### Day 2 — Auth Context + Login/Register Pages
Build `AuthContext.js` using `createContext` and `useContext`. It stores `user` and `token` in both React state and `localStorage` so the login survives a page refresh. Build `LoginPage.jsx` — a centered card with email/password inputs, calls `POST /api/auth/login`, on success calls `login()` from context and navigates to `/app`. Build `RegisterPage.jsx` similarly. Set up React Router in `App.jsx` — `/login`, `/register`, `/app` routes with a redirect guard (if no user, redirect to `/login`). Test by running Pair A's backend and logging in for real.

### Day 3 — Servers, Channels, and Live Chat
Build `ServerSidebar.jsx` — on mount, fetch `GET /api/servers` with the auth token using `useEffect` + `axios`. Display each server as a round icon showing the first letter of the name. Add a `+` button to create a new server. Build `ChannelSidebar.jsx` — when a server is selected, fetch `GET /api/channels?server=:id`. Build `ChatArea.jsx` — this is the most important component. On channel select: emit `joinChannel` to Socket.io, fetch existing messages from `GET /api/messages/:channelId`, then listen for `newMessage` events and append them to state. Build the message input: on submit, emit `sendMessage` via Socket.io (not HTTP). Test with Pair A's server running — open two tabs, message in one, see it appear in the other instantly.

### Day 4 — Polish + Presentation Prep
Clean up the UI — consistent colors, message bubbles with username and timestamp, hover states. Add a logout button. Add loading states (show "Loading..." while fetching). Fix any bugs found during integration with Pair A. Prepare the live demo flow for the presentation.

---

## The Visual Design

Build a Discord-inspired dark theme. These are the exact CSS colors to use:

```css
/* Color palette */
--bg-dark:       #1e1f22;   /* outermost background, server sidebar */
--bg-medium:     #2b2d31;   /* channel sidebar, modals */
--bg-light:      #313338;   /* chat area */
--bg-input:      #383a40;   /* message input background */
--accent:        #5865f2;   /* primary button color */
--accent-green:  #3ba55c;   /* online indicator, add button */
--text-primary:  #dbdee1;   /* main message text */
--text-muted:    #a3a6aa;   /* timestamps, secondary labels */
--text-white:    #ffffff;   /* usernames, headings */
```

**Layout must be:**
```
[ 72px server icons ] [ 240px channel list ] [ flex:1 chat area ]
                                              [ messages scroll  ]
                                              [ input bar fixed  ]
```

The app must fill the full viewport height (`height: 100vh`) with no page scroll — only the messages container scrolls internally.

---

## GitHub Workflow

Your branch: `feat/frontend`

```bash
git checkout dev
git pull origin dev
git checkout -b feat/frontend

# ... do your work ...

git add .
git commit -m "feat: add login page and auth context"
git push origin feat/frontend
# Then open Pull Request on GitHub → merge into dev
```

**Your `.gitignore` in `client/`:**
```
node_modules/
.env
build/
```

Communicate with Pair A daily. If their server is not running, you cannot test your API calls. Coordinate break times.

---

## What to Ask Claude Opus 4.8

Ask for:
1. The complete, copy-paste ready code for every file in the folder structure above
2. How `useEffect` works in plain language — why it runs when a component mounts, and how the cleanup function prevents memory leaks (important for Socket.io listeners)
3. How React Context works and why you use it instead of passing `user` as a prop through every component
4. How `axios` interceptors work — so you can attach the token to every request automatically without writing `headers: { Authorization: ... }` in every single call
5. How Socket.io-client connects and why the socket instance should be created once outside the component (not inside it)
6. How to prevent the `newMessage` socket listener from stacking up every time the component re-renders (the cleanup return in `useEffect`)
7. How React Router v6 protected routes work — redirecting unauthenticated users
8. How to make the messages container auto-scroll to the bottom when a new message arrives (`useRef` + `scrollIntoView`)

---

## Compatibility Note (Read This Carefully)

Pair A (the backend team) is also giving their own prompt to Claude Opus 4.8. Their prompt describes the same project from the Node.js/Express side. The outputs of both prompts must be **compatible** — meaning:

- Every API route path, HTTP method, request body field name, and response shape listed in the API Contract section above is fixed. If Claude suggests using different route names, reject it.
- The Socket.io event names (`joinChannel`, `sendMessage`, `newMessage`, `leaveChannel`) are fixed. Both prompts use exactly these names. Do not rename them.
- Your auth token must be stored as a plain string in `localStorage` with the key `synapse_token`. Your user object must be stored under `synapse_user`.
- Pair A's backend runs on `http://localhost:5000`. All your `axios` calls must point to this base URL.
- When sending the token, it must be in the format `Bearer <token>` (with a space after "Bearer") — Pair A's middleware reads it this exact way.
- Message objects returned from the backend will have this shape: `{ _id, content, author: { _id, username, avatar }, channel, createdAt }`. Use `m.author.username` and `m.createdAt` when rendering messages.

If Claude suggests a different state management tool (Redux, Zustand) or a different HTTP library (fetch instead of axios), reject it and ask for the axios-based implementation. Keep the stack simple.

---

## Minimum Viable Product Priority

If time is short, build in this exact order and stop when time runs out:
1. Login + Register pages that actually call the backend (Day 2 — non-negotiable)
2. The three-column app layout visible and styled (Day 1)
3. Server list loads from API and displays (Day 3)
4. Channel list loads when a server is clicked (Day 3)
5. Messages load when a channel is clicked (Day 3)
6. New messages appear in real-time via Socket.io (Day 3 — the demo moment)
7. Create server + create channel UI (Day 3)
8. Emoji reactions UI (Day 4 — bonus)
9. File upload UI (Day 4 — bonus)
10. Direct message panel (Day 4 — bonus if time allows)
