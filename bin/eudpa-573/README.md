# EUDPA-573 — stale-state demo tooling

Small CLI that plants a stale-state scenario on a submitted notification,
so the shonky Amend UX described in
`workareas/shared/eudpa-573-stale-state/notes.md` (workspace repo) can
be walked through in front of stakeholders.

## What each scenario simulates

| Scenario id          | Simulates                                                                                                                                                            | What to look for on Amend                                                                                                                                                                                                                                     |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `country-stale`      | MDM re-release dropped the ISO code the trader submitted for the country of origin.                                                                                  | Dashboard card shows the raw ISO code. Hub row shows Completed. Origin page: select renders unselected, no message. Animals: pressing Save-and-continue overwrites the stored value with empty (`oneOf` rule). Plants: `requiredOneOf` blocks the empty save. |
| `unknown-obligation` | An obligation has been removed from the manifest since submit. A fulfilment keyed on an id the manifest no longer knows sits in the doc.                             | The engine's `dropUnrecognisedFulfilments` sweeps the entry out silently on read. Dashboard is unaffected. Amend journey has lost the answer with no user warning.                                                                                            |
| `party-deleted`      | An address-book party (consignor / place-of-destination / contact address / consignee / importer / place-of-origin) referenced by the notification has been deleted. | Dashboard card still names the party (extracted at submit). Hub row still Completed. CYA card shows "Not provided" plus an outstanding-party error banner. Three surfaces disagree.                                                                           |

## Prerequisites

- The workspace compose stack running locally with plants and animals
  frontends up, backends up, mongodb up.
- A submitted notification you can identify by reference number.
- `MONGODB_URI` reachable at `mongodb://localhost:27017` (the compose
  stack default).

To bring the stack up:

```sh
cd ~/git/defra/trade-imports-workspace
./scripts/stack/run-stack.sh
```

Profiles are role-based, not per-service — `frontend` covers every
frontend (animals, admin, INS, plants) and `backend` covers every
backend (animals, INS, plants, reference-data, address-book, dynamics
gateway). With no `--profile` flag, all default profiles start.

## Getting a submitted notification

Sign in via the browser to the frontend you want to demo (localhost:3000
for animals, localhost:3003 for plants), submit a notification through
the normal UI, then read the reference number off the dashboard card.

For animals only, there is a faster HTTP-only seeder in the tests
repo — `flows/seeded-journey.ts` `SeededJourney.createSubmittedNotification()`.
It's used inside Playwright specs; wrapping it in a CLI is a
follow-up. For plants there is no HTTP seeder — submit via the UI.

## Applying a scenario

From the tests repo root:

```sh
# list what's available
npx tsx bin/eudpa-573/seed.ts --list

# plant a scenario on a submitted notification
npx tsx bin/eudpa-573/seed.ts --frontend plants --ref GBN-HRP-26-ABCDEF --scenario country-stale
npx tsx bin/eudpa-573/seed.ts --frontend animals --ref GBN-AG-26-XXXXXX --scenario party-deleted
```

Each scenario is idempotent — running it twice leaves the doc in the same
state. Applying two different scenarios to the same notification is
supported but the effects overlap — best to seed one scenario per
notification for a clean walk.

Once the mutation has been applied, refresh the dashboard and click
**Amend** on the affected notification. The frontend re-reads the
document on Amend, so no restart is needed.

## Teardown

The seeded notifications remain in Mongo until you delete them from the
dashboard (the trader flow) or wipe them via mongosh. The compose stack
recreates the mongodb volume between stack starts, so a full stack
teardown removes them.

## Walk-through — a suggested demo order

1. **Happy path first.** Submit a fresh notification through the UI so
   the audience sees "normal". Amend it, walk hub → origin → CYA →
   check-your-answers with no mutations applied. Cancel amendment.
2. **`country-stale` (plants).** Faster to demo on plants because it
   asks fewer questions before the origin page. Amend, walk to the hub,
   note the Completed row. Open the origin page, note the unselected
   select with no message. Return to the hub. Open check-your-answers
   — note the raw ISO code in the origin row. Then look at the
   dashboard card behind — same code.
3. **`country-stale` (animals).** Repeat, adding the `oneOf` twist —
   press Save and continue with the field unselected, observe the
   stored answer being wiped without acknowledgement.
4. **`unknown-obligation`.** Amend, walk to the hub — nothing looks
   different. That's the point: whatever was previously stored under
   the missing obligation id is gone.
5. **`party-deleted`.** Amend, look at the dashboard card (party name
   still there), the hub (row Completed), and the CYA card ("Not
   provided" + error banner). Three surfaces, three stories.

## Adding a new scenario

Each scenario lives in `scenarios/<id>.ts` and exports a `Scenario`
whose `mutate` runs against the notification's Mongo document. Register
it in `scenarios/index.ts`. Keep the mutation idempotent, and throw
loudly if the notification is not in a state the scenario expects
(e.g. no `countryOfOrigin` fulfilment for `country-stale`).

## Known limitation — dashboard card doesn't reflect the mutation (follow-up)

The seed rewrites only the raw `fulfilments` array. The dashboard row
reads from a separate flat projection on the same document —
`notification.origin.countryCode`, `notification.consignor.name`,
`notification.consignee.name`, `notification.commodity`,
`notification.transport.arrivalDate` — extracted at submit time by the
dashboard list-item mapper
(`services/persistence/records/real/marshal/list-item.js` in the
animals frontend). Those projected fields are untouched by the seed,
so the dashboard card still shows the trader's original answers after
any scenario runs.

Concretely for `country-stale`: the dashboard card still names
"Austria" even after the fulfilment has been rewritten to `ZZ`. A real
MDM re-release incident would have both storage locations holding the
stale code, and the dashboard would render the raw ISO because
`originLabel('ZZ') ?? 'ZZ'` — that surface is precisely one leg of the
cross-view divergence described in `notes.md`.

Follow-up: extend each scenario to also update the projected fields
whose display path it means to break, so the dashboard tells the same
story a live incident would tell. Concretely:

- `country-stale` — also `$set` `notification.origin.countryCode` (and
  the plants equivalent) to the stale code.
- `party-deleted` — also blank or repoint the frozen party names on
  the doc (`notification.consignor.name`, `notification.consignee.name`
  and any other projected party names).
- `unknown-obligation` — no equivalent projected field; nothing to
  extend.

Keep the scenarios idempotent — a second run should leave the doc in
the same terminal state, not double-mutate.

## Related

- Investigation notes: `workareas/shared/eudpa-573-stale-state/notes.md`
  on the trade-imports-workspace repo.
- Level 1 pinning tests: the plants-frontend
  `chore/EUDPA-573-stale-state-pinning-tests` branch (PR #72).
