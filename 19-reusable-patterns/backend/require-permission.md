# Authenticate + requirePermission

```ts
// lib/jwt.ts
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export type AccessTokenPayload = { sub: string; email: string; name?: string; permissionKeys: string[]; iat: number; exp: number };

export const signAccessToken = (p: Omit<AccessTokenPayload, 'iat' | 'exp'>) =>
  jwt.sign(p, config.JWT_SECRET, { algorithm: 'HS256', expiresIn: config.ACCESS_TOKEN_TTL, issuer: 'app-api' });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'], issuer: 'app-api', clockTolerance: 5 }) as AccessTokenPayload;
```

```ts
// middleware/authenticate.ts
import type { RequestHandler } from 'express';
import { UnauthorizedError } from '../lib/errors.js';
import { verifyAccessToken } from '../lib/jwt.js';

export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.get('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : undefined;
  if (!token) return next(new UnauthorizedError());
  try {
    const p = verifyAccessToken(token);
    req.user = { id: p.sub, email: p.email, name: p.name ?? p.email, permissionKeys: p.permissionKeys ?? [] };
    req.log = req.log.child({ userId: req.user.id });
    next();
  } catch (err: any) {
    next(new UnauthorizedError(err?.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token', err?.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'UNAUTHORIZED'));
  }
};
```

```ts
// middleware/require-permission.ts
import type { RequestHandler } from 'express';
import { ForbiddenError, UnauthorizedError } from '../lib/errors.js';
import type { AuthUser } from '../types/express.js';

export const hasPermission = (user: Pick<AuthUser, 'permissionKeys'>, key: string) => user.permissionKeys.includes(key);

export const requirePermission = (key: string): RequestHandler => (req, _res, next) => {
  if (!req.user) return next(new UnauthorizedError());
  if (!hasPermission(req.user, key)) return next(new ForbiddenError());
  next();
};

// for the rare inline case (permission depends on data loaded in the controller)
export const assertPermission = (user: AuthUser, key: string) => { if (!hasPermission(user, key)) throw new ForbiddenError(); };
```

```ts
// usage
router.use(authenticate);
router.get('/directory', c.directory);                       // any authenticated user
router.use(requirePermission('user:manage'));
router.post('/', c.create);
```

Related: [02-backend/authorization.md](../../02-backend/authorization.md)
