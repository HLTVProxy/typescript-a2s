import { info, players, rules, A2SClient } from '../src/index.js';

const SERVER_ADDRESS = '127.0.0.1';
const SERVER_PORT = 27015;

/**
 * Example usage of the TypeScript A2S library
 */
async function example() {
  // Example server address (replace with actual server)
  const address = SERVER_ADDRESS;
  const port = SERVER_PORT;

  console.log('🔍 Querying server:', `${address}:${port}`);
  console.log('='.repeat(50));

  try {
    // Method 1: Using convenience functions
    console.log('📊 Getting server info...');
    const serverInfo = await info(address, port);

    console.log(`Server Name: ${serverInfo.serverName}`);
    console.log(`Map: ${serverInfo.mapName}`);
    console.log(`Game: ${serverInfo.game}`);
    console.log(`Players: ${serverInfo.playerCount}/${serverInfo.maxPlayers}`);
    console.log(`Ping: ${serverInfo.ping.toFixed(3)}s`);
    console.log('');

    console.log('👥 Getting player list...');
    const playerList = await players(address, port);

    if (playerList.length > 0) {
      console.log(`Found ${playerList.length} players:`);
      playerList.slice(0, 10).forEach((player, index) => {
        const duration = Math.floor(player.duration / 60);
        console.log(
          `  ${index + 1}. ${player.name} - Score: ${
            player.score
          }, Time: ${duration}m`
        );
      });
      if (playerList.length > 10) {
        console.log(`  ... and ${playerList.length - 10} more players`);
      }
    } else {
      console.log('No players found');
    }

    // console.log('⚙️  Getting server rules...');
    // const serverRules = await rules(address, port);

    // const ruleKeys = Object.keys(serverRules);
    // console.log(`Found ${ruleKeys.length} rules:`);

    // Show some interesting rules
    // const interestingRules = [
    //   'mp_timelimit',
    //   'mp_maxrounds',
    //   'tf_gamemode_mvm',
    //   'nextlevel',
    // ];
    // interestingRules.forEach((rule) => {
    //   if (serverRules[rule]) {
    //     console.log(`  ${rule}: ${serverRules[rule]}`);
    //   }
    // });

    console.log('✅ Query completed successfully!');
  } catch (error: unknown) {
    const err = error as any;
    console.error('❌ Query failed:', err.message || error);

    if (err.code) {
      switch (err.code) {
        case 'ECONNREFUSED':
          console.error(
            '💡 The server may be offline or the port is incorrect'
          );
          break;
        case 'ETIMEDOUT':
          console.error(
            '💡 The request timed out - server may be slow to respond'
          );
          break;
        case 'ENOTFOUND':
          console.error(
            '💡 Could not resolve hostname - check the server address'
          );
          break;
        default:
          console.error('💡 Network error code:', err.code);
      }
    }
  }
}

/**
 * Example using the A2SClient class
 */
async function clientExample() {
  const address = SERVER_ADDRESS;
  const port = SERVER_PORT;

  console.log('🔧 Using A2SClient class...');

  const client = new A2SClient(address, port, 5000); // 5 second timeout

  try {
    // Query all information types concurrently
    const [serverInfo, playerList, serverRules] = await Promise.all([
      client.info(),
      client.players(),
      // client.rules(),
    ]);

    console.log('Server:', serverInfo.serverName);
    console.log('Players:', playerList.length);
    // console.log('Rules:', Object.keys(serverRules).length);
  } catch (error: unknown) {
    const err = error as any;
    console.error('Client query failed:', err.message || error);
  }
}

// Run the examples
example()
  .then(() => clientExample())
  .catch(console.error)
  .finally(() => {
    process.exit(1);
  });
