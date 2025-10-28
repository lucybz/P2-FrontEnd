# Testing GitHub OAuth with the P2-FrontEnd and CST438-Project2 backend

This document explains how to test the integrated OAuth flow implemented between the front-end (Expo / React Native) and the backend (Spring Boot) in this repository.

It assumes you used the `Oauth` branch where the front-end `login.tsx` includes an OAuth button that calls the backend `/oauth/start` endpoint, opens the GitHub authorize URL in the system browser, and polls `/oauth/status` until the backend reports SUCCESS or ERROR.

## Overview

- Backend (server) handles GitHub OAuth server-side:
  - `/oauth/start` — creates an OAuth session and returns `authUrl` + `sessionId`.
  - `/oauth/callback` — GitHub redirects here after user authorizes; backend exchanges code -> token and marks the session SUCCESS/ERROR.
  - `/oauth/status?session=<id>` — frontend polls this to learn when the session completes.

- Front-end (Expo) flow:
  - Press "Sign in with GitHub" on the login screen.
  - Front-end calls `/oauth/start`, opens the returned `authUrl` in the browser, and polls `/oauth/status`.
  - When the backend completes (SUCCESS), the front-end navigates to `LandingPage` with the obtained data.

## Prerequisites

- Java & Gradle (to run the Spring Boot backend) — Gradle wrapper is included.
- Node.js and npm (for the front-end / Expo).
- Expo CLI (optional) or use `npm start` in `P2-FrontEnd`.
- (Optional) ngrok — if you test from a physical device or want to expose the backend.
- A GitHub OAuth App (for local testing) with these values configured:
  - Authorization callback URL: `http://localhost:8080/oauth/callback` (or an ngrok URL if you expose the backend)
  - Copy the `Client ID` and `Client Secret` for the backend.

## Backend configuration (Spring Boot)

Set the following environment variables for local testing (PowerShell example):

```powershell
$env:GITHUB_CLIENT_ID = "Ov23lisHO1Te8e1qKAKG"
$env:GITHUB_CLIENT_SECRET = "3861ff8af785d24fb9f282c7b1da9a1c93e7b1a3"
$env:GITHUB_AUTHORIZE_URI = "https://github.com/login/oauth/authorize"
$env:GITHUB_TOKEN_URI = "https://github.com/login/oauth/access_token"
$env:GITHUB_REDIRECT_URI = "http://localhost:8080/oauth/callback"
$env:GITHUB_SCOPE = "repo"
.\run-local.ps1
```

Notes:
- The backend reads these properties (see `GitHubOAuthService` in the Java code). The redirect URI you register in your GitHub OAuth app must match `GITHUB_REDIRECT_URI`.

## Run the backend (local)

From the repository root (where `gradlew` is) run the Gradle wrapper to start Spring Boot:

```powershell
.\run-local.ps1
```

If everything starts correctly, the backend should be reachable at `http://localhost:8080`.

### Useful debug endpoints

- `http://localhost:8080/oauth/debug` — returns non-sensitive OAuth configuration in JSON (authorizeUri, tokenUri, redirectUri, scope, clientId).
- `http://localhost:8080/oauth/start` — returns a JSON session (useful for testing via browser or curl).

## Run the front-end (Expo)

Open a new terminal and run:

```powershell
cd .\P2-FrontEnd
npm install   # only if dependencies are missing
npm start
```

You can run the app in an emulator/simulator or on a real device via the Expo app.

## Testing scenarios

1) Simulator (recommended for local dev)

 - With backend running on your machine (localhost:8080), open the Expo app in an emulator.
 - In the Login screen press "Sign in with GitHub".
 - The system browser will open the GitHub authorize page. Sign in and authorize the app.
 - GitHub will redirect to `http://localhost:8080/oauth/callback`; backend exchanges code for token and marks the session as SUCCESS.
 - The front-end polling detects SUCCESS and navigates to `LandingPage`.

2) Real device testing (use ngrok)

 - `localhost` on your phone does not point to your development machine. Use ngrok to expose the backend:

```powershell
ngrok http 8080
```

 - ngrok will show a public `https://xxxxx.ngrok.io` URL. Update two things:
   1. In your GitHub OAuth app settings, add `https://xxxxx.ngrok.io/oauth/callback` as an authorized callback URL (or replace existing localhost entry during testing).
   2. Update `API_BASE` in `P2-FrontEnd/app/screens/login.tsx` to point to the ngrok URL, e.g. `https://xxxxx.ngrok.io`.

 - Restart the Expo app on your device and press "Sign in with GitHub". Follow the same steps in the browser. The backend (ngrok -> local) will receive the callback and update the session.

## Troubleshooting

- If `/oauth/start` returns a session JSON with `authUrl`, but the browser shows an error from GitHub:
  - Check the callback URL registered in your GitHub OAuth app.
  - Verify `GITHUB_CLIENT_ID` is correct and matches the OAuth app.

- If the front-end never sees SUCCESS and times out:
  - Confirm backend logs show the callback was received and token exchange succeeded.
  - Visit `http://localhost:8080/oauth/debug` to confirm redirectUri and authorizeUri.

- If testing on a phone and using `ngrok`, make sure the backend is accessible and you updated `API_BASE` in the front-end code.

## Security notes

- The current backend implementation performs the server-side code->token exchange (client secret stays on the server). This is recommended for apps that want to keep the client secret confidential.
- The frontend currently receives the `accessToken` from the backend session polling. In production you should avoid exposing raw tokens to the mobile client — instead, use a backend session or issue your own short-lived token/JWT.

## Next steps (enhancements)

- Implement a deep-link redirect flow so the backend redirects the browser directly back to the app (e.g., `myapp://oauth?session=SID`). This avoids polling and gives a native UX.
- Implement PKCE with Expo AuthSession if you prefer client-side OAuth without a client_secret (requires GitHub app configuration).

If you want, I can implement the deep-link flow (backend + front-end) for you next — say the word and I will add the necessary backend redirect and front-end deep-link handling.

---
File created for developer testing: `P2-FrontEnd/OAUTH-TESTING.md`
