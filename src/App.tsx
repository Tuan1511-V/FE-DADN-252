import React, { useState } from 'react';
import {
  Thermometer,
  Droplets,
  Sun,
  Camera,
  Lock,
  Unlock,
  Fan,
  Lightbulb,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
  Settings,
  Bell,
  Home,
  ShieldCheck,
  Wifi,
  WifiOff,
  TrendingUp,
  TrendingDown,
  LayoutDashboard,
  Cpu,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  YAxis,
  XAxis,
  Tooltip
} from 'recharts';

// --- Mock Data ---

const temperatureData = [
  { time: '00:00', value: 22.5 },
  { time: '04:00', value: 21.0 },
  { time: '08:00', value: 23.5 },
  { time: '12:00', value: 25.0 },
  { time: '16:00', value: 27.5 },
  { time: '20:00', value: 25.5 },
  { time: '24:00', value: 26.8 },
];

const humidityData = [
  { time: '00:00', value: 45 },
  { time: '04:00', value: 46 },
  { time: '08:00', value: 44 },
  { time: '12:00', value: 42 },
  { time: '16:00', value: 40 },
  { time: '20:00', value: 43 },
  { time: '24:00', value: 45 },
];

const lightData = [
  { time: '00:00', value: 0 },
  { time: '04:00', value: 0 },
  { time: '08:00', value: 250 },
  { time: '12:00', value: 800 },
  { time: '16:00', value: 650 },
  { time: '20:00', value: 150 },
  { time: '24:00', value: 0 },
];

const initialLogs = [
  { id: 1, time: '10:45 AM', message: 'Face Recognized: Unlocking Door', type: 'success' },
  { id: 2, time: '10:42 AM', message: 'Human Recognized at Front Door', type: 'info' },
  { id: 3, time: '10:30 AM', message: 'Light Turned ON manually', type: 'routine' },
  { id: 4, time: '09:15 AM', message: 'High Temperature Threshold: Fan turned ON automatically', type: 'warning' },
  { id: 5, time: '08:00 AM', message: '⚠️ WARNING: Humidity Sensor Disconnected', type: 'error' },
];

// --- Components ---

const MetricCard = ({ title, value, unit, icon: Icon, data, color, dataKey = 'value', trendValue, trendDirection, statusText }: any) => {
  const isUp = trendDirection === 'up';
  const TrendIcon = isUp ? TrendingUp : TrendingDown;
  
  const theme = {
    orange: { text: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30', stroke: '#f97316' },
    blue: { text: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30', stroke: '#3b82f6' },
    amber: { text: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', stroke: '#f59e0b' },
  }[color as 'orange' | 'blue' | 'amber'] || { text: 'text-zinc-500', bg: 'bg-zinc-500/10', border: 'border-zinc-500/30', stroke: '#71717a' };

  return (
    <div className="bg-[#161b22] border border-zinc-800/60 rounded-[1.5rem] p-5 flex flex-col relative overflow-hidden h-[220px]">
      {/* Content layer (pointer-events-none so it doesn't block chart tooltips) */}
      <div className="relative z-10 pointer-events-none flex flex-col h-full">
        <div className="flex justify-between items-start mb-4 gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`p-2.5 rounded-xl shrink-0 ${theme.bg} ${theme.text}`}>
              <Icon size={18} strokeWidth={2} />
            </div>
            <h3 className="text-slate-400 text-xs font-semibold tracking-wider uppercase leading-tight">{title}</h3>
          </div>
          {statusText && (
            <span className={`px-2.5 py-1 rounded-full border ${theme.border} ${theme.text} text-[11px] font-medium bg-[#161b22] shrink-0`}>
              {statusText}
            </span>
          )}
        </div>
        
        <div className="flex items-baseline gap-1 mb-2 mt-1">
          <span className="text-4xl font-semibold text-white tracking-tight">{value}</span>
          <span className="text-slate-400 text-lg font-medium ml-1">{unit}</span>
        </div>
        
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <TrendIcon size={16} className={theme.text} strokeWidth={2.5} />
          <span className="text-slate-400">{trendValue} from last hour</span>
        </div>
      </div>
      
      {/* Chart layer */}
      <div className="absolute bottom-0 left-0 right-0 h-[100px] z-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`color-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.stroke} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={theme.stroke} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Tooltip 
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', color: '#f4f4f5', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
              itemStyle={{ color: '#f4f4f5', fontWeight: 600 }}
              labelStyle={{ color: '#a1a1aa', marginBottom: '4px', fontSize: '12px' }}
              formatter={(val: any) => [`${val}${unit}`, title]}
              labelFormatter={(label: any) => `Time: ${label}`}
            />
            <XAxis dataKey="time" hide />
            <YAxis domain={['dataMin - 2', 'dataMax + 2']} hide />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={theme.stroke}
              strokeWidth={3}
              fillOpacity={1}
              fill={`url(#color-${title})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const ToggleSwitch = ({ checked, onChange, disabled = false }: any) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => !disabled && onChange(!checked)}
    className={`
      relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
      transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      ${checked ? 'bg-emerald-500' : 'bg-zinc-700'}
    `}
  >
    <span
      aria-hidden="true"
      className={`
        pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 
        transition duration-200 ease-in-out
        ${checked ? 'translate-x-5' : 'translate-x-0'}
      `}
    />
  </button>
);

const DeviceRow = ({ name, icon: Icon, status, type, state, onToggle, signal = 'strong' }: any) => {
  const isOnline = status === 'online';
  const isError = status === 'error';
  
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/30 border border-zinc-800/50 hover:bg-zinc-800/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-xl ${isOnline ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-800/50 text-zinc-600'}`}>
          <Icon size={20} />
        </div>
        <div>
          <h4 className={`font-medium ${isOnline ? 'text-zinc-200' : 'text-zinc-500'}`}>{name}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            {isOnline ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Online
              </span>
            ) : isError ? (
              <span className="flex items-center gap-1 text-xs font-medium text-rose-400">
                <AlertTriangle size={12} />
                Error
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium text-zinc-500">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-600"></span>
                Offline
              </span>
            )}
            <span className="text-zinc-700 text-xs">•</span>
            <span className={`flex items-center gap-1 text-xs font-medium ${isOnline ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              {isOnline ? (signal === 'strong' ? '98%' : '75%') : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center">
        {type === 'sensor' ? (
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider px-2 py-1 bg-zinc-800 rounded-md">
            Monitoring
          </span>
        ) : (
          <ToggleSwitch checked={state} onChange={onToggle} disabled={!isOnline} />
        )}
      </div>
    </div>
  );
};

const LogEntry = ({ log }: any) => {
  const getIconAndColor = (type: string) => {
    switch (type) {
      case 'success': return { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' };
      case 'info': return { icon: Info, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' };
      case 'warning': return { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' };
      case 'error': return { icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20' };
      default: return { icon: Activity, color: 'text-zinc-400', bg: 'bg-zinc-800', border: 'border-zinc-700' };
    }
  };

  const { icon: Icon, color, bg, border } = getIconAndColor(log.type);

  return (
    <div className={`flex gap-4 p-3 rounded-xl border ${border} ${bg} transition-colors`}>
      <div className={`mt-0.5 ${color}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${log.type === 'routine' ? 'text-zinc-300' : 'text-zinc-100'}`}>
          {log.message}
        </p>
        <div className="flex items-center gap-1 mt-1.5 text-xs text-zinc-500 font-mono">
          <Clock size={10} />
          {log.time}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [devices, setDevices] = useState({
    camera: { state: true },
    door: { state: false }, // false = locked
    fan: { state: false },
    lights: { state: true },
  });

  const toggleDevice = (key: string) => {
    setDevices(prev => ({
      ...prev,
      [key]: { ...prev[key as keyof typeof prev], state: !prev[key as keyof typeof prev].state }
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A] text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Top Header */}
      <header className="sticky top-0 z-50 h-16 border-b border-zinc-800/50 flex items-center justify-between px-6 bg-[#0A0A0A]/80 backdrop-blur-xl shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 w-1/3">
          <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center text-zinc-950 shrink-0">
            <ShieldCheck size={20} strokeWidth={2.5} />
          </div>
          <h1 className="text-lg font-semibold tracking-tight hidden sm:block">Aegis Home</h1>
        </div>

        {/* Center Tabs */}
        <nav className="flex items-center justify-center gap-1 p-1 bg-zinc-900/50 rounded-full border border-zinc-800/50">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'}`}
          >
            <LayoutDashboard size={16} />
            <span className="hidden sm:block">Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('monitor')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === 'monitor' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'}`}
          >
            <Eye size={16} />
            <span className="hidden sm:block">Monitor</span>
          </button>
          <button
            onClick={() => setActiveTab('control')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === 'control' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'}`}
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:block">Control</span>
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center justify-end gap-3 w-1/3">
          <button className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-full transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 border-2 border-[#0A0A0A]"></span>
          </button>
          <button className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-full transition-colors hidden sm:block">
            <Settings size={20} />
          </button>
          <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden ml-1 shrink-0">
            <img src="https://picsum.photos/seed/avatar/100/100" alt="User" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {/* Top Area: Environmental Dashboard */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Home size={18} className="text-zinc-400" />
                    <h2 className="text-lg font-medium text-zinc-200">Environment</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MetricCard
                      title="Temperature"
                      value="26.8"
                      unit="°C"
                      icon={Thermometer}
                      data={temperatureData}
                      color="orange"
                      trendValue="+1.3°"
                      trendDirection="up"
                      statusText="Warm"
                    />
                    <MetricCard
                      title="Humidity"
                      value="42"
                      unit="%"
                      icon={Droplets}
                      data={humidityData}
                      color="blue"
                      trendValue="+2.1%"
                      trendDirection="up"
                      statusText="Normal"
                    />
                    <MetricCard
                      title="Light Intensity"
                      value="650"
                      unit="Lux"
                      icon={Sun}
                      data={lightData}
                      color="amber"
                      trendValue="-150"
                      trendDirection="down"
                      statusText="Bright"
                    />
                  </div>
                </section>

                {/* Side/Bottom Panel: System Logs & Security Feed */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-zinc-200">Security Log</h2>
                    <button className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                      View All
                    </button>
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col h-[400px]">
                    <div className="p-3 bg-zinc-800/30 border-b border-zinc-800/50 flex items-center justify-between text-xs font-medium text-zinc-400">
                      <span>Live System Logs</span>
                      <span className="flex items-center gap-1.5">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                        </span>
                        Recording
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                      {initialLogs.map(log => (
                        <LogEntry key={log.id} log={log} />
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'monitor' && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-medium text-zinc-200">Monitoring Sensors</h2>
                    <p className="text-sm text-zinc-500 mt-1">View real-time data from your home sensors.</p>
                  </div>
                  <span className="text-xs font-medium text-zinc-500 bg-zinc-800/50 px-3 py-1.5 rounded-full border border-zinc-800">
                    3 Online • 1 Issue
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <DeviceRow
                    name="Temperature Sensor"
                    icon={Thermometer}
                    status="online"
                    type="sensor"
                    signal="strong"
                  />
                  <DeviceRow
                    name="Humidity Sensor"
                    icon={Droplets}
                    status="error"
                    type="sensor"
                  />
                  <DeviceRow
                    name="Light Sensor"
                    icon={Sun}
                    status="online"
                    type="sensor"
                    signal="weak"
                  />
                  <DeviceRow
                    name="Front Door Camera"
                    icon={Camera}
                    status="online"
                    type="sensor"
                    signal="strong"
                  />
                </div>
              </section>
            )}

            {activeTab === 'control' && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-medium text-zinc-200">Device Controls</h2>
                    <p className="text-sm text-zinc-500 mt-1">Manage and interact with your smart home actuators.</p>
                  </div>
                  <span className="text-xs font-medium text-zinc-500 bg-zinc-800/50 px-3 py-1.5 rounded-full border border-zinc-800">
                    2 Online • 1 Issue
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <DeviceRow
                    name="Smart Door Lock"
                    icon={devices.door.state ? Unlock : Lock}
                    status="online"
                    type="actuator"
                    state={devices.door.state}
                    onToggle={() => toggleDevice('door')}
                    signal="strong"
                  />
                  <DeviceRow
                    name="Living Room Lights"
                    icon={Lightbulb}
                    status="online"
                    type="actuator"
                    state={devices.lights.state}
                    onToggle={() => toggleDevice('lights')}
                    signal="strong"
                  />
                  <DeviceRow
                    name="HVAC Mini Fan"
                    icon={Fan}
                    status="error"
                    type="actuator"
                    state={devices.fan.state}
                    onToggle={() => toggleDevice('fan')}
                  />
                </div>
              </section>
            )}
          </div>
        </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #3f3f46;
          border-radius: 20px;
        }
        :root {
          --color-rose-500: #f43f5e;
          --color-blue-500: #3b82f6;
          --color-amber-500: #f59e0b;
        }
      `}</style>
    </div>
  );
}
