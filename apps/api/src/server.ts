import { Elysia } from 'elysia';

export const app = new Elysia()
  .get('/', () => ({
    name: 'Tali API',
    status: 'ok',
    runtime: 'bun',
    framework: 'elysia',
    timestamp: new Date().toISOString(),
  }))
  .get('/health', () => ({
    status: 'healthy',
  }));