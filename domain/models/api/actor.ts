import { defaultUser } from '@config/users';

/**
 * The acting user on a notification write — the backend's `ActorRequest`.
 * `organisationId` is the load-bearing field: address-book lookups are
 * organisation-scoped, so it is the only thing that lets the backend resolve a
 * notification's party references onto the outbox event.
 */
export type NotificationActor = {
  id: string;
  source: string;
  userType: string;
  displayName: string;
  organisationId: string;
  onBehalfOfOrganisationId?: string;
};

/**
 * What the frontend's `buildActor` produces for the default signed-in identity,
 * so an API-seeded notification is written by the same actor as a UI-driven one.
 */
export const defaultActor: NotificationActor = {
  id: defaultUser.crn,
  source: 'dynamics-contact',
  userType: 'B2C',
  displayName: defaultUser.displayName,
  organisationId: defaultUser.organisationId,
};
