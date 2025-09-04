# Contributing to TypeScript A2S

Thank you for considering contributing to TypeScript A2S! This library provides a modern TypeScript implementation of Valve's A2S (Application-level Server Query) protocol for querying Source and GoldSource game servers. This document outlines the development process, guidelines, and best practices for contributors.

## Development Environment Setup

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **Package Manager**: pnpm (recommended), npm, or yarn
- **TypeScript**: Version 5.0.0 or higher (handled via devDependencies)
- **Git**: For version control and contribution workflow

### Initial Setup

1. **Clone the Repository**

   ```bash
   git clone https://github.com/HLTVProxy/typescript-a2s.git
   cd typescript-a2s
   ```

2. **Install Dependencies**

   ```bash
   # Using pnpm (recommended)
   pnpm install

   # Or using npm
   npm install

   # Or using yarn
   yarn install
   ```

3. **Verify Installation**

   ```bash
   # Run the test suite to ensure everything is working
   pnpm test

   # Build the library to verify the build system
   pnpm build
   ```

## Available Development Scripts

### Core Development Commands

- **`pnpm dev`** - Start development mode with Vite
- **`pnpm build`** - Build the library for production (ESM + CommonJS)
- **`pnpm build:types`** - Generate TypeScript declaration files only
- **`pnpm preview`** - Preview the built library

### Testing Commands

- **`pnpm test`** - Run the complete test suite with Vitest
- **`pnpm test:ui`** - Run tests with interactive UI interface
- **`pnpm test:coverage`** - Generate comprehensive test coverage reports

### Code Quality Commands

- **`pnpm lint`** - Run ESLint to check code quality and style
- **`pnpm lint:fix`** - Automatically fix linting issues where possible

### Example and Demo Commands

- **`pnpm example`** - Run the basic usage example with tsx

## Project Architecture

### Directory Structure

```
typescript-a2s/
├── src/                     # Source code directory
│   ├── a2s.ts              # Core A2S client implementation
│   ├── byteio.ts           # Binary data I/O utilities (ByteReader/ByteWriter)
│   ├── defaults.ts         # Default configuration constants
│   ├── exceptions.ts       # Custom exception classes and error handling
│   ├── fragment.ts         # Multi-packet response fragment handling
│   ├── index.ts            # Main library entry point and public API
│   ├── protocols.ts        # A2S protocol implementations (info, players, rules)
│   ├── socket.ts           # UDP network communication layer
│   ├── types.ts            # TypeScript type definitions and interfaces
│   └── __tests__/          # Comprehensive test suite
│       ├── a2s.test.ts         # Core client functionality tests
│       ├── byteio.test.ts      # Binary I/O operations tests
│       ├── defaults.test.ts    # Configuration constants tests
│       ├── exceptions.test.ts  # Error handling tests
│       ├── fragment.test.ts    # Fragment handling tests
│       ├── index.test.ts       # Public API tests
│       ├── protocols.test.ts   # Protocol implementation tests
│       ├── socket.test.ts      # Network layer tests
│       └── types.test.ts       # Type validation tests
├── examples/                # Usage examples and demonstrations
│   ├── basic-usage.ts          # Simple query examples
│   ├── advanced-usage.ts       # Multi-server and monitoring examples
│   └── typescript-usage.ts     # TypeScript-specific implementation patterns
├── dist/                    # Built output (generated)
├── docs/                    # Documentation files
├── .eslintrc.cjs           # ESLint configuration
├── tsconfig.json           # TypeScript compiler configuration
├── vite.config.ts          # Vite build system configuration
├── vitest.config.ts        # Vitest testing framework configuration
└── package.json            # Project metadata and dependencies
```

### Core Module Responsibilities

- **`a2s.ts`**: Main client implementation with high-level query functions
- **`socket.ts`**: Low-level UDP network communication and connection management
- **`protocols.ts`**: A2S protocol handlers for info, players, and rules queries
- **`fragment.ts`**: Multi-packet response reassembly and decompression
- **`byteio.ts`**: Binary data reading/writing utilities for protocol parsing
- **`types.ts`**: Complete TypeScript type definitions for all data structures
- **`exceptions.ts`**: Custom error classes for protocol and network errors
- **`defaults.ts`**: Configuration constants and default values

## Development Guidelines

### Code Style and Standards

- **TypeScript Strict Mode**: All code must compile with strict TypeScript settings
- **ESLint Compliance**: Follow the project's ESLint configuration without warnings
- **Naming Conventions**:
  - Use `camelCase` for variables, functions, and methods
  - Use `PascalCase` for classes, interfaces, and type definitions
  - Use `UPPER_SNAKE_CASE` for constants and enum values
- **Documentation**: Add comprehensive JSDoc comments for all public APIs
- **Type Safety**: Provide explicit type annotations where TypeScript inference is unclear

### Code Quality Requirements

```typescript
// Good: Explicit typing and documentation
/**
 * Queries server information using the A2S_INFO protocol
 * @param address - Server IP address or hostname
 * @param port - Server query port
 * @param timeout - Request timeout in seconds
 * @returns Promise resolving to server information
 */
export async function info(
  address: string,
  port: number,
  timeout: number = DEFAULT_TIMEOUT
): Promise<SourceInfo | GoldSrcInfo> {
  // Implementation
}

// Bad: Missing documentation and implicit types
export async function info(address, port, timeout = 3) {
  // Implementation
}
```

### Testing Requirements

- **Test Coverage**: Aim for 100% test coverage for all new code
- **Test Types**:
  - Unit tests for individual functions and classes
  - Integration tests for protocol implementations
  - Error handling tests for all exception paths
  - Network communication tests with mocking
- **Test Naming**: Use descriptive test names that explain the scenario

```typescript
// Good: Descriptive test names
describe('A2S Info Protocol', () => {
  it('should parse Source engine server response correctly', async () => {
    // Test implementation
  });

  it('should handle malformed server responses gracefully', async () => {
    // Test implementation
  });

  it('should timeout appropriately on non-responsive servers', async () => {
    // Test implementation
  });
});
```

### Performance Considerations

- **Memory Management**: Properly clean up resources, especially network connections
- **Async Operations**: Use Promise-based APIs consistently
- **Error Handling**: Implement comprehensive error handling for network operations
- **Bundle Size**: Keep the library lightweight with zero runtime dependencies

## Contribution Workflow

### Pull Request Process

1. **Fork and Branch**

   ```bash
   # Fork the repository on GitHub
   git clone https://github.com/YOUR_USERNAME/typescript-a2s.git
   cd typescript-a2s

   # Create a feature branch
   git checkout -b feature/your-feature-name
   ```

2. **Development Cycle**

   ```bash
   # Make your changes
   # Write or update tests
   pnpm test

   # Ensure code quality
   pnpm lint:fix

   # Verify the build
   pnpm build
   ```

3. **Testing Requirements**

   - All existing tests must pass
   - New functionality must include comprehensive tests
   - Aim for 100% code coverage on new code
   - Test edge cases and error conditions

4. **Documentation Updates**

   - Update README.md if adding new public APIs
   - Add or update JSDoc comments for new functions
   - Update examples if changing existing APIs
   - Update CHANGELOG.md with your changes

5. **Submit Pull Request**
   - Provide a clear description of changes
   - Reference any related issues
   - Include screenshots or examples if applicable
   - Ensure CI checks pass

### Commit Message Guidelines

Use conventional commit format:

```
type(scope): brief description

Detailed explanation if necessary

Closes #issue-number
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples**:

```
feat(protocols): add support for compressed server responses
fix(socket): handle connection timeout errors properly
docs(readme): update API documentation with new examples
test(fragment): add tests for multi-packet reassembly
```

## API Compatibility Guidelines

This library maintains compatibility with the original [python-a2s](https://github.com/Yepoleb/python-a2s) library:

### Core Principles

- **Function Signatures**: Maintain similar parameter order and naming
- **Return Types**: Provide equivalent data structures with TypeScript typing
- **Default Values**: Use the same timeout and encoding defaults
- **Error Handling**: Provide similar exception types and error messages
- **Protocol Support**: Support the same server types and game engines

### Compatibility Examples

```typescript
// Python A2S equivalent
// info = a2s.info(("127.0.0.1", 27015), timeout=3.0, encoding="utf-8")

// TypeScript A2S implementation
const info = await info('127.0.0.1', 27015, 3.0, 'utf-8');
```

## Bug Reports and Feature Requests

### Reporting Issues

When reporting bugs, please include:

1. **Environment Information**:

   - TypeScript A2S version
   - Node.js version
   - Operating system
   - Package manager and version

2. **Reproduction Details**:

   - Minimal code example that reproduces the issue
   - Complete error messages and stack traces
   - Expected vs actual behavior
   - Steps to reproduce

3. **Server Information** (if applicable):
   - Game server type (Source/GoldSource)
   - Server software and version
   - Network configuration details

### Feature Requests

For new features, please provide:

1. **Use Case**: Detailed description of the problem being solved
2. **Proposed Solution**: Your suggested implementation approach
3. **API Design**: How the feature would be used by library consumers
4. **Compatibility**: How it fits with existing APIs and the Python library
5. **Testing Strategy**: How the feature would be tested

## Development Tools and Configuration

### Build System

- **Vite**: Modern build tool with excellent TypeScript support
- **Rollup**: Bundling with tree-shaking for optimal output
- **TypeScript**: Strict type checking with declaration generation
- **Output Formats**: ESM (.mjs) and CommonJS (.js) for universal compatibility

### Testing Framework

- **Vitest**: Fast test runner with native ES modules support
- **Coverage**: Comprehensive coverage reporting with v8 provider
- **Mocking**: Network and system mocking for reliable tests
- **Watch Mode**: Real-time test execution during development

### Code Quality Tools

- **ESLint**: Comprehensive linting with TypeScript-specific rules
- **TypeScript Compiler**: Strict type checking and error detection
- **Prettier Integration**: Consistent code formatting (via ESLint)

### VS Code Integration

Recommended VS Code extensions for optimal development experience:

- TypeScript and JavaScript Language Features
- ESLint
- Vitest (for test runner integration)
- GitLens (for Git integration)

## Release Process

### Version Management

- Follow [Semantic Versioning](https://semver.org/) (SemVer)
- Update CHANGELOG.md with all changes
- Tag releases with version numbers
- Maintain backward compatibility within major versions

### Publishing Checklist

1. Run full test suite: `pnpm test`
2. Generate coverage report: `pnpm test:coverage`
3. Build production assets: `pnpm build`
4. Verify package contents: Check `dist/` directory
5. Update documentation if needed
6. Update version in `package.json`
7. Create release notes
8. Publish to NPM registry

## Getting Help

### Community Support

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and community support
- **Pull Requests**: For code contributions and improvements

### Documentation Resources

- **README.md**: Complete API documentation with examples
- **Examples Directory**: Real-world usage patterns
- **Source Code**: Comprehensive JSDoc comments
- **Test Suite**: Detailed usage examples and edge cases

### Learning Resources

- [Valve's A2S Protocol Documentation](https://developer.valvesoftware.com/wiki/Server_queries)
- [Original Python A2S Library](https://github.com/Yepoleb/python-a2s)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js UDP Documentation](https://nodejs.org/api/dgram.html)

Thank you for contributing to TypeScript A2S! Your contributions help improve the library for the entire game server monitoring and management community.
