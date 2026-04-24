import React, { useCallback, useEffect, useRef, useState } from 'react';

// ---- MediaPipe Types ----
interface Landmark { x: number; y: number; z: number; }

// ---- Domain Types ----
type GestureKey = 'fist' | 'open' | 'point' | 'peace' | 'thumbsup' | 'thumbsdown' | 'ok' | 'call';
type DeviceType = 'light' | 'fan' | 'curtain' | 'thermostat' | 'tv' | 'alarm' | 'ac' | 'lock';
type LogCategory = 'SYSTEM' | 'GESTURE' | 'DEVICE' | 'ACTION' | 'ERROR';

interface Device {
  id: string;
  name: string;
  emoji: string;
  location: string;
  type: DeviceType;
  on: boolean;
  value: string;
  brightness?: number;
  temp?: number;
}

interface LogEntry {
  id: number;
  time: string;
  category: LogCategory;
  msg: string;
}

// ---- Constants ----
const GESTURE_CONFIG: Record<GestureKey, { emoji: string; name: string; desc: string; key: string }> = {
  fist:       { emoji: '✊', name: 'FIST',        desc: 'Toggle all lights off',  key: 'ALL OFF'  },
  open:       { emoji: '🖐', name: 'OPEN HAND',   desc: 'Toggle all lights on',   key: 'ALL ON'   },
  point:      { emoji: '☝️', name: 'POINT UP',    desc: 'Toggle curtains',        key: 'CURTAINS' },
  peace:      { emoji: '✌️', name: 'PEACE / V',   desc: 'Toggle fan',             key: 'FAN'      },
  thumbsup:   { emoji: '👍', name: 'THUMBS UP',   desc: 'Raise thermostat +1°C',  key: 'TEMP ↑'   },
  thumbsdown: { emoji: '👎', name: 'THUMBS DOWN', desc: 'Lower thermostat -1°C',  key: 'TEMP ↓'   },
  ok:         { emoji: '👌', name: 'OK SIGN',     desc: 'Toggle TV / display',    key: 'TV'       },
  call:       { emoji: '🤙', name: 'CALL ME',     desc: 'Toggle alarm system',    key: 'ALARM'    },
};

const GESTURE_KEYS = Object.keys(GESTURE_CONFIG) as GestureKey[];

const LOG_COLORS: Record<LogCategory, string> = {
  GESTURE: 'text-violet-400',
  ACTION:  'text-emerald-400',
  DEVICE:  'text-blue-400',
  ERROR:   'text-rose-400',
  SYSTEM:  'text-zinc-500',
};

// ---- Helpers ----
function getDeviceValue(d: Device): string {
  switch (d.type) {
    case 'light':      return d.on ? `${d.brightness ?? 80}%` : 'OFF';
    case 'curtain':    return d.on ? 'OPEN' : 'CLOSED';
    case 'fan':        return d.on ? 'RUNNING' : 'OFF';
    case 'tv':         return d.on ? 'ON' : 'STANDBY';
    case 'alarm':      return d.on ? 'ARMED' : 'DISARMED';
    case 'ac':         return d.on ? 'COOLING' : 'OFF';
    case 'lock':       return d.on ? 'LOCKED' : 'UNLOCKED';
    case 'thermostat': return `${d.temp ?? 22}°C`;
  }
}

function makeInitialDevices(): Device[] {
  return [
    { id: 'living-light',  name: 'Living Room Light', emoji: '💡', location: 'Living Room', type: 'light',      on: false, brightness: 80,  value: 'OFF'      },
    { id: 'bedroom-light', name: 'Bedroom Light',      emoji: '🌙', location: 'Bedroom',     type: 'light',      on: false, brightness: 60,  value: 'OFF'      },
    { id: 'kitchen-light', name: 'Kitchen Light',      emoji: '🍳', location: 'Kitchen',     type: 'light',      on: true,  brightness: 100, value: '100%'     },
    { id: 'curtains',      name: 'Curtains',           emoji: '🪟', location: 'Living Room', type: 'curtain',    on: false, value: 'CLOSED'   },
    { id: 'fan',           name: 'Ceiling Fan',        emoji: '💨', location: 'Bedroom',     type: 'fan',        on: false, value: 'OFF'      },
    { id: 'thermostat',    name: 'Thermostat',         emoji: '🌡️', location: 'Hallway',     type: 'thermostat', on: true,  temp: 22, value: '22°C'   },
    { id: 'tv',            name: 'Smart TV',           emoji: '📺', location: 'Living Room', type: 'tv',         on: false, value: 'STANDBY'  },
    { id: 'alarm',         name: 'Security System',    emoji: '🔐', location: 'Entire Home', type: 'alarm',      on: false, value: 'DISARMED' },
    { id: 'ac',            name: 'Air Conditioner',    emoji: '❄️', location: 'Living Room', type: 'ac',         on: false, value: 'OFF'      },
    { id: 'door-lock',     name: 'Smart Lock',         emoji: '🔒', location: 'Front Door',  type: 'lock',       on: true,  value: 'LOCKED'   },
  ];
}

// ---- Gesture Detection ----
function detectGesture(lm: Landmark[]): GestureKey | null {
  const up = (tip: number, pip: number) => lm[tip].y < lm[pip].y - 0.03;
  const thumb = up(4, 3), index = up(8, 7), middle = up(12, 11), ring = up(16, 15), pinky = up(20, 19);

  if (!thumb && !index && !middle && !ring && !pinky) return 'fist';
  if (thumb && index && middle && ring && pinky)       return 'open';
  if (!thumb && index && !middle && !ring && !pinky)   return 'point';
  if (!thumb && index && middle && !ring && !pinky)    return 'peace';
  if (thumb && !index && !middle && !ring && !pinky)   return lm[4].y < lm[0].y ? 'thumbsup' : 'thumbsdown';
  if (middle && ring && pinky && !index)               return 'ok';
  if (thumb && !index && !middle && !ring && pinky)    return 'call';
  return null;
}

// ---- Compact device card ----
function DeviceCard({
  d, highlighted, onToggle,
}: { d: Device; highlighted: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer select-none transition-all
        ${d.on ? 'bg-[#161b22] border-emerald-500/30' : 'bg-[#161b22] border-zinc-800/60 hover:border-zinc-700/70'}
        ${highlighted ? 'ring-1 ring-violet-500/40' : ''}
      `}
    >
      {d.on && (
        <div className="absolute inset-0 rounded-xl bg-linear-to-r from-emerald-500/4 to-transparent pointer-events-none" />
      )}
      <div className={`text-base w-8 h-8 flex items-center justify-center rounded-lg border shrink-0 transition-all ${
        d.on ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-zinc-800/60 border-zinc-700/40'
      }`}>
        {d.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-semibold leading-tight truncate ${d.on ? 'text-zinc-100' : 'text-zinc-400'}`}>
          {d.name}
        </div>
        <div className="text-[10px] text-zinc-600 font-mono mt-0.5 truncate">
          {d.location} · <span className={d.on ? 'text-zinc-400' : ''}>{d.value}</span>
        </div>
      </div>
      <div className={`relative w-8 h-4.5 rounded-full shrink-0 transition-colors duration-200 ${d.on ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
        <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-all duration-200 ${d.on ? 'left-4.5' : 'left-0.5'}`} />
      </div>
    </div>
  );
}

// ---- Main Component ----
export default function HandTrack() {
  const videoRef       = useRef<HTMLVideoElement>(null);
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const handsRef       = useRef<any>(null);
  const cameraRef      = useRef<any>(null);
  const lastGestureRef = useRef<GestureKey | null>(null);
  const cooldownRef    = useRef(false);
  const logIdRef       = useRef(3);
  const mountedRef     = useRef(true);

  const [scriptsLoaded, setScriptsLoaded]    = useState(false);
  const [cameraRunning, setCameraRunning]    = useState(false);
  const [isDemoMode, setIsDemoMode]          = useState(false);
  const [handCount, setHandCount]            = useState(0);
  const [currentGesture, setCurrentGesture] = useState<GestureKey | null>(null);
  const [confidence, setConfidence]          = useState(0);
  const [showFlash, setShowFlash]            = useState(false);
  const [devices, setDevices]                = useState<Device[]>(makeInitialDevices);
  const [highlightedId, setHighlightedId]    = useState<string | null>(null);
  const [logs, setLogs]                      = useState<LogEntry[]>([
    { id: 1, time: new Date().toLocaleTimeString('en-US', { hour12: false }), category: 'SYSTEM', msg: '🚀 HandTrack initialized — 10 devices ready' },
    { id: 2, time: new Date().toLocaleTimeString('en-US', { hour12: false }), category: 'SYSTEM', msg: '📡 Click "Enable Camera" to start hand tracking' },
  ]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const addLog = useCallback((category: LogCategory, msg: string) => {
    setLogs(prev => [...prev.slice(-49), {
      id: logIdRef.current++,
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      category, msg,
    }]);
  }, []);

  const toggleDevice = useCallback((id: string, forceState?: boolean) => {
    setDevices(prev => prev.map(d => {
      if (d.id !== id) return d;
      const next: Device = { ...d, on: forceState !== undefined ? forceState : !d.on };
      next.value = getDeviceValue(next);
      addLog('DEVICE', `${d.emoji} ${d.name} → ${next.on ? 'ON' : 'OFF'}`);
      return next;
    }));
    setHighlightedId(id);
    setTimeout(() => setHighlightedId(null), 700);
  }, [addLog]);

  const triggerGesture = useCallback((gesture: GestureKey) => {
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 400);
    addLog('GESTURE', `Detected: ${gesture}`);

    const updateLight = (on: boolean) =>
      setDevices(prev => prev.map(d => {
        if (d.type !== 'light') return d;
        const next = { ...d, on };
        next.value = getDeviceValue(next);
        return next;
      }));

    const toggleById = (id: string, logMsg: string) =>
      setDevices(prev => prev.map(d => {
        if (d.id !== id) return d;
        const next = { ...d, on: !d.on };
        next.value = getDeviceValue(next);
        addLog('ACTION', logMsg.replace('{state}', next.on ? 'ON' : 'OFF'));
        return next;
      }));

    switch (gesture) {
      case 'fist':       updateLight(false); addLog('ACTION', '💡 All lights → OFF'); break;
      case 'open':       updateLight(true);  addLog('ACTION', '💡 All lights → ON');  break;
      case 'point':      toggleById('curtains', '🪟 Curtains → {state}'); break;
      case 'peace':      toggleById('fan',      '💨 Fan → {state}');      break;
      case 'ok':         toggleById('tv',       '📺 TV → {state}');        break;
      case 'call':       toggleById('alarm',    '🔐 Alarm → {state}');     break;
      case 'thumbsup':
        setDevices(prev => prev.map(d => {
          if (d.id !== 'thermostat') return d;
          const t = Math.min(30, (d.temp ?? 22) + 1);
          addLog('ACTION', `🌡️ Thermostat → ${t}°C`);
          return { ...d, temp: t, value: `${t}°C` };
        }));
        break;
      case 'thumbsdown':
        setDevices(prev => prev.map(d => {
          if (d.id !== 'thermostat') return d;
          const t = Math.max(16, (d.temp ?? 22) - 1);
          addLog('ACTION', `🌡️ Thermostat → ${t}°C`);
          return { ...d, temp: t, value: `${t}°C` };
        }));
        break;
    }
  }, [addLog]);

  const onResults = useCallback((results: any) => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = window as any;
    if (results.multiHandLandmarks?.length > 0) {
      setHandCount(results.multiHandLandmarks.length);
      for (const lm of results.multiHandLandmarks) {
        w.drawConnectors(ctx, lm, w.HAND_CONNECTIONS, { color: 'rgba(139,92,246,0.7)', lineWidth: 2 });
        w.drawLandmarks(ctx, lm, { color: '#34d399', lineWidth: 1, radius: 4 });
      }
      const gesture = detectGesture(results.multiHandLandmarks[0]);
      setCurrentGesture(gesture);
      setConfidence(gesture ? 0.85 + Math.random() * 0.14 : 0);
      if (gesture && gesture !== lastGestureRef.current && !cooldownRef.current) {
        triggerGesture(gesture);
        lastGestureRef.current = gesture;
        cooldownRef.current = true;
        setTimeout(() => { cooldownRef.current = false; lastGestureRef.current = null; }, 1500);
      }
    } else {
      setHandCount(0);
      setCurrentGesture(null);
      setConfidence(0);
    }
  }, [triggerGesture]);

  useEffect(() => {
    const CDN = [
      'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
    ];
    const loadScript = (src: string) => new Promise<void>((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
      const el = document.createElement('script');
      el.src = src; el.crossOrigin = 'anonymous';
      el.onload = () => res();
      el.onerror = () => rej(new Error(`Failed: ${src}`));
      document.head.appendChild(el);
    });
    (async () => {
      try {
        for (const url of CDN) await loadScript(url);
        if (mountedRef.current) setScriptsLoaded(true);
      } catch (err) {
        if (mountedRef.current) addLog('ERROR', `MediaPipe load failed: ${(err as Error).message}`);
      }
    })();
    return () => {
      cameraRef.current?.stop?.();
      handsRef.current?.close?.();
      if (videoRef.current?.srcObject)
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startCamera = useCallback(async () => {
    if (cameraRunning || !scriptsLoaded) return;
    const video = videoRef.current;
    if (!video) return;
    const w = window as any;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      video.srcObject = stream;
      await video.play();
      handsRef.current = new w.Hands({ locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}` });
      handsRef.current.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.6 });
      handsRef.current.onResults(onResults);
      cameraRef.current = new w.Camera(video, { onFrame: async () => { if (handsRef.current) await handsRef.current.send({ image: video }); }, width: 640, height: 480 });
      cameraRef.current.start();
      setCameraRunning(true);
      addLog('SYSTEM', '📷 Camera started — hand tracking active');
    } catch (err) {
      addLog('ERROR', `Camera denied: ${(err as Error).message}`);
      setIsDemoMode(true);
      addLog('SYSTEM', '⚠️ Running in demo mode');
    }
  }, [cameraRunning, scriptsLoaded, onResults, addLog]);

  const triggerDemo = useCallback((gesture: GestureKey) => {
    if (cooldownRef.current) return;
    setCurrentGesture(gesture);
    setConfidence(0.9);
    triggerGesture(gesture);
    cooldownRef.current = true;
    setTimeout(() => { cooldownRef.current = false; setCurrentGesture(null); setConfidence(0); }, 1500);
  }, [triggerGesture]);

  const toggleAllLights = useCallback((on: boolean) => {
    setDevices(prev => prev.map(d => {
      if (d.type !== 'light') return d;
      const next = { ...d, on };
      next.value = getDeviceValue(next);
      return next;
    }));
    addLog('SYSTEM', `All lights → ${on ? 'ON' : 'OFF'}`);
  }, [addLog]);

  const confPct = Math.round(confidence * 100);
  const gestureInfo = currentGesture ? GESTURE_CONFIG[currentGesture] : null;

  // Split devices for left/right panels
  const leftDevices  = devices.slice(0, 5);
  const rightDevices = devices.slice(5);

  return (
    <div className="relative">
      {/* Flash border */}
      {showFlash && (
        <div
          className="pointer-events-none fixed inset-0 z-[9999] border-[3px] border-emerald-400"
          style={{ animation: 'handtrack-flash 0.4s ease forwards' }}
        />
      )}

      {/* ── Status bar ── */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {/* Camera status */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono transition-all ${
          cameraRunning ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
          : isDemoMode  ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
          :               'border-zinc-800 bg-zinc-900/50 text-zinc-500'
        }`}>
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${
            cameraRunning ? 'bg-emerald-400 shadow-[0_0_5px_#4ade80]' : isDemoMode ? 'bg-amber-400' : 'bg-zinc-600'
          }`} />
          {cameraRunning ? 'Camera Active' : isDemoMode ? 'Demo Mode' : 'Camera Off'}
        </div>

        {/* Hand count */}
        <div className="px-2.5 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 text-[11px] font-mono text-zinc-500">
          {handCount} {handCount === 1 ? 'hand' : 'hands'}
        </div>

        {/* Gesture badge */}
        <div className={`px-2.5 py-1 rounded-full border text-[11px] font-mono min-w-32.5 text-center transition-all ${
          currentGesture
            ? 'border-violet-500/40 bg-violet-500/10 text-violet-300'
            : 'border-zinc-800 bg-zinc-900/50 text-zinc-600'
        }`}>
          {gestureInfo ? `${gestureInfo.emoji} ${gestureInfo.name}` : 'NO GESTURE'}
        </div>

        {/* Spacer + bulk controls */}
        <div className="ml-auto flex gap-1.5">
          <button
            onClick={() => toggleAllLights(true)}
            className="text-[11px] font-mono border border-zinc-700 text-zinc-400 hover:border-emerald-500/40 hover:text-emerald-400 px-2.5 py-1 rounded-lg transition-all"
          >
            ALL ON
          </button>
          <button
            onClick={() => toggleAllLights(false)}
            className="text-[11px] font-mono border border-zinc-700 text-zinc-400 hover:border-rose-500/40 hover:text-rose-400 px-2.5 py-1 rounded-lg transition-all"
          >
            ALL OFF
          </button>
        </div>
      </div>

      {/* ── Main 3-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px_1fr] gap-3 items-start">

        {/* Left devices (5) */}
        <div className="flex flex-col gap-2">
          <div className="text-[9px] font-mono uppercase tracking-[0.15em] text-zinc-700 px-1 mb-0.5">
            Devices A–E
          </div>
          {leftDevices.map(d => (
            <React.Fragment key={d.id}>
              <DeviceCard
                d={d}
                highlighted={highlightedId === d.id}
                onToggle={() => toggleDevice(d.id)}
              />
            </React.Fragment>
          ))}
        </div>

        {/* Center: camera + gesture pills + confidence */}
        <div className="flex flex-col gap-2">

          {/* Camera feed */}
          <div
            className="relative bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800/60"
            style={{ height: 210 }}
          >
            <video
              ref={videoRef}
              playsInline
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
              style={{ transform: 'scaleX(-1)' }}
            />

            {/* Overlay: idle or demo */}
            {!cameraRunning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 backdrop-blur-sm">
                {isDemoMode ? (
                  <div className="w-full px-4 text-center">
                    <div className="text-[11px] font-mono text-zinc-400 mb-2">DEMO MODE — tap to simulate</div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {GESTURE_KEYS.map(g => (
                        <button
                          key={g}
                          onClick={() => triggerDemo(g)}
                          className="flex flex-col items-center gap-0.5 py-1.5 rounded-xl border border-zinc-700 hover:border-violet-500/50 bg-zinc-900/60 hover:bg-violet-500/10 transition-all"
                        >
                          <span className="text-lg leading-none">{GESTURE_CONFIG[g].emoji}</span>
                          <span className="text-[9px] font-mono text-zinc-500">{GESTURE_CONFIG[g].key}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-4xl opacity-15">📷</div>
                    <div className="text-[11px] font-mono text-zinc-500">Camera access required</div>
                    <button
                      onClick={startCamera}
                      disabled={!scriptsLoaded}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold transition-colors"
                    >
                      {scriptsLoaded ? 'Enable Camera' : 'Loading MediaPipe…'}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Tracking badge */}
            {cameraRunning && (
              <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 border border-zinc-700/50 text-[9px] font-mono text-zinc-400 backdrop-blur-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                TRACKING
              </div>
            )}
          </div>

          {/* Gesture reference — 4×2 pill grid */}
          <div className="grid grid-cols-4 gap-1.5">
            {GESTURE_KEYS.map(key => {
              const cfg = GESTURE_CONFIG[key];
              const active = currentGesture === key;
              return (
                <div
                  key={key}
                  title={cfg.desc}
                  className={`flex flex-col items-center gap-0.5 py-2 rounded-xl border text-center transition-all ${
                    active
                      ? 'border-violet-500/40 bg-violet-500/10'
                      : 'border-zinc-800/60 bg-zinc-900/30'
                  }`}
                >
                  <span className="text-lg leading-none">{cfg.emoji}</span>
                  <span className={`text-[9px] font-mono leading-tight ${active ? 'text-violet-300' : 'text-zinc-600'}`}>
                    {cfg.key}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Confidence bar */}
          <div className="bg-[#161b22] border border-zinc-800/60 rounded-xl px-3 py-2">
            <div className="h-0.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all duration-150"
                style={{ width: `${currentGesture ? confPct : 0}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-wide">Confidence</span>
              <span className="text-[9px] font-mono text-zinc-500">{currentGesture ? confPct : 0}%</span>
            </div>
          </div>
        </div>

        {/* Right devices (5) */}
        <div className="flex flex-col gap-2">
          <div className="text-[9px] font-mono uppercase tracking-[0.15em] text-zinc-700 px-1 mb-0.5">
            Devices F–J
          </div>
          {rightDevices.map(d => (
            <React.Fragment key={d.id}>
              <DeviceCard
                d={d}
                highlighted={highlightedId === d.id}
                onToggle={() => toggleDevice(d.id)}
              />
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Event log ── */}
      <div className="mt-3 bg-[#161b22] border border-zinc-800/60 rounded-2xl overflow-hidden flex flex-col" style={{ height: 96 }}>
        <div className="flex items-center justify-between px-4 py-1.5 border-b border-zinc-800/60 shrink-0">
          <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-zinc-600">Event Log</span>
          <button
            onClick={() => setLogs([])}
            className="text-[9px] font-mono text-zinc-700 hover:text-zinc-400 transition-colors"
          >
            CLEAR
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-1 space-y-0.5 custom-scrollbar">
          {logs.map(entry => (
            <div key={entry.id} className="flex gap-2 items-baseline text-[10px] font-mono">
              <span className="text-zinc-700 shrink-0">{entry.time}</span>
              <span className={`shrink-0 ${LOG_COLORS[entry.category]}`}>[{entry.category}]</span>
              <span className="text-zinc-500">{entry.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
