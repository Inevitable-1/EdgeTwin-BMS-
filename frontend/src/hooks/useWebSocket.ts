import { useEffect, useRef, useState } from 'react';

export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const ws = useRef<WebSocket | null>(null);
  
  useEffect(() => {
    const connect = () => {
      try {
        ws.current = new WebSocket(url);
        
        ws.current.onopen = () => {
          setIsConnected(true);
          console.log('WebSocket connected');
        };
        
        ws.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setLastMessage(data);
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e);
          }
        };
        
        ws.current.onclose = () => {
          setIsConnected(false);
          console.log('WebSocket disconnected');
          // Reconnect after 3 seconds
          setTimeout(connect, 3000);
        };
        
        ws.current.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
      }
    };
    
    connect();
    
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url]);
  
  const send = (data: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  };
  
  return { isConnected, lastMessage, send };
}
