'use client';

import { useState, useEffect, useRef } from 'react';

export function useWebSocketTelemetry(wsUrl = 'ws://localhost:8000/ws/api/v1/trains/live') {
  const [telemetryData, setTelemetryData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    let ws;
    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.type === 'TELEMETRY_UPDATE' && Array.isArray(parsed.data)) {
              setTelemetryData(parsed.data);
            }
          } catch (err) {
            console.error('Error parsing telemetry frame:', err);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          // Auto reconnect after 3 seconds
          setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          setIsConnected(false);
          ws.close();
        };
      } catch (e) {
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [wsUrl]);

  return { telemetryData, isConnected };
}
