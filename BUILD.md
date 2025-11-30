# Build Scripts

This directory contains build scripts and GitHub Actions workflows for building Garage WebUI.

## Local Build

### Linux/macOS
```bash
chmod +x build.sh
./build.sh
```

### Windows
```cmd
build.bat
```

The build scripts will:
1. Install frontend dependencies
2. Build frontend (output to `dist/`)
3. Build backend binary (output to `garage-webui` or `garage-webui.exe`)

## GitHub Actions

The GitHub Actions workflow (`.github/workflows/build.yml`) automatically builds binaries for multiple platforms when you push a tag:

### Supported Platforms
- Linux (amd64, arm64)
- Windows (amd64)
- macOS (amd64, arm64)

### Creating a Release

1. Tag your commit:
```bash
git tag v1.0.0
git push origin v1.0.0
```

2. GitHub Actions will automatically:
   - Build frontend
   - Build backend for all platforms
   - Create a GitHub Release
   - Upload binaries as release assets

## Manual Build

If you want to build manually:

### Frontend
```bash
pnpm install
pnpm run build
```

### Backend
```bash
cd backend
go build -ldflags="-s -w" -o ../garage-webui .
```

## Cross-compilation

To build for a different platform:

```bash
# Linux ARM64
GOOS=linux GOARCH=arm64 go build -o garage-webui-linux-arm64 .

# Windows
GOOS=windows GOARCH=amd64 go build -o garage-webui-windows.exe .

# macOS ARM64 (M1/M2)
GOOS=darwin GOARCH=arm64 go build -o garage-webui-darwin-arm64 .
```

## Output Structure

After building, you'll have:
```
.
├── garage-webui (or .exe)    # Backend binary
├── dist/                      # Frontend static files
├── backend/.env               # Configuration (copy from .env.example)
└── README.md
```

## Running

1. Configure `backend/.env`:
```bash
cp backend/.env.example backend/.env
# Edit .env with your Garage server details
```

2. Run the binary:
```bash
./garage-webui
```

The server will start on `http://0.0.0.0:3909` by default.
