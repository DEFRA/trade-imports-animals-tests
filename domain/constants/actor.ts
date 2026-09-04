import { users } from '@config/users';

/**
 * The actor the frontend puts on every notification write, built from the
 * signed-in Defra ID credentials (`buildActor` in the frontend's
 * actor-helpers). Anything writing to the notification API on the default
 * user's behalf sends the same one.
 *
 * It is not decoration. The actor's organisation is the only one the backend
 * has to resolve the notification's address-book parties against, and the
 * transitions that put a party on a GBNAG document — submit, amend,
 * cancel-amend, and deleting a submitted notification — resolve them strictly.
 * A call without it is rejected outright once the notification references any
 * address at all.
 */
export const DEFAULT_ACTOR = {
  id: users.andrew.crn,
  source: 'dynamics-contact',
  userType: 'B2C',
  displayName: users.andrew.displayName,
  organisationId: users.andrew.organisationId,
};
