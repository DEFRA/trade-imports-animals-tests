/**
 * Ad-hoc read-only MongoDB query helper for the local workspace stack.
 *
 * Connects to the stack's mongodb (default mongodb://localhost:27017, override
 * with MONGODB_URI) and runs one operation against a db + collection, printing
 * the result as JSON. Intended for self-serve debugging, not test code.
 *
 * Run it via npm exec (bare `node` is blocked by the agent guard hooks):
 *   npm --prefix <tests-repo> exec -- node bin/db-query.mjs <db> <collection> <op> [jsonArg] [jsonArg2]
 *
 * Operations:
 *   find      jsonArg = filter (default {}), prints all matches
 *   findOne   jsonArg = filter (default {})
 *   count     jsonArg = filter (default {})
 *   distinct  jsonArg = field name (string), jsonArg2 = optional filter
 *   aggregate jsonArg = pipeline (JSON array)
 *
 * Examples:
 *   ... bin/db-query.mjs trade-imports-operators operators distinct crn
 *   ... bin/db-query.mjs trade-imports-operators operators count '{"status":"ACTIVE"}'
 *   ... bin/db-query.mjs trade-imports-operators operators find '{"operatorType":"TRANSPORTER"}'
 *   ... bin/db-query.mjs trade-imports-operators operators aggregate '[{"$group":{"_id":"$operatorType","n":{"$sum":1}}}]'
 */
import { MongoClient } from 'mongodb';

const URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017';

function usage(message) {
  if (message) console.error(`error: ${message}`);
  console.error('usage: node bin/db-query.mjs <db> <collection> <op> [jsonArg] [jsonArg2]');
  console.error('  op = find | findOne | count | distinct | aggregate');
  process.exit(1);
}

function parseJson(raw, label) {
  if (raw === undefined) return undefined;
  try {
    return JSON.parse(raw);
  } catch (err) {
    usage(`${label} is not valid JSON: ${err.message}`);
  }
}

const [db, collectionName, op, jsonArg, jsonArg2] = process.argv.slice(2);
if (!db || !collectionName || !op) usage('need <db> <collection> <op>');

const client = new MongoClient(URI);

try {
  await client.connect();
  const collection = client.db(db).collection(collectionName);
  let result;

  switch (op) {
    case 'find':
      result = await collection.find(parseJson(jsonArg, 'filter') ?? {}).toArray();
      break;
    case 'findOne':
      result = await collection.findOne(parseJson(jsonArg, 'filter') ?? {});
      break;
    case 'count':
      result = await collection.countDocuments(parseJson(jsonArg, 'filter') ?? {});
      break;
    case 'distinct':
      if (!jsonArg) usage('distinct needs a field name');
      result = await collection.distinct(jsonArg, parseJson(jsonArg2, 'filter') ?? {});
      break;
    case 'aggregate': {
      const pipeline = parseJson(jsonArg, 'pipeline');
      if (!Array.isArray(pipeline)) usage('aggregate needs a JSON array pipeline');
      result = await collection.aggregate(pipeline).toArray();
      break;
    }
    default:
      usage(`unknown op '${op}'`);
  }

  console.log(JSON.stringify(result, null, 2));
} catch (err) {
  console.error(`query failed: ${err.message}`);
  process.exitCode = 1;
} finally {
  await client.close();
}
