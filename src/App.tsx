import { useState, useEffect } from "react";
import Map from "./components/Map";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { availableMonitors, primaryMonitor } from "@tauri-apps/api/window";
import { PhysicalPosition, PhysicalSize } from "@tauri-apps/api/dpi";
import "./App.css";

// Common locations with coordinates
const LOCATIONS: Record<string, { coords: [number, number], zoom: number, displayCoords: string }> = {
  'DUBAI': { coords: [55.2708, 25.2048], zoom: 7, displayCoords: '25.2048° N, 55.2708° E' },
  'NEW YORK': { coords: [-74.0060, 40.7128], zoom: 7, displayCoords: '40.7128° N, 74.0060° W' },
  'TOKYO': { coords: [139.6917, 35.6762], zoom: 7, displayCoords: '35.6762° N, 139.6917° E' },
  'LONDON': { coords: [-0.1278, 51.5074], zoom: 7, displayCoords: '51.5074° N, 0.1278° W' },
  'PARIS': { coords: [2.3522, 48.8566], zoom: 7, displayCoords: '48.8566° N, 2.3522° E' },
  'SINGAPORE': { coords: [103.8198, 1.3521], zoom: 7, displayCoords: '1.3521° N, 103.8198° E' },
  'HONG KONG': { coords: [114.1694, 22.3193], zoom: 7, displayCoords: '22.3193° N, 114.1694° E' },
  'LOS ANGELES': { coords: [-118.2437, 34.0522], zoom: 7, displayCoords: '34.0522° N, 118.2437° W' },
  'INDIA': { coords: [77.2090, 28.6139], zoom: 7, displayCoords: '28.6139° N, 77.2090° E' },
};

function App() {
  const [isWallpaperMode, setIsWallpaperMode] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [city, setCity] = useState("DUBAI");
  const [theme, setTheme] = useState("dark"); // 'light' or 'dark'
  const [mapCenter, setMapCenter] = useState<[number, number]>([55.2708, 25.2048]);
  const [mapZoom, setMapZoom] = useState(7);
  const [coords, setCoords] = useState("25.2048° N, 55.2708° E");
  const [quality, setQuality] = useState<'low' | 'medium' | 'high' | 'ultra'>('high');
  const [fps, setFps] = useState(30);
  
  // Text customization
  const [font, setFont] = useState('Inter');
  const [textPosition, setTextPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'>('bottom-left');
  const [padding, setPadding] = useState(80);
  const [showCoordinates, setShowCoordinates] = useState(true);
  
  // Display & Optimization
  const [selectedMonitor, setSelectedMonitor] = useState<'primary' | 'secondary' | 'all'>('primary');
  const [resolution, setResolution] = useState<'auto' | '1080p' | '1440p' | '4k'>('auto');
  const [enableCaching, setEnableCaching] = useState(true);
  const [enableHardwareAcceleration, setEnableHardwareAcceleration] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [mapBlur, setMapBlur] = useState(0);
  
  // Tab navigation
  const [activeTab, setActiveTab] = useState<'location' | 'typography' | 'performance' | 'display'>('location');

  // Apply monitor selection and resolution settings
  useEffect(() => {
    const applyDisplaySettings = async () => {
      try {
        const window = getCurrentWindow();
        const monitors = await availableMonitors();
        const primary = await primaryMonitor();
        
        if (monitors.length === 0 || !primary) {
          console.warn('No monitors detected');
          return;
        }

        let targetMonitor = primary;
        
        if (selectedMonitor === 'secondary' && monitors.length > 1) {
          // Find the first non-primary monitor
          targetMonitor = monitors.find(m => m.name !== primary.name) || primary;
        } else if (selectedMonitor === 'all') {
          // For "all monitors", position on primary and maximize
          targetMonitor = primary;
        }

        // Calculate window size based on resolution setting
        let targetWidth = targetMonitor.size.width;
        let targetHeight = targetMonitor.size.height;
        
        if (resolution !== 'auto') {
          switch (resolution) {
            case '1080p':
              targetWidth = 1920;
              targetHeight = 1080;
              break;
            case '1440p':
              targetWidth = 2560;
              targetHeight = 1440;
              break;
            case '4k':
              targetWidth = 3840;
              targetHeight = 2160;
              break;
          }
          
          // Don't exceed monitor size
          targetWidth = Math.min(targetWidth, targetMonitor.size.width);
          targetHeight = Math.min(targetHeight, targetMonitor.size.height);
        }

        // Position window on target monitor
        const position = new PhysicalPosition(
          targetMonitor.position.x,
          targetMonitor.position.y
        );
        
        const size = new PhysicalSize(targetWidth, targetHeight);
        
        await window.setPosition(position);
        await window.setSize(size);
        
        // For "all monitors", maximize the window
        if (selectedMonitor === 'all') {
          await window.maximize();
        }
        
        console.log(`Window positioned on ${selectedMonitor} monitor at ${resolution}`);
      } catch (error) {
        console.error('Failed to apply display settings:', error);
      }
    };

    applyDisplaySettings();
  }, [selectedMonitor, resolution]);

  // Update location when city changes
  const updateLocation = (cityName: string) => {
    const upperCity = cityName.toUpperCase();
    if (LOCATIONS[upperCity]) {
      const loc = LOCATIONS[upperCity];
      setMapCenter(loc.coords);
      setMapZoom(loc.zoom);
      setCoords(loc.displayCoords);
      setCity(cityName);
    }
  };

  // Get text position styles
  const getTextPositionStyle = () => {
    const base: React.CSSProperties = {};
    switch (textPosition) {
      case 'top-left':
        return { ...base, top: padding, left: padding };
      case 'top-right':
        return { ...base, top: padding, right: padding };
      case 'bottom-right':
        return { ...base, bottom: padding, right: padding };
      case 'center':
        return { ...base, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
      default: // bottom-left
        return { ...base, bottom: padding, left: padding };
    }
  };

  const handlePreview = () => {
    setIsPreviewMode(true);
    setTimeout(() => {
      setIsPreviewMode(false);
    }, 10000);
  };

  const handleLaunch = async () => {
    setIsWallpaperMode(true);
    await invoke("refresh_wallpaper");
  };

  const handleExit = () => {
    window.location.reload();
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Map 
        theme={theme} 
        center={mapCenter} 
        zoom={mapZoom} 
        quality={quality} 
        fps={fps}
        enableCaching={enableCaching}
        enableHardwareAccel={enableHardwareAcceleration}
        reduceMotion={reduceMotion}
        resolution={resolution}
        blur={mapBlur}
      />

      {(isWallpaperMode || isPreviewMode) ? (
        // Wallpaper/Preview Mode Overlays (Poster and Controls)
        <>
          {/* Poster Overlay - High End Typography */}
          <div style={{
            position: 'absolute',
            ...getTextPositionStyle(),
            color: theme === 'dark' ? '#ffffff' : '#1a1a1a',
            zIndex: 10,
            pointerEvents: 'none',
            animation: 'fadeIn 1.5s ease-out',
            textAlign: textPosition === 'center' ? 'center' : 'left'
          }}>
            <h1 style={{
              fontSize: '8rem',
              margin: 0,
              letterSpacing: '-0.04em',
              lineHeight: 0.85,
              textTransform: 'uppercase',
              fontFamily: font === 'Inter' || font === 'Roboto' || font === 'Playfair Display' || font === 'Montserrat' ? `${font}, sans-serif` : font,
              fontWeight: 900,
              color: theme === 'dark' ? '#ffffff' : '#000000'
            }}>{city}</h1>

            {showCoordinates && (
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginTop: '20px', justifyContent: textPosition === 'center' ? 'center' : 'flex-start' }}>
                <div style={{ height: '1px', width: '80px', background: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}></div>
                <p style={{ margin: 0, fontSize: '1rem', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.8, fontWeight: 500 }}>
                  {coords}
                </p>
              </div>
            )}
          </div>

          {/* Floating Controls (Fade in on hover) */}
          <div
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              zIndex: 100,
              opacity: 0,
              transition: 'opacity 0.3s ease',
              pointerEvents: 'auto'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
          >
            <button
              onClick={handleExit}
              className="glass-card"
              style={{
                padding: '0.8rem 1.5rem',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600
              }}
            >
              Exit Wallpaper
            </button>
            {/* Hint visible always lightly */}
            <div style={{
              position: 'absolute', top: 10, right: 0,
              width: '200px', height: '50px',
              pointerEvents: 'none',
              opacity: 0.2 // Hit area hint visual
            }}></div>
          </div>

          {/* Invisible hit area for the exit button prompt */}
          <div
            style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '80px', zIndex: 99 }}
            onMouseEnter={(e) => {
              const sibling = e.currentTarget.previousElementSibling as HTMLElement;
              if (sibling) sibling.style.opacity = '1';
            }}
          ></div>
        </>
      ) : (
        // Configuration UI (Overlaying the map)
        <div className={theme === 'dark' ? 'aurora-bg' : ''} style={{
          position: 'absolute',
          top: 0, left: 0, width: '100%', height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10,
          background: theme === 'dark' ? 'rgba(0,0,0,0.4)' : 'transparent' // slight tint over map
        }}>

          <div className="glass-card" style={{
            padding: '3rem',
            width: '100%',
            maxWidth: '500px',
            animation: 'float 6s infinite ease-in-out',
            background: theme === 'dark' ? 'rgba(20, 20, 20, 0.75)' : 'rgba(255, 255, 255, 0.92)'
          }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', textAlign: 'center', fontWeight: 800, letterSpacing: '-0.02em', color: theme === 'dark' ? 'white' : '#1a1a1a' }}>
              PaperMap Live
            </h1>
            <p style={{ textAlign: 'center', opacity: 0.6, marginBottom: '2rem', fontSize: '0.95rem', color: theme === 'dark' ? 'white' : '#333' }}>
              High-Fidelity Map Wallpaper Engine
            </p>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', overflowX: 'auto' }}>
              {[{id: 'location', label: '📍 Location'}, {id: 'typography', label: '✏️ Text'}, {id: 'display', label: '🖥️ Display'}, {id: 'performance', label: '⚡ Performance'}].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    flex: 1,
                    padding: '0.8rem',
                    background: 'transparent',
                    color: theme === 'dark' ? 'white' : '#1a1a1a',
                    border: 'none',
                    borderBottom: activeTab === tab.id ? (theme === 'dark' ? '2px solid #ffd700' : '2px solid #ffaa00') : '2px solid transparent',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: activeTab === tab.id ? 700 : 500,
                    opacity: activeTab === tab.id ? 1 : 0.6,
                    transition: 'all 0.2s'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Location & Theme Tab */}
            {activeTab === 'location' && (
              <div style={{ minHeight: '300px' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.8rem', opacity: 0.8, fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', color: theme === 'dark' ? 'white' : '#333' }}>LOCATION</label>
                  <select
                    value={city}
                    onChange={(e) => updateLocation(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      borderRadius: '12px',
                      fontSize: '1.1rem',
                      boxSizing: 'border-box',
                      background: theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.6)',
                      color: theme === 'dark' ? 'white' : '#1a1a1a',
                      border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                      cursor: 'pointer'
                    }}
                  >
                    {Object.keys(LOCATIONS).map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.8rem', opacity: 0.8, fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', color: theme === 'dark' ? 'white' : '#333' }}>THEME</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button
                      onClick={() => setTheme('dark')}
                      style={{
                        padding: '1rem',
                        background: theme === 'dark' ? '#1a1a1a' : 'rgba(0,0,0,0.05)',
                        color: theme === 'dark' ? 'white' : '#666',
                        border: theme === 'dark' ? '2px solid #ffd700' : '1px solid rgba(0,0,0,0.1)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                      }}
                    >
                      🌙 Dark
                    </button>
                    <button
                      onClick={() => setTheme('light')}
                      style={{
                        padding: '1rem',
                        background: theme === 'light' ? 'white' : 'rgba(255,255,255,0.05)',
                        color: theme === 'light' ? '#1a1a1a' : '#999',
                        border: theme === 'light' ? '2px solid #ffaa00' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                      }}
                    >
                      ☀️ Light
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Typography Tab */}
            {activeTab === 'typography' && (
              <div style={{ minHeight: '300px' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.8rem', opacity: 0.8, fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', color: theme === 'dark' ? 'white' : '#333' }}>FONT FAMILY</label>
                  <select
                    value={font}
                    onChange={(e) => setFont(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      borderRadius: '12px',
                      fontSize: '1.1rem',
                      background: theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.6)',
                      color: theme === 'dark' ? 'white' : '#1a1a1a',
                      border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Playfair Display">Playfair Display</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Arial">Arial</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.8rem', opacity: 0.8, fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', color: theme === 'dark' ? 'white' : '#333' }}>TEXT POSITION</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    {[
                      { value: 'top-left', label: '↖️ Top Left' },
                      { value: 'top-right', label: '↗️ Top Right' },
                      { value: 'bottom-left', label: '↙️ Bottom Left' },
                      { value: 'bottom-right', label: '↘️ Bottom Right' },
                      { value: 'center', label: '🎯 Center' }
                    ].map(pos => (
                      <button
                        key={pos.value}
                        onClick={() => setTextPosition(pos.value as any)}
                        style={{
                          padding: '0.8rem',
                          background: textPosition === pos.value ? (theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)') : 'transparent',
                          color: theme === 'dark' ? 'white' : '#1a1a1a',
                          border: theme === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.2)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          transition: 'all 0.2s',
                          gridColumn: pos.value === 'center' ? 'span 2' : 'auto'
                        }}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.8rem', opacity: 0.8, fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', color: theme === 'dark' ? 'white' : '#333' }}>PADDING: {padding}px</label>
                  <input
                    type="range"
                    min="20"
                    max="200"
                    value={padding}
                    onChange={(e) => setPadding(parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      accentColor: theme === 'dark' ? '#ffd700' : '#ffaa00'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.8rem',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    padding: '1rem',
                    background: theme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
                    borderRadius: '10px',
                    color: theme === 'dark' ? 'white' : '#333'
                  }}>
                    <input
                      type="checkbox"
                      checked={showCoordinates}
                      onChange={(e) => setShowCoordinates(e.target.checked)}
                      style={{
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        accentColor: theme === 'dark' ? '#ffd700' : '#ffaa00'
                      }}
                    />
                    <span>Show Coordinates</span>
                  </label>
                </div>
              </div>
            )}

            {/* Display Tab */}
            {activeTab === 'display' && (
              <div style={{ minHeight: '300px' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.8rem', opacity: 0.8, fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', color: theme === 'dark' ? 'white' : '#333' }}>MONITOR SELECTION</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
                    {[
                      { value: 'primary', label: '🖥️ Primary', desc: 'Main display' },
                      { value: 'secondary', label: '🖥️ Secondary', desc: 'Extended display' },
                      { value: 'all', label: '🖥️🖥️ All', desc: 'Span across' }
                    ].map(mon => (
                      <button
                        key={mon.value}
                        onClick={() => setSelectedMonitor(mon.value as any)}
                        style={{
                          padding: '1rem 0.5rem',
                          background: selectedMonitor === mon.value ? (theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)') : 'transparent',
                          color: theme === 'dark' ? 'white' : '#1a1a1a',
                          border: selectedMonitor === mon.value ? (theme === 'dark' ? '2px solid #ffd700' : '2px solid #ffaa00') : (theme === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.2)'),
                          borderRadius: '10px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          transition: 'all 0.2s',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.3rem'
                        }}
                      >
                        <div>{mon.label}</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{mon.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.8rem', opacity: 0.8, fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', color: theme === 'dark' ? 'white' : '#333' }}>RESOLUTION</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    {[
                      { value: 'auto', label: 'Auto', desc: 'Native resolution' },
                      { value: '1080p', label: '1080p', desc: '1920×1080' },
                      { value: '1440p', label: '1440p', desc: '2560×1440' },
                      { value: '4k', label: '4K', desc: '3840×2160' }
                    ].map(res => (
                      <button
                        key={res.value}
                        onClick={() => setResolution(res.value as any)}
                        style={{
                          padding: '0.8rem',
                          background: resolution === res.value ? (theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)') : 'transparent',
                          color: theme === 'dark' ? 'white' : '#1a1a1a',
                          border: resolution === res.value ? (theme === 'dark' ? '2px solid #ffd700' : '2px solid #ffaa00') : (theme === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.2)'),
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          transition: 'all 0.2s',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.2rem'
                        }}
                      >
                        <div style={{ fontWeight: 700 }}>{res.label}</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{res.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ padding: '1rem', background: theme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)', borderRadius: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '1rem', opacity: 0.8, fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', color: theme === 'dark' ? 'white' : '#333' }}>OPTIMIZATION</label>
                  
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.8rem',
                    marginBottom: '0.8rem',
                    background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: theme === 'dark' ? 'white' : '#1a1a1a' }}>🗄️ Tile Caching</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.6, color: theme === 'dark' ? 'white' : '#333' }}>Cache map tiles locally</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableCaching}
                      onChange={(e) => setEnableCaching(e.target.checked)}
                      style={{
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        accentColor: theme === 'dark' ? '#ffd700' : '#ffaa00'
                      }}
                    />
                  </label>

                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.8rem',
                    marginBottom: '0.8rem',
                    background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: theme === 'dark' ? 'white' : '#1a1a1a' }}>🚀 Hardware Acceleration</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.6, color: theme === 'dark' ? 'white' : '#333' }}>Use GPU for rendering</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableHardwareAcceleration}
                      onChange={(e) => setEnableHardwareAcceleration(e.target.checked)}
                      style={{
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        accentColor: theme === 'dark' ? '#ffd700' : '#ffaa00'
                      }}
                    />
                  </label>

                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.8rem',
                    background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: theme === 'dark' ? 'white' : '#1a1a1a' }}>🎯 Reduce Motion</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.6, color: theme === 'dark' ? 'white' : '#333' }}>Static map (no animation)</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={reduceMotion}
                      onChange={(e) => setReduceMotion(e.target.checked)}
                      style={{
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        accentColor: theme === 'dark' ? '#ffd700' : '#ffaa00'
                      }}
                    />
                  </label>

                  {/* Map Blur Slider */}
                  <div style={{
                    padding: '0.8rem',
                    marginTop: '0.8rem',
                    background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ marginBottom: '0.8rem' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: theme === 'dark' ? 'white' : '#1a1a1a' }}>🌫️ Map Blur</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.6, color: theme === 'dark' ? 'white' : '#333' }}>Soften map details ({mapBlur}px)</div>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="15" 
                      value={mapBlur} 
                      onChange={(e) => setMapBlur(Number(e.target.value))} 
                      style={{ width: '100%', accentColor: theme === 'dark' ? '#ffd700' : '#ffaa00' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <div style={{ minHeight: '300px' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.8rem', opacity: 0.8, fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', color: theme === 'dark' ? 'white' : '#333' }}>QUALITY PRESET</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    {['low', 'medium', 'high', 'ultra'].map((q) => (
                      <button
                        key={q}
                        onClick={() => setQuality(q as any)}
                        style={{
                          padding: '1rem',
                          background: quality === q ? (theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)') : 'transparent',
                          color: theme === 'dark' ? 'white' : '#1a1a1a',
                          border: quality === q ? (theme === 'dark' ? '2px solid #ffd700' : '2px solid #ffaa00') : (theme === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.2)'),
                          borderRadius: '10px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: quality === q ? 700 : 500,
                          textTransform: 'capitalize',
                          transition: 'all 0.2s'
                        }}
                      >
                        {q === 'low' && '🔋 '}{q === 'medium' && '⚙️ '}{q === 'high' && '💎 '}{q === 'ultra' && '🚀 '}{q}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem', padding: '1.5rem', background: theme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)', borderRadius: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '1rem', opacity: 0.8, fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', color: theme === 'dark' ? 'white' : '#333' }}>FRAME RATE: {fps} FPS</label>
                  <input
                    type="range"
                    min="15"
                    max="60"
                    step="15"
                    value={fps}
                    onChange={(e) => setFps(parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      accentColor: theme === 'dark' ? '#ffd700' : '#ffaa00'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.7rem', opacity: 0.6, color: theme === 'dark' ? 'white' : '#333' }}>
                    <span>Battery Saver</span>
                    <span>Smooth</span>
                  </div>
                </div>

                <div style={{ padding: '1rem', background: theme === 'dark' ? 'rgba(255,215,0,0.1)' : 'rgba(255,170,0,0.1)', borderRadius: '10px', border: theme === 'dark' ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(255,170,0,0.3)' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: theme === 'dark' ? '#ffd700' : '#cc8800' }}>
                    💡 <strong>Tip:</strong> Lower quality and FPS for better battery life
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handlePreview}
              style={{
                width: '100%',
                padding: '1rem',
                border: theme === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.2)',
                borderRadius: '12px',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                background: 'transparent',
                color: theme === 'dark' ? 'white' : '#1a1a1a',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '1rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              Preview (10s)
            </button>

            <button
              onClick={handleLaunch}
              className="glow-button"
              style={{
                width: '100%',
                padding: '1.2rem',
                border: 'none',
                borderRadius: '16px',
                fontSize: '1.1rem',
                fontWeight: '800',
                cursor: 'pointer',
                color: '#1a1a1a',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Activate Wallpaper
            </button>

            <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', opacity: 0.4, color: theme === 'dark' ? 'white' : '#333' }}>
              v0.1.0 • Built with Tauri & Rust
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
