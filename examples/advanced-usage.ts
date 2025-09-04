/// <reference types="node" />
import { info, players, rules, BrokenMessageError } from '../src/index.js';

const SERVER_ADDRESS = '127.0.0.1';
const SERVER_PORT = 27015;

/**
 * Advanced example showing error handling, multiple servers, and data processing
 */
async function advancedExample() {
  // Query a single server using one client instance
  const server = {
    name: 'Server Name',
    address: SERVER_ADDRESS,
    port: SERVER_PORT,
  };
  const { A2SClient } = await import('../src/a2s.js');
  const client = new A2SClient(server.address, server.port, 10000, 'utf-8');
  let infoResult, playersResult;
  try {
    infoResult = await client.info();
    playersResult = await client.players();
  } finally {
    client.close();
  }
  // You can return infoResult and playersResult or perform other processing here
  return { info: infoResult, players: playersResult };
}

/**
 * Example of handling different server types and encoding
 */
async function encodingExample() {
  console.log('\n🌐 Testing different encodings...\n');

  try {
    // Query with UTF-8 encoding (default)
    const infoUtf8 = await info(SERVER_ADDRESS, SERVER_PORT, 3000, 'utf-8');
    console.log('UTF-8 server name:', infoUtf8.serverName);

    // Query with raw bytes (no encoding)
    const infoRaw = await info(SERVER_ADDRESS, SERVER_PORT, 3000, null);
    console.log('Raw server name bytes:', infoRaw.serverName);

    // Query with different encoding
    const infoLatin1 = await info(SERVER_ADDRESS, SERVER_PORT, 3000, 'latin1');
    console.log('Latin1 server name:', infoLatin1.serverName);
  } catch (error) {
    if (error instanceof BrokenMessageError) {
      console.error('Protocol error:', error.message);
    } else {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Network error:', errorMessage);
    }
  }
}

/**
 * Example of server monitoring
 */
async function monitoringExample() {
  const serverAddress = SERVER_ADDRESS;
  const serverPort = SERVER_PORT;

  console.log('\n📈 Monitoring server (press Ctrl+C to stop)...\n');

  let previousPlayerCount = -1;

  const monitor = setInterval(async () => {
    try {
      const serverInfo = await info(serverAddress, serverPort, 2000);

      if (serverInfo.playerCount !== previousPlayerCount) {
        const timestamp = new Date().toLocaleTimeString();
        const change =
          previousPlayerCount === -1
            ? ''
            : serverInfo.playerCount > previousPlayerCount
            ? ' (+' + (serverInfo.playerCount - previousPlayerCount) + ')'
            : ' (' + (serverInfo.playerCount - previousPlayerCount) + ')';

        console.log(
          `[${timestamp}] ${serverInfo.serverName}: ${serverInfo.playerCount}/${serverInfo.maxPlayers} players${change}`
        );
        previousPlayerCount = serverInfo.playerCount;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(
        `[${new Date().toLocaleTimeString()}] Error: ${errorMessage}`
      );
    }
  }, 10000); // Check every 10 seconds

  // Clean shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Stopping monitor...');
    clearInterval(monitor);
    process.exit(0);
  });
}

// Run examples
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      await advancedExample();
      // await encodingExample();
      // await monitoringExample();
    } catch (error) {
      console.error('Example failed:', error);
      process.exit(1);
    }
  })();
}
