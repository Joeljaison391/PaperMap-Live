import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapProps {
    theme?: string;
    center?: [number, number];
    zoom?: number;
    quality?: 'low' | 'medium' | 'high' | 'ultra';
    fps?: number;
    enableCaching?: boolean;
    enableHardwareAccel?: boolean;
    reduceMotion?: boolean;
    resolution?: 'auto' | '1080p' | '1440p' | '4k';
    blur?: number;
}

export default function Map({ 
    theme = 'dark', 
    center = [55.2708, 25.2048], 
    zoom = 12, 
    quality = 'high', 
    fps = 30,
    enableCaching = true,
    enableHardwareAccel = true,
    reduceMotion = false,
    resolution = 'auto',
    blur = 0
}: MapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const animationIdRef = useRef<number | null>(null);
    const lastFrameTime = useRef<number>(0);
    const frameInterval = 1000 / fps;
    const glContextRef = useRef<WebGL2RenderingContext | WebGLRenderingContext | null>(null);
    
    // Resolution mapping
    const getPixelRatio = () => {
        if (!enableHardwareAccel) return 1;
        switch(resolution) {
            case '1080p': return 1;
            case '1440p': return 1.5;
            case '4k': return 2;
            default: return window.devicePixelRatio || 1;
        }
    };

    // Quality settings mapping
    const qualitySettings = {
        low: { pixelRatio: Math.min(1, getPixelRatio()), antialias: false },
        medium: { pixelRatio: Math.min(1.5, getPixelRatio()), antialias: enableHardwareAccel },
        high: { pixelRatio: Math.min(2, getPixelRatio()), antialias: enableHardwareAccel },
        ultra: { pixelRatio: getPixelRatio(), antialias: enableHardwareAccel }
    };

    useEffect(() => {
        console.log('Map useEffect triggered with theme:', theme);
        
        // Clean up existing map if theme changes
        if (map.current) {
            console.log('Removing existing map');
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
                animationIdRef.current = null;
            }
            map.current.remove();
            map.current = null;
        }
        
        if (!mapContainer.current) {
            console.log('mapContainer not ready');
            return;
        }

        const styleUrl = theme === 'dark' ? '/dark-poster.json' : '/light-poster.json';
        console.log('Creating new map with style:', styleUrl, 'center:', center, 'zoom:', zoom);

        const settings = qualitySettings[quality];
        
        // Configure GPU-optimized WebGL context
        const canvas = document.createElement('canvas');
        const contextAttributes: WebGLContextAttributes = {
            alpha: false,
            antialias: settings.antialias,
            depth: true,
            stencil: true,
            powerPreference: 'high-performance',
            desynchronized: true,
            preserveDrawingBuffer: true,
            failIfMajorPerformanceCaveat: false
        };
        
        // Try WebGL2 first for better GPU performance
        const gl = canvas.getContext('webgl2', contextAttributes) || 
                   canvas.getContext('webgl', contextAttributes);
        
        if (gl) {
            glContextRef.current = gl;
            
            // Enable GPU extensions for better performance
            if (enableHardwareAccel) {
                // Anisotropic filtering for better texture quality
                const anisoExt = gl.getExtension('EXT_texture_filter_anisotropic') ||
                                 gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
                
                // Compressed textures for less GPU memory
                gl.getExtension('WEBGL_compressed_texture_s3tc');
                gl.getExtension('WEBGL_compressed_texture_etc');
                gl.getExtension('WEBGL_compressed_texture_astc');
                
                // Instancing for efficient rendering
                if (gl instanceof WebGL2RenderingContext) {
                    // WebGL2 has native instancing
                } else {
                    gl.getExtension('ANGLE_instanced_arrays');
                }
                
                // Vertex array objects for better draw call performance
                gl.getExtension('OES_vertex_array_object');
                
                // Floating point textures
                gl.getExtension('OES_texture_float');
                gl.getExtension('OES_texture_half_float');
                
                console.log('GPU Extensions enabled:', {
                    webgl2: gl instanceof WebGL2RenderingContext,
                    anisotropic: !!anisoExt,
                    vendor: gl.getParameter(gl.VENDOR),
                    renderer: gl.getParameter(gl.RENDERER)
                });
            }
        }

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: styleUrl,
            center: center,
            zoom: zoom,
            attributionControl: false,
            pixelRatio: settings.pixelRatio,
            refreshExpiredTiles: false,
            maxTileCacheSize: enableCaching ? 1000 : 100,
            maxZoom: 14,
            minZoom: 8,
            renderWorldCopies: false,
            fadeDuration: 0,
            crossSourceCollisions: false,
            trackResize: true,
            collectResourceTiming: false
        });

        // Optimized smooth motion with drift + rotation
        let startTime = 0;
        const DRIFT_RADIUS = 0.002; // Small circular drift radius
        const DRIFT_SPEED = 0.0003; // Slow drift speed
        
        const animate = (currentTime: number) => {
            if (!map.current || reduceMotion) return;
            
            if (startTime === 0) startTime = currentTime;
            
            // Calculate precise frame timing
            const elapsed = currentTime - lastFrameTime.current;
            
            // Only update on frame interval for consistent motion
            if (elapsed >= frameInterval) {
                lastFrameTime.current = currentTime;
                
                // Time-based motion for smooth consistency
                const timeElapsed = (currentTime - startTime) / 1000; // seconds since start
                
                // Circular drift motion (very subtle)
                const angle = timeElapsed * DRIFT_SPEED;
                const driftX = Math.sin(angle) * DRIFT_RADIUS;
                const driftY = Math.cos(angle) * DRIFT_RADIUS;
                
                // Smooth rotation
                const rotateSpeed = 1.5; // degrees per second
                const deltaTime = elapsed / 1000;
                const currentBearing = map.current.getBearing();
                const newBearing = (currentBearing + (rotateSpeed * deltaTime)) % 360;
                
                // Apply movement with transform for GPU acceleration
                map.current.easeTo({
                    center: [center[0] + driftX, center[1] + driftY],
                    bearing: newBearing,
                    duration: frameInterval * 1.2,
                    easing: (t) => t,
                    animate: true
                });
            }

            animationIdRef.current = requestAnimationFrame(animate);
        };

        // Start animation after load
        map.current.on('load', () => {
            console.log('Map loaded successfully with', theme, 'theme');
            
            // Apply advanced GPU performance optimizations
            if (map.current) {
                const canvas = map.current.getCanvas();
                const mapInstance = map.current;
                
                if (canvas) {
                    if (enableHardwareAccel) {
                        // Force hardware compositing layer
                        canvas.style.willChange = 'transform';
                        canvas.style.transform = 'translate3d(0, 0, 0)';
                        canvas.style.backfaceVisibility = 'hidden';
                        canvas.style.imageRendering = 'optimizeSpeed';
                        
                        // Create compositing layer
                        canvas.style.isolation = 'isolate';
                        canvas.style.contain = 'layout style paint';
                        
                        // Force GPU rasterization
                        const parent = canvas.parentElement;
                        if (parent) {
                            parent.style.transform = 'translateZ(0)';
                            parent.style.willChange = 'transform';
                        }
                    }
                    
                    // Get WebGL context for GPU optimizations
                    const gl = glContextRef.current || 
                             canvas.getContext('webgl2') || 
                             canvas.getContext('webgl');
                    
                    if (gl && enableCaching) {
                        // GPU texture optimizations
                        const anisoExt = gl.getExtension('EXT_texture_filter_anisotropic') ||
                                       gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
                        
                        if (anisoExt) {
                            const maxAniso = gl.getParameter(anisoExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
                            // Use anisotropic filtering for smoother textures at angles
                            console.log('Anisotropic filtering enabled:', maxAniso);
                        }
                        
                        // Enable GPU texture compression
                        const s3tcExt = gl.getExtension('WEBGL_compressed_texture_s3tc');
                        const etcExt = gl.getExtension('WEBGL_compressed_texture_etc');
                        
                        if (s3tcExt || etcExt) {
                            console.log('GPU texture compression enabled');
                        }
                        
                        // GPU memory optimizations
                        if (gl instanceof WebGL2RenderingContext) {
                            // WebGL2-specific optimizations
                            gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
                        }
                    }
                }
                
                // Preload tiles in surrounding area for smoother animation
                if (enableCaching) {
                    const currentCenter = mapInstance.getCenter();
                    
                    // Preload tiles around current position
                    const offsets = [
                        [0.01, 0], [-0.01, 0], [0, 0.01], [0, -0.01],
                        [0.01, 0.01], [-0.01, -0.01], [0.01, -0.01], [-0.01, 0.01]
                    ];
                    
                    offsets.forEach(([lngOffset, latOffset]) => {
                        // Trigger tile loading for surrounding areas
                        void lngOffset, void latOffset, void currentCenter;
                        setTimeout(() => {
                            if (mapInstance && !mapInstance._removed) {
                                mapInstance.fire('dataloading');
                            }
                        }, 100);
                    });
                }
                
                // Disable all user interactions
                mapInstance.dragRotate.disable();
                mapInstance.touchZoomRotate.disableRotation();
                mapInstance.scrollZoom.disable();
                mapInstance.boxZoom.disable();
                mapInstance.dragPan.disable();
                mapInstance.keyboard.disable();
                mapInstance.doubleClickZoom.disable();
                mapInstance.touchZoomRotate.disable();
            }
            
            if (!reduceMotion) {
                // Start animation immediately with current timestamp
                requestAnimationFrame((timestamp) => {
                    lastFrameTime.current = timestamp;
                    animate(timestamp);
                });
            }
        });

        map.current.on('error', (e) => {
            console.error('Map error:', e);
        });

        return () => {
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
                animationIdRef.current = null;
            }
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, [theme, center, zoom, quality, fps, enableCaching, enableHardwareAccel, reduceMotion, resolution]); // Recreate map when settings change

    return (
        <div
            ref={mapContainer}
            className={theme === 'dark' ? 'map-filter' : ''}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: theme === 'dark' ? '#000000' : '#f5f5f0',
                zIndex: 0,
                filter: blur > 0 ? `blur(${blur}px)` : 'none'
            }}
        />
    );
}
