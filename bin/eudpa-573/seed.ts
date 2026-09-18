/**
 * Apply an EUDPA-573 stale-state scenario to a submitted notification.
 *
 * Usage:
 *   tsx bin/eudpa-573/seed.ts --frontend <animals|plants> --ref <REFERENCE> --scenario <ID>
 *   tsx bin/eudpa-573/seed.ts --list
 *
 * The user submits a notification through the UI, notes its reference number,
 * then runs this script to plant the stale-state scenario on the persisted
 * document. Refreshing the dashboard shows the mutation take effect via Amend.
 *
 * Requires the compose stack to be running locally; MONGODB_URI defaults to
 * mongodb://localhost:27017.
 */

import { MongoDbClient } from '@adapters/db/mongodb-client';
import { SCENARIOS, type Frontend } from './scenarios/index.js';

const DATABASE_BY_FRONTEND: Record<Frontend, string> = {
  animals: 'trade-imports-animals-backend',
  plants: 'trade-imports-plants-backend',
};

type Args = { frontend?: Frontend; ref?: string; scenario?: string; list?: boolean };

const parseArgs = (argv: readonly string[]): Args => {
  const args: Args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === '--list') {
      args.list = true;
      continue;
    }
    const value = argv[i + 1];
    if (flag === '--frontend') {
      if (value !== 'animals' && value !== 'plants') {
        throw new Error(`--frontend must be one of animals|plants, got: ${value ?? '(missing)'}`);
      }
      args.frontend = value;
      i += 1;
    } else if (flag === '--ref') {
      args.ref = value;
      i += 1;
    } else if (flag === '--scenario') {
      args.scenario = value;
      i += 1;
    }
  }
  return args;
};

const printScenarios = () => {
  console.log('Available scenarios:');
  for (const scenario of Object.values(SCENARIOS)) {
    console.log(`  ${scenario.id.padEnd(20)} — ${scenario.summary}`);
    console.log(`  ${''.padEnd(20)}   applies to: ${scenario.applies.join(', ')}`);
  }
};

const usage = () => {
  console.log('Usage:');
  console.log('  tsx bin/eudpa-573/seed.ts --frontend <animals|plants> --ref <REFERENCE> --scenario <ID>');
  console.log('  tsx bin/eudpa-573/seed.ts --list');
  console.log('');
  printScenarios();
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));

  if (args.list) {
    printScenarios();
    return;
  }

  if (!args.frontend || !args.ref || !args.scenario) {
    usage();
    process.exit(1);
  }

  const scenario = SCENARIOS[args.scenario];
  if (!scenario) {
    console.error(`Unknown scenario "${args.scenario}". Run --list to see the choices.`);
    process.exit(1);
  }
  if (!scenario.applies.includes(args.frontend)) {
    console.error(`Scenario ${scenario.id} does not apply to ${args.frontend} (applies to: ${scenario.applies.join(', ')}).`);
    process.exit(1);
  }

  const client = new MongoDbClient();
  await client.connect();
  try {
    const notifications = client.collection(DATABASE_BY_FRONTEND[args.frontend], 'notification');
    console.log(`Applying "${scenario.id}" to ${args.frontend}/${args.ref}…`);
    await scenario.mutate({ notifications, referenceNumber: args.ref, frontend: args.frontend });
    console.log(`Done. Open the ${args.frontend} dashboard and click Amend on ${args.ref} to see it.`);
  } finally {
    await client.close();
  }
};

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
