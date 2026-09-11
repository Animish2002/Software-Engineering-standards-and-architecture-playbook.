import { createApp } from './app';
import type { Env } from './env';

const app = createApp();

export default {
  fetch: app.fetch,
  // scheduled: async (event, env, ctx) => { ctx.waitUntil(runNightly(env)); },
  // queue: async (batch, env) => { for (const msg of batch.messages) { /* ... */ msg.ack(); } },
} satisfies ExportedHandler<Env>;

export type AppType = ReturnType<typeof createApp>;   // for hono/client on the frontend (optional)
