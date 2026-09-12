---
description: Create or refresh the repo-specific AI agent instructions for this Expo app
---

# Create agent

Create or update a project-specific AI agent file for this repository so future coding tasks follow the app’s actual architecture and Expo version.

## Required workflow

1. Read the repository guidance files first:
   - AGENTS.md
   - CLAUDE.md
2. Read the exact Expo versioned documentation before making any code changes:
   - https://docs.expo.dev/versions/v54.0.0/
3. Inspect the current app structure and match the guidance to the actual codebase:
   - app/ uses Expo Router file-based routing
   - components/ contains reusable UI pieces
   - constants/ contains shared theme values
   - lib/ contains Supabase setup and shared app logic
   - hooks/ contains custom React hooks

## Output requirements

Create or refresh a concise but complete agent instruction file that includes:

- project overview for this Expo + React Native app
- architecture notes based on the current folder structure
- required commands for local development, including Expo commands
- coding conventions for TypeScript, React Native, and Expo Router
- constraints specific to this repo, such as the use of Expo SDK 54 and React Native 0.81.5
- guidance to prefer minimal, app-specific changes over broad rewrites
- instructions to verify work with relevant Expo/React Native commands before claiming completion

## Suggested repo-standard content

- Name: AGENTS.md or equivalent repository instruction file
- Use Expo Router conventions and file-based routing under app/
- Preserve app.json, expo-router entry, and existing app structure unless there is a clear requirement to change them
- Keep UI in components/ and cross-app values in constants/
- Treat Supabase configuration in lib/ as a critical integration surface
- Prefer small, typed, readable React Native components and hooks
- When adding dependencies, ensure they are compatible with Expo SDK 54

## Final rule

Before writing any code, the agent must explicitly acknowledge that it is consulting the exact Expo SDK 54 documentation at https://docs.expo.dev/versions/v54.0.0/ and align the implementation with that version.
