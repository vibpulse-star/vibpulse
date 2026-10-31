import 'server-only';
import { notFound } from 'next/navigation';
import { currentUser } from './supabase';

/** Default-deny gate for War Room / Skill Tree. 404 so the routes don't advertise themselves. */
export async function requireOwner() {
  const user = await currentUser();
  const owner = process.env.OWNER_EMAIL?.toLowerCase();
  if (!owner || !user?.email || user.email.toLowerCase() !== owner) notFound();
  return user;
}
