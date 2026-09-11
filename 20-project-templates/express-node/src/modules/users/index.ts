export { usersRouter } from './users.routes.js';
export { directory as listUserDirectory } from './users.service.js';
// The repository is intentionally not exported: other modules call the service.
