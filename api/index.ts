import type { IncomingMessage, ServerResponse } from 'http';
import { createApiApp } from '../server.ts';

const app = createApiApp();

export default function handler(
  req: IncomingMessage & { url?: string },
  res: ServerResponse,
) {
  if (req.url) {
    try {
      const urlObj = new URL(req.url, 'http://localhost');
      const pathParam = urlObj.searchParams.get('__path');
      if (pathParam !== null) {
        urlObj.searchParams.delete('__path');
        const remaining = urlObj.searchParams.toString();
        const cleanPath = pathParam.replace(/^\/+/, '');
        req.url = `/api/${cleanPath}${remaining ? `?${remaining}` : ''}`;
      }
    } catch {
      // Keep original req.url if parsing fails
    }
  }
  return app(req as unknown as Parameters<typeof app>[0], res as unknown as Parameters<typeof app>[1]);
}
