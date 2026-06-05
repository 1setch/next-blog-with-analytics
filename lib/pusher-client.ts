import PusherClient from 'pusher-js';

let pusherClient: PusherClient | null = null;

export const getPusherClient = () => {
  if (!pusherClient && typeof window !== 'undefined') {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    
    if (!key || !cluster) {
      console.error('Pusher keys not configured');
      return null;
    }
    
    pusherClient = new PusherClient(key, {
      cluster: cluster,
      forceTLS: true,
    });
  }
  return pusherClient;
};

export { pusherClient };