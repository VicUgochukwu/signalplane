const LOOPS_API_KEY = Deno.env.get('LOOPS_API_KEY');
const LOOPS_API_URL = 'https://app.loops.so/api/v1';

export interface LoopsContact {
  email: string;
  firstName?: string;
  lastName?: string;
  source?: string;
  userGroup?: string;
  userId?: string;
  companyName?: string;
  industry?: string;
  signupDate?: string;
  onboardingCompleted?: boolean;
  hasSlack?: boolean;
  hasNotion?: boolean;
}

/**
 * Create or update a contact in Loops.
 * Never throws — Loops sync is supplementary and should never block main flows.
 */
export async function createOrUpdateContact(contact: LoopsContact): Promise<boolean> {
  if (!LOOPS_API_KEY) {
    console.warn('LOOPS_API_KEY not set, skipping Loops contact sync');
    return false;
  }

  try {
    const response = await fetch(`${LOOPS_API_URL}/contacts/update`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${LOOPS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contact),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Loops contact sync failed:', response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Loops contact sync error:', error);
    return false;
  }
}

/**
 * Send an event to Loops for a specific contact (by email).
 * Never throws — Loops events are fire-and-forget.
 */
export async function sendEvent(
  email: string,
  eventName: string,
  eventProperties?: Record<string, string | number | boolean>
): Promise<boolean> {
  if (!LOOPS_API_KEY) {
    console.warn('LOOPS_API_KEY not set, skipping Loops event:', eventName);
    return false;
  }

  try {
    const response = await fetch(`${LOOPS_API_URL}/events/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOOPS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        eventName,
        eventProperties: eventProperties || {},
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Loops event '${eventName}' failed:`, response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Loops event '${eventName}' error:`, error);
    return false;
  }
}
