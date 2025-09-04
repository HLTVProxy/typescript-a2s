/// <reference types="node" />
import { info, players, rules, A2SClient } from '../src/index.js';
import type { SourceInfo, Player, Rules } from '../src/index.js';

const SERVER_ADDRESS = '127.0.0.1';
const SERVER_PORT = 27015;

// TypeScript example demonstrating typed usage
async function queryServerTyped(
  address: string = SERVER_ADDRESS,
  port: number = SERVER_PORT
): Promise<void> {
  try {
    console.log(`Querying server: ${address}:${port}`);
    console.log('='.repeat(50));

    // Use standalone functions with explicit types
    const serverInfo: SourceInfo | import('../src/types.js').GoldSrcInfo =
      await info(address, port);
    console.log('Server Info:', {
      name: serverInfo.serverName,
      map: serverInfo.mapName,
      players: `${serverInfo.playerCount}/${serverInfo.maxPlayers}`,
      ping: `${(serverInfo.ping * 1000).toFixed(2)}ms`,
    });

    const playerList: Player[] = await players(address, port);
    console.log(`Found ${playerList.length} players`);

    const serverRules: Rules = await rules(address, port);
    console.log(`Found ${Object.keys(serverRules).length} rules`);

    // Use the A2SClient class (reuses connection logic)
    const client = new A2SClient(address, port);

    console.log('\n--- Using A2SClient class ---');
    const info2 = await client.info();
    const players2 = await client.players();
    const rules2 = await client.rules();

    console.log('Client results:', {
      serverName: info2.serverName,
      playerCount: players2.length,
      ruleCount: Object.keys(rules2).length,
    });
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

// Example: custom timeout and encoding (returns Buffers)
async function queryWithCustomOptions(): Promise<void> {
  try {
    // 5 second timeout, no string encoding (returns Buffers instead of strings)
    const serverInfo = await info(SERVER_ADDRESS, SERVER_PORT, 5000, null);
    console.log('Raw buffer results:', {
      serverName: serverInfo.serverName, // This will be a Buffer
      map: serverInfo.mapName, // This will be a Buffer
    });
  } catch (error: any) {
    console.log('Custom options example failed:', error.message);
  }
}

async function main(): Promise<void> {
  console.log('🎯 TypeScript A2S Examples');

  // Test with local server
  await queryServerTyped(SERVER_ADDRESS, SERVER_PORT);

  console.log('\n' + '='.repeat(50));

  // Test custom options
  await queryWithCustomOptions();
}

// Export for use as a module if needed
export { queryServerTyped, queryWithCustomOptions };

// Run main() if this file is executed directly (Node.js ESM)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
