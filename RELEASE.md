# PaperMap Live - Release Setup Guide

## Version 1.0.0

### Prerequisites

1. **Generate Update Keys**
   ```bash
   npm run tauri signer generate -- -w ~/.tauri/myapp.key
   ```
   This creates a private key and outputs a public key.

2. **Add GitHub Secrets**
   Go to GitHub Repository Settings → Secrets and variables → Actions:
   - `TAURI_PRIVATE_KEY`: Content of `~/.tauri/myapp.key`
   - `TAURI_KEY_PASSWORD`: Password you set (if any, otherwise empty)

3. **Update tauri.conf.json**
   - Replace `YOUR_USERNAME` in the updater endpoint with your GitHub username
   - Replace `YOUR_PUBLIC_KEY_HERE` with the public key from step 1

### Creating a Release

1. **Tag a version:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. The GitHub Action will automatically:
   - Build the Windows installer (.msi)
   - Sign it with your private key
   - Create a GitHub Release
   - Generate `latest.json` for auto-updates

### Testing Auto-Update

1. Install v1.0.0 on your machine
2. Create a new tag (v1.0.1)
3. The app will automatically check for updates on startup
4. Users will see an update dialog

### Manual Build

```bash
npm install
npm run tauri build
```

Output will be in `src-tauri/target/release/bundle/`

### Features

- 🗺️ High-fidelity map wallpaper engine
- 🌙 Dark theme with neon green roads
- 🖥️ Multi-monitor support
- 🎨 Customizable typography and styling
- ⚡ Hardware-accelerated rendering
- 🔄 Automatic updates via GitHub Releases
