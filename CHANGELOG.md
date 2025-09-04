# Changelog

All notable changes to this project are documented in this file.
This project follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-09-04

### Added

#### Core API

- **A2S Protocol Implementation**: Complete TypeScript implementation of Valve's A2S (Application-level Server Query) protocol for Source and GoldSource engines
- **Functional API**: Standalone functions `info()`, `players()`, and `rules()` for quick queries
- **Class-based API**: `A2SClient` class for advanced usage and connection management
- **Protocol Support**: Full support for A2S_INFO, A2S_PLAYER, and A2S_RULES queries

#### Type System

- **TypeScript Definitions**: Complete type safety with detailed interfaces
- **Generic Types**: `Player<T>` and `Rules<T>` interfaces with customizable data types
- **Engine-Specific Types**: Separate `SourceInfo` and `GoldSrcInfo` interfaces for engine-specific data
- **Union Types**: `ServerInfo` type for unified handling of both engine types

#### Data Handling

- **Multi-packet Support**: Automatic reassembly of fragmented responses using `A2SFragment` class
- **Compression Support**: Built-in support for bz2-compressed server responses
- **Binary I/O**: Custom `ByteReader` and `ByteWriter` classes for efficient binary data processing
- **Encoding Flexibility**: Configurable string encoding (`utf-8`, `latin1`, or raw `Buffer`)

#### Error Handling

- **Custom Exceptions**:
  - `BrokenMessageError` for malformed protocol messages
  - `BufferExhaustedError` for buffer underrun scenarios
- **Timeout Management**: Configurable request timeouts with proper cleanup
- **Connection Handling**: Robust UDP socket management with error recovery

#### Testing & Development

- **Comprehensive Test Suite**: Full test coverage across all modules:
  - `a2s.test.ts` - Core API functionality
  - `byteio.test.ts` - Binary I/O operations
  - `protocols.test.ts` - Protocol implementation
  - `socket.test.ts` - Network layer
  - `fragment.test.ts` - Multi-packet handling
  - `exceptions.test.ts` - Error handling
  - `types.test.ts` - Type definitions
  - `defaults.test.ts` - Configuration defaults
  - `index.test.ts` - Module exports

### Features

#### Query Capabilities

- **Server Information**: Query server name, map, game mode, player counts, and technical details
- **Player Listing**: Retrieve connected players with names, scores, and connection durations
- **Server Rules**: Fetch server configuration variables and custom settings
- **Ping Measurement**: Automatic latency calculation for server responses

#### Protocol Features

- **Challenge Handling**: Automatic handling of A2S challenge-response authentication
- **Legacy Support**: Support for both modern and legacy A2S protocol versions
- **Fragment Assembly**: Seamless handling of multi-packet responses
- **Header Validation**: Strict validation of A2S protocol headers and message integrity

#### Network Layer

- **UDP Socket Management**: Efficient UDP communication with proper resource cleanup
- **Connection Pooling**: Reusable socket connections through `A2SClient` class
- **Timeout Controls**: Configurable timeouts for network operations
- **Error Recovery**: Graceful handling of network errors and connection failures

### Technical Implementation

#### Architecture

- **Modular Design**: Clean separation of concerns across focused modules:
  - `a2s.ts` - Core client implementation
  - `socket.ts` - UDP network layer
  - `protocols.ts` - A2S protocol handlers
  - `fragment.ts` - Multi-packet response handling
  - `byteio.ts` - Binary data processing
  - `types.ts` - TypeScript type definitions
  - `exceptions.ts` - Error classes
  - `defaults.ts` - Configuration constants

#### Build System

- **Vite Build Tool**: Fast development and optimized production builds
- **TypeScript Compiler**: Full TypeScript compilation with declaration files
- **Dual Module Support**: ESM (`dist/index.mjs`) and CommonJS (`dist/index.js`) outputs
- **Type Declarations**: Generated `.d.ts` files for TypeScript consumers

#### Development Tools

- **Vitest Testing**: Modern test runner with coverage reporting
- **ESLint**: Code quality and style enforcement
- **TypeScript**: Strict type checking and modern language features
- **Example Files**: Comprehensive usage examples for different scenarios

### Configuration

#### Default Settings

- **Timeout**: 3 seconds for network operations (`DEFAULT_TIMEOUT`)
- **Encoding**: UTF-8 string encoding (`DEFAULT_ENCODING`)
- **Retries**: 5 maximum challenge-response retries (`DEFAULT_RETRIES`)

#### Exports

- **Main API**: `A2SClient`, `info`, `players`, `rules`
- **Type Definitions**: `SourceInfo`, `GoldSrcInfo`, `Player`, `Rules`, `ServerInfo`
- **Utilities**: `ByteReader`, `ByteWriter` for advanced binary operations
- **Exceptions**: `BrokenMessageError`, `BufferExhaustedError`
- **Constants**: `DEFAULT_TIMEOUT`, `DEFAULT_ENCODING`, `DEFAULT_RETRIES`

### Compatibility

- **Node.js**: Compatible with Node.js 18+ (uses modern `node:` imports)
- **Engines**: Supports both Source Engine and GoldSource Engine servers
- **Dependencies**: Zero runtime dependencies for minimal footprint
- **Module Systems**: Full ESM and CommonJS compatibility
- **TypeScript**: Native TypeScript support with complete type definitions

### Performance & Quality

- **Memory Efficient**: Optimized buffer handling and resource cleanup
- **Network Optimized**: Minimal network overhead with proper connection management
- **Type Safe**: Compile-time type checking prevents runtime errors
- **Well Tested**: Comprehensive test coverage ensures reliability
- **Production Ready**: Clean, optimized code suitable for production environments
