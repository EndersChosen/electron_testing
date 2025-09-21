# Canvas Electron App - Organized Structure

This project has been reorganized to follow Electron best practices with a clean folder structure.

## Project Structure

```
canvas-electron-app/
├── src/
│   ├── main/                 # Main process files
│   │   ├── main.js          # Electron main process
│   │   └── preload.js       # Preload script
│   ├── renderer/            # Renderer process files  
│   │   ├── *.html           # HTML pages
│   │   ├── *.css            # Stylesheets
│   │   └── *_renderer.js    # Renderer scripts
│   └── shared/              # Shared utilities
│       ├── canvas-api/      # Canvas LMS API modules
│       ├── utilities.js     # General utilities
│       ├── csvExporter.js   # CSV export functionality
│       ├── pagination.js    # API pagination helper
│       └── progress-utils.js # Progress tracking
├── tests/                   # Test files
├── docs/                    # Documentation
├── data/                    # Data files and configs
├── scripts/                 # Build and utility scripts
├── assets/                  # Static assets (images, etc.)
├── package.json            # Project configuration
└── forge.config.js         # Electron Forge configuration
```

## Key Improvements

1. **Separated Concerns**: Main process, renderer process, and shared code are in separate folders
2. **Organized API Modules**: Canvas API modules are grouped in `src/shared/canvas-api/`
3. **Clean Dependencies**: Utilities and helpers are organized by function
4. **Standard Structure**: Follows Electron and Node.js best practices
5. **Better Documentation**: All docs are in the `docs/` folder
6. **Test Organization**: All tests are in the `tests/` folder

## Running the App

```bash
cd canvas-electron-app
npm install  # Only needed if node_modules was not copied
npm start
```

## Development

- Main process entry point: `src/main/main.js`
- Renderer files: `src/renderer/`
- Shared utilities: `src/shared/`
- Tests: `npm test`