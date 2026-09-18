import { redirect } from 'next/navigation';

/**
 * /profile redirects to the Account tab of Settings so the user dropdown
 * "My Settings" link lands on the right place.
 */
export default function ProfilePage() {
  redirect('/settings/general?tab=account');
}
