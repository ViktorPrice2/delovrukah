# WebSocket Adapter and Guard Adjustments

## Root Cause
The WebSocket server relied on NestJS defaults without explicitly configuring a Socket.IO adapter. As a result, the gateway attempted to establish a connection before Nest had a compatible adapter ready, leading to repeated `socket hang up` failures. Additionally, authentication logic lived entirely inside `WsAuthGuard`. Because the guard executed before the gateway finished bootstrapping, dependency injection attempts for `JwtService` and `ConfigService` inside the guard were brittle and often ran before modules exposing those providers were wired together.

## Fix Summary
1. Registered the Socket.IO adapter during application bootstrap so NestJS can consistently negotiate WebSocket upgrades.
2. Reorganised ChatModule dependencies to import `AuthModule`, allowing access to the shared JWT configuration.
3. Moved token extraction and verification into `ChatGateway.handleConnection`, leaving `WsAuthGuard` to act as a lightweight gate that simply ensures an authenticated payload is already attached to the socket.
4. Exported `JwtModule` from `AuthModule` so that downstream modules can consume the configured `JwtService` instance without duplicating configuration.

## Result
With the adapter registered, NestJS properly handles WebSocket connections, eliminating the `socket hang up` error. Authentication now happens within the gateway, where connection state is readily available, while the guard simply enforces the presence of an authenticated user for incoming events. This separation reduces dependency-ordering issues and makes the authentication flow easier to trace during debugging.
