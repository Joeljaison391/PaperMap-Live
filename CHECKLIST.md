# 🚀 Release Checklist for v1.0.0

## Pre-Release Setup (One-Time)

- [ ] Generate signing keys
  ```powershell
  .\setup-release.ps1
  ```
  
- [ ] Add GitHub secrets:
  - [ ] `TAURI_PRIVATE_KEY` (contents of ~/.tauri/papermap.key)
  - [ ] `TAURI_KEY_PASSWORD` (password from key generation)

- [ ] Update `src-tauri/tauri.conf.json`:
  - [ ] Replace `YOUR_USERNAME` with GitHub username
  - [ ] Replace `YOUR_PUBLIC_KEY_HERE` with public key

## Release Process

- [ ] Code is tested and working
- [ ] All changes committed
- [ ] Version numbers updated in:
  - [ ] `package.json` → `"version": "1.0.0"`
  - [ ] `src-tauri/Cargo.toml` → `version = "1.0.0"`
  - [ ] `src-tauri/tauri.conf.json` → `"version": "1.0.0"`

## Create Release

```bash
# Commit changes
git add .
git commit -m "Release v1.0.0"

# Create and push tag
git tag v1.0.0
git push origin main
git push origin v1.0.0
```

## Verify Release

- [ ] GitHub Actions workflow completes successfully
- [ ] New release appears in GitHub Releases page
- [ ] Release includes:
  - [ ] .msi installer file
  - [ ] latest.json update manifest
  - [ ] Release notes
- [ ] Download and test .msi installer

## Post-Release

- [ ] Install v1.0.0 on test machine
- [ ] Verify app launches correctly
- [ ] Test wallpaper mode
- [ ] Test all UI features

## For Next Release (v1.0.1)

1. Make code changes
2. Update version numbers in all 3 files
3. Commit and tag: `git tag v1.0.1`
4. Push tag: `git push origin v1.0.1`
5. Installed apps will auto-update! 🎉

---

**Files to reference:**
- Setup guide: `PRODUCTION_READY.md`
- Release instructions: `RELEASE.md`
- Setup script: `setup-release.ps1`
