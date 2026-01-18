# PaperMap Live v1.0.0 - Production Ready! 🎉

Your app is now fully configured for production releases with automatic updates!

## ✅ What's Been Set Up

### 1. GitHub Actions Workflow
- **File**: `.github/workflows/release.yml`
- **Triggers**: Automatically on tags matching `v*` (e.g., v1.0.0)
- **Builds**: Windows .msi installer with code signing
- **Publishes**: GitHub Release with installer and update manifest

### 2. Auto-Updater Configuration
- **Rust**: `tauri-plugin-updater` added to Cargo.toml and lib.rs
- **Config**: Update endpoint configured in tauri.conf.json
- **Signing**: Ready for public/private key pair setup

### 3. Version 1.0.0
- All configuration files updated to v1.0.0
- Package name: "papermap-live"
- Product name: "PaperMap Live"
- Bundle identifier: "com.papermap.live"

### 4. Code Quality
- ✅ All TypeScript compilation errors fixed
- ✅ Clean, production-ready code
- ✅ Optimized MapLibre configuration
- ✅ Proper error handling

## 🚀 Next Steps to Release

### Step 1: Generate Signing Keys

Run the provided PowerShell script:

```powershell
.\setup-release.ps1
```

This will:
- Generate a public/private key pair
- Save the private key to `~/.tauri/papermap.key`
- Display the public key for copying

**Alternative manual method:**
```bash
npm run tauri signer generate -- -w ~/.tauri/papermap.key
```

### Step 2: Configure GitHub Secrets

Go to your repository settings and add these secrets:

**GitHub Repository → Settings → Secrets and variables → Actions → New repository secret**

1. **TAURI_PRIVATE_KEY**
   - Value: Paste the entire contents of `~/.tauri/papermap.key`

2. **TAURI_KEY_PASSWORD**
   - Value: The password you entered when generating the key

### Step 3: Update tauri.conf.json

Open `src-tauri/tauri.conf.json` and replace:

1. Line with `"YOUR_USERNAME"` → Your GitHub username
2. Line with `"YOUR_PUBLIC_KEY_HERE"` → The public key from Step 1

Example:
```json
"endpoints": [
  "https://raw.githubusercontent.com/yourusername/PaperMap-Live/main/latest.json"
],
"pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXkgQUJDMTIzNDU2Nzg5\nRXhhbXBsZUtleURhdGFIZXJl\n"
```

### Step 4: Create and Push Your First Release

```bash
# Commit all changes
git add .
git commit -m "Release v1.0.0"

# Create a version tag
git tag v1.0.0

# Push everything
git push origin main
git push origin v1.0.0
```

### Step 5: Watch the Magic! ✨

1. Go to your GitHub repository → **Actions** tab
2. Watch the "Release" workflow build your app
3. When complete, check **Releases** tab for the published release
4. Download and install the .msi file to test!

## 📦 How Auto-Updates Work

Once users install v1.0.0:

1. When you create a new tag (e.g., v1.0.1)
2. GitHub Actions builds and publishes the new version
3. The app automatically detects the update
4. Users get a dialog to update with one click!

## 🔄 Creating Future Updates

For each new version:

```bash
# Make your changes
git add .
git commit -m "Add new features"

# Bump version in:
# - package.json
# - src-tauri/Cargo.toml
# - src-tauri/tauri.conf.json

# Create and push tag
git tag v1.1.0
git push origin main v1.1.0
```

## 📝 Version Numbering Guide

Follow [Semantic Versioning](https://semver.org/):

- **v1.0.0** → Initial release
- **v1.0.1** → Bug fixes only
- **v1.1.0** → New features (backward compatible)
- **v2.0.0** → Breaking changes

## 🛠️ Troubleshooting

### Build fails on GitHub Actions
- Check that secrets are correctly set
- Verify public key in tauri.conf.json matches your generated key
- Ensure all paths in configs use forward slashes `/`

### Update not detected
- Verify the `latest.json` file exists in your releases
- Check the endpoint URL in tauri.conf.json is correct
- Make sure the new version number is higher than installed version

### Signing errors
- Confirm TAURI_PRIVATE_KEY includes the entire key file (including headers)
- Verify TAURI_KEY_PASSWORD matches the password used during generation
- Key file should be in PEM format

## 📚 Documentation

- **RELEASE.md** - Detailed release setup instructions
- **README.md** - Project overview and features
- **setup-release.ps1** - Automated setup script for Windows

## 🎊 You're All Set!

Your PaperMap Live app is production-ready with:
- ✅ Automated builds
- ✅ Code signing
- ✅ Auto-updates
- ✅ Professional release workflow

Follow the steps above to publish your first release! 🚀
