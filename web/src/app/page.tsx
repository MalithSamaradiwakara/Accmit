"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  AlertTriangle,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  Leaf,
  RefreshCw,
  Signal,
  Wifi,
} from "lucide-react";

const sensors = [
  {
    id: "elephant1",
    name: "Area 1",
    endpoint: "https://acc1-89859-default-rtdb.asia-southeast1.firebasedatabase.app/elephant1.json",
  },
  {
    id: "elephant2",
    name: "Area 2",
    endpoint: "https://acc1-89859-default-rtdb.asia-southeast1.firebasedatabase.app/elephant2.json",
  },
] as const;

type SensorId = (typeof sensors)[number]["id"];

type SensorReading = {
  value: boolean | null;
  error: string | null;
  updatedAt: Date | null;
};

type Readings = Record<SensorId, SensorReading>;

const initialReadings: Readings = {
  elephant1: { value: null, error: null, updatedAt: null },
  elephant2: { value: null, error: null, updatedAt: null },
};

function formatTime(date: Date | null) {
  if (!date) return "Waiting for first reading";
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export default function Home() {
  const [readings, setReadings] = useState<Readings>(initialReadings);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    const loadReadings = async () => {
      const results = await Promise.all(
        sensors.map(async (sensor) => {
          try {
            const response = await fetch(sensor.endpoint, { cache: "no-store" });
            if (!response.ok) {
              throw new Error(`Firebase returned HTTP ${response.status}`);
            }

            const value: unknown = await response.json();
            if (typeof value !== "boolean") {
              throw new Error("This endpoint did not return a boolean value");
            }

            return { id: sensor.id, value, error: null, updatedAt: new Date() };
          } catch (error) {
            return {
              id: sensor.id,
              value: null,
              error: error instanceof Error ? error.message : "Unable to read this sensor",
              updatedAt: null,
            };
          }
        }),
      );

      if (!active) return;

      setReadings((current) => {
        const next = { ...current };
        for (const result of results) {
          const previous = current[result.id];
          next[result.id] = result.error
            ? { ...previous, error: result.error }
            : { value: result.value, error: null, updatedAt: result.updatedAt };
        }
        return next;
      });
      setLastChecked(new Date());
    };

    void loadReadings();
    const interval = window.setInterval(() => void loadReadings(), 5000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [refreshKey]);

  const onlineCount = sensors.filter(({ id }) => readings[id].error === null && readings[id].updatedAt !== null).length;
  const detectedCount = sensors.filter(({ id }) => readings[id].value === true && readings[id].error === null).length;
  const detectedSensors = sensors.filter(({ id }) => readings[id].value === true && readings[id].error === null);
  const hasIssues = sensors.some(({ id }) => readings[id].error !== null);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="Elephant Watch overview">
          <span className="brand-mark"><Leaf size={19} strokeWidth={1.8} /></span>
          <span className="brand-copy"><strong>ELEPHANT</strong><small>FIELD WATCH</small></span>
        </a>

        <div className="workspace-label">MONITORING</div>
        <nav className="side-nav" aria-label="Main navigation">
          <a className="nav-link active" href="#overview"><Activity size={17} /> Overview</a>
          <a className="nav-link" href="#sensors"><Signal size={17} /> Sensor feeds <span className="nav-count">02</span></a>
        </nav>

        <div className="sidebar-bottom">
          <div className="network-mini">
            <span className={`network-indicator ${hasIssues ? "warning" : onlineCount === sensors.length ? "connected" : ""}`} />
            <span><strong>{hasIssues ? "Connection issue" : onlineCount === sensors.length ? "Network online" : "Connecting"}</strong><small>{onlineCount} of 2 feeds responding</small></span>
          </div>
          <div className="sidebar-foot">WILDLIFE MONITORING<br />FIREBASE REALTIME DATABASE</div>
        </div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar">
          <div className="breadcrumb"><span>FIELD OPERATIONS</span><ChevronRight size={14} /><strong>OVERVIEW</strong></div>
          <div className="topbar-right"><span className="live-label"><span className="live-dot" /> LIVE MONITORING</span><span className="topbar-divider" /><span className="clock-label"><Clock3 size={15} /> Auto-refresh · 5 sec</span></div>
        </header>

        <section className="page-heading">
          <div>
            <p className="eyebrow">WILDLIFE PRESENCE SYSTEM <span> / </span> FIELD DASHBOARD</p>
            <h1>Elephant monitoring</h1>
            <p className="heading-subtitle">A clear view of your connected presence feeds.</p>
          </div>
          <button className="refresh-button" onClick={() => setRefreshKey((key) => key + 1)} aria-label="Refresh sensor readings">
            <RefreshCw size={16} /> <span>Refresh</span>
          </button>
        </section>

        <section className="overview-grid" aria-label="Monitoring summary">
          <div className="field-panel">
            <div className="field-panel-content">
              <div className="field-kicker"><span className="field-kicker-dot" /> FIELD SIGNALS</div>
              <div className="field-title">Presence,<br />at a glance.</div>
              <p>Live boolean readings from your connected Firebase feeds.</p>
              <div className="field-meta"><span><Wifi size={14} /> REALTIME DATABASE</span><span>2 ENDPOINTS</span></div>
            </div>
            <div className="field-image" role="img" aria-label="Elephant in its natural habitat" />
          </div>

          <div className="summary-panel">
            <div className="summary-top"><span className="summary-icon"><Signal size={17} /></span><span className="summary-caption">NETWORK STATUS</span></div>
            <div className="summary-status">{hasIssues ? "Needs attention" : onlineCount === sensors.length ? "All systems go" : "Connecting feeds"}</div>
            <p className="summary-detail">{onlineCount} of 2 sensor feeds responding</p>
            <div className="summary-divider" />
            <div className="summary-numbers">
              <div><span className="number-value">{detectedCount}<small>/ 2</small></span><span className="number-label">Presence detected</span></div>
              <div className="summary-number-right"><span className="number-value">{onlineCount}<small>/ 2</small></span><span className="number-label">Feeds online</span></div>
            </div>
            <div className="last-checked"><Clock3 size={14} /><span>Last checked</span><strong>{formatTime(lastChecked)}</strong></div>
          </div>
        </section>

        <section className="sensor-section" id="sensors">
          <div className="section-heading">
            <div><p className="eyebrow">CONNECTED DEVICES</p><h2>Sensor feeds <span className="section-count">02</span></h2></div>
            <span className="poll-status"><span className="live-dot" /> Polling every 5 seconds</span>
          </div>

          {detectedSensors.length > 0 && (
            <div className="presence-alert" role="alert">
              <span className="alert-icon"><AlertTriangle size={18} /></span>
              <span><strong>Elephant presence detected</strong><small>{detectedSensors.map((sensor) => sensor.name).join(" and ")} {detectedSensors.length === 1 ? "is" : "are"} reporting a positive signal.</small></span>
              <span className="alert-live"><span className="live-dot" /> LIVE ALERT</span>
            </div>
          )}

          <div className="sensor-grid">
            {sensors.map((sensor, index) => {
              const reading = readings[sensor.id];
              const isStale = reading.error !== null && reading.value !== null;
              const stateClass = reading.error ? (isStale ? "stale" : "error") : reading.value === null ? "waiting" : reading.value ? "detected" : "clear";
              const statusText = reading.error
                ? isStale ? "Connection lost · showing last reading" : "Unable to connect"
                : reading.value === null ? "Waiting for first reading" : reading.value ? "Presence detected" : "No presence detected";

              return (
                <article className={`sensor-card ${reading.value === true && !reading.error ? "detected-card" : ""}`} key={sensor.id}>
                  <div className="sensor-card-top">
                    <div className="sensor-id"><span className="sensor-index">0{index + 1}</span><span>{sensor.name}</span></div>
                    <span className={`status-badge ${stateClass}`}><span className="status-dot" />{reading.error ? isStale ? "STALE" : "OFFLINE" : reading.value === null ? "WAITING" : reading.value ? "DETECTED" : "CLEAR"}</span>
                  </div>
                  <div className={`sensor-state ${reading.value === true && !reading.error ? "is-detected" : ""}`}>
                    {reading.value === true && !reading.error && <span className="presence-elephant" role="img" aria-label="Elephant presence image" />}
                    <span className={`state-icon ${stateClass}`}>{reading.error ? <CircleAlert size={20} /> : reading.value === null ? <Signal size={20} /> : reading.value ? <Activity size={20} /> : <Check size={20} />}</span>
                    <div><strong>{statusText}</strong><span>{reading.error ? reading.error : reading.value === null ? "The feed will update automatically" : "Boolean signal received"}</span></div>
                  </div>
                  <div className="sensor-card-bottom">
                    <span className="endpoint-label">SOURCE</span>
                    <a href={sensor.endpoint} target="_blank" rel="noreferrer" className="endpoint-link">/{sensor.id}.json <ArrowUpRight size={13} /></a>
                    <span className="reading-time">{formatTime(reading.updatedAt)}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <footer className="page-footer"><span><span className="footer-mark"><Leaf size={13} /></span> Elephant Watch <span className="footer-separator">·</span> Field monitoring</span><span className="footer-status">{hasIssues ? <CircleAlert size={14} /> : <Check size={14} />}{hasIssues ? "Some feeds need attention" : onlineCount === sensors.length ? "All feeds operational" : "Establishing connection"}</span></footer>
      </main>
    </div>
  );
}