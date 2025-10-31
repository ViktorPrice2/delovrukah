# Root Cause Analysis — WebSocket Authentication Failure

## Summary
- **Issue**: WebSocket connections to `ws://localhost:3001` were being terminated immediately with a `socket hang up` error.
- **Root Cause**: The gateway relied on an HTTP-oriented JWT guard that did not extract bearer tokens from the WebSocket handshake, so clients were rejected before the connection was fully established. In addition, the permissive CORS configuration did not explicitly allow browser origins for WebSocket upgrades, causing handshake issues in some environments.
- **Resolution**: Introduced a dedicated `WsAuthGuard` that validates JWT tokens from the WebSocket handshake headers and applied it to the chat gateway. Updated global CORS settings to explicitly trust the local frontend origin.

## Timeline
- **Detection**: Client applications reported consistent `socket hang up` errors when attempting to connect to the chat gateway despite providing valid JWT tokens.
- **Investigation**: Reviewed `chat.gateway.ts` and found that a WebSocket-specific guard attempted to reuse HTTP authentication logic, which failed to read the `Authorization` header from `socket.handshake.headers`.
- **Fix**: Implemented a custom WebSocket authentication guard within the auth module, ensured the gateway uses this guard for all authenticated operations, and tightened the CORS configuration to include the development frontend origin.

## Preventive Measures
- Centralize WebSocket authentication utilities within the auth module to encourage reuse and consistent token handling.
- Document the required WebSocket handshake headers for frontend teams and add integration tests that simulate socket connections with bearer tokens.
