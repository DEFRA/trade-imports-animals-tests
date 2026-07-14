# Canned data

Verbatim copies of the frontend's canned select datasets. The frontend stores
the chosen entry whole into the notification, so seeded notifications must use
these exact objects to be indistinguishable from UI-created ones.

Source files (DEFRA/trade-imports-animals-frontend, `main`, under `src/server/`):

| File here                | Frontend source                                               |
| ------------------------ | ------------------------------------------------------------- |
| `transporters.json`      | `transporters/select/mock-transporters.json`                  |
| `species.json`           | `commodities/select/mock-species.json`                        |
| `commodity-details.json` | `commodities/select/mock-commodity-details.json`              |
| `place-of-origins.json`  | `addresses/place-of-origin/select/mock-place-of-origins.json` |
| `consignors.json`        | `addresses/consignors/select/mock-consignors.json`            |
| `consignees.json`        | `addresses/consignees/select/mock-consignees.json`            |
| `importers.json`         | `addresses/importers/select/mock-importers.json`              |
| `destinations.json`      | `addresses/destinations/select/mock-destinations.json`        |
| `contacts.json`          | `addresses/consignment/contact/select/mock-contacts.json`     |

Countries are not vendored: the frontend origin page fetches them live from the
reference-data service, and so does the TestDataHelper
(`adapters/http/reference-data-client.ts`).
