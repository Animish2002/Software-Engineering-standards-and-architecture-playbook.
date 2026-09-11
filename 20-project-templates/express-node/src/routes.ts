import { Router } from 'express';
import { healthRouter } from './modules/health/index.js';
import { authRouter } from './modules/auth/index.js';
import { usersRouter } from './modules/users/index.js';

export const routes = Router();

// Every single-prefix router is mounted WITH its prefix.
// Public routers first. An unprefixed router (if one ever exists) goes LAST,
// so its router-wide authenticate can't shadow public routes.
routes.use('/health', healthRouter);
routes.use('/auth', authRouter);
routes.use('/users', usersRouter);
