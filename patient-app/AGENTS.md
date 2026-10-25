# Expo version: this project is pinned to SDK 54

`package.json` pins `expo` to `^54.0.x` (Expo 54.0.35, React Native 0.81.5 at last check). It
stays on SDK 54 because the Expo Go client on the owner's phone is SDK 54; see commits
`9754963` and `03c87eb` and the README's "Expo SDK Version Compatibility" section. Do **not**
write code for a newer SDK, and do not upgrade without the owner's say-so.

Before writing code against an Expo module:

1. Check the installed version of the module (`node_modules/<module>/package.json`) and read its
   TypeScript types in `node_modules/<module>/build/`. These are the ground truth for SDK 54.
2. Install Expo modules with `npx expo install <module>` so the SDK-54-compatible version is
   chosen. Never pin a version by hand.
3. Docs: <https://docs.expo.dev/versions/v54.0.0/>. Note that docs.expo.dev may redirect older
   version URLs to `latest`, so confirm any API you read there against the installed types.
   APIs change between SDKs (for example `expo-file-system` has a newer API and a `/legacy`
   one), so never assume.

Project rules live in `PLAN.md` at the repo root (decisions, phases, safety rules). Read it
before changing behaviour; in particular the AI never shows a diagnosis or severity (D1), and
health data stays on the device unless the owner chooses to share it (D3).
