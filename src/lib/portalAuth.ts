import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from './firebase.ts';
import { PRIMARY_OWNER_EMAIL } from './portalRoles.ts';

export const EXPECTED_PORTAL_EMAIL =
  (import.meta.env.VITE_PORTAL_EMAIL as string | undefined)?.trim().toLowerCase() ||
  PRIMARY_OWNER_EMAIL;

export async function signInPortalWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function signOutPortal(): Promise<void> {
  await signOut(auth);
}
