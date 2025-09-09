# Entity Renewal Pro Desktop Shortcuts

Entity Renewal Pro now supports Progressive Web App (PWA) installation for a native desktop experience.

## Automatic PWA Installation

When you visit Entity Renewal Pro in a supported browser, you'll see an install prompt in the bottom-right corner. Click "Install App" to add it to your desktop.

### Supported Browsers:
- **Chrome/Edge**: Full PWA support with "Add to desktop" option
- **Firefox**: Limited PWA support
- **Safari**: iOS/macOS "Add to Home Screen" functionality

## Manual Installation Methods

### Google Chrome / Microsoft Edge:
1. Visit the Entity Renewal Pro website
2. Click the three dots menu (⋮) in the top-right
3. Select "Install Entity Renewal Pro..." or "Apps" > "Install this site as an app"
4. Click "Install" in the dialog
5. The app will open in a new window and appear on your desktop/start menu

### Firefox:
1. Visit the Entity Renewal Pro website
2. Click the three lines menu (☰) in the top-right  
3. Select "Page" > "Install Page as App"
4. Choose installation location and click "Install"

### Safari (macOS):
1. Visit the Entity Renewal Pro website
2. Click "File" in the menu bar
3. Select "Add to Dock..." 
4. Choose a name and click "Add"

### Manual Shortcut Creation:

#### Windows (.url file):
Create a text file named `Entity Renewal Pro.url` with:
```
[InternetShortcut]
URL=https://www.entityrenewalpro.com/
IconFile=%USERPROFILE%\Downloads\icon-512.png
IconIndex=0
```

#### macOS (.webloc file):
Create a text file named `Entity Renewal Pro.webloc` with:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>URL</key>
    <string>https://www.entityrenewalpro.com/</string>
</dict>
</plist>
```

#### Linux (.desktop file):
Create a text file named `entity-renewal-pro.desktop` with:
```
[Desktop Entry]
Version=1.0
Type=Application
Name=Entity Renewal Pro
Comment=Professional Business Entity Management
Exec=xdg-open https://www.entityrenewalpro.com/
Icon=/path/to/icon-512.png
Terminal=false
Categories=Office;Finance;
```

## PWA Features:
- **Offline Access**: Basic functionality when internet is unavailable
- **Native Look**: Runs without browser UI elements
- **Desktop Integration**: Appears in taskbar and application menus
- **Quick Launch**: Direct access from desktop or start menu
- **App Shortcuts**: Quick access to Dashboard and Entities pages

## Icon Assets:
The following icon files are available for manual shortcut creation:
- `icon-64.png` - 64x64 pixels (small icons)
- `icon-192.png` - 192x192 pixels (standard size)
- `icon-512.png` - 512x512 pixels (high resolution)

Download these from the website's public folder for use in manual shortcuts.