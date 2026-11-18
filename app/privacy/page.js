import { SITE } from '@/lib/config';

export const metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <article className="prose-card">
      <h1>Privacy Policy</h1>
      <p>
        {SITE.name} does not require account registration and does not collect personal data such as names, passwords, or payment information.
      </p>
      <h2>Local Storage</h2>
      <p>
        Features like your Watchlist and Continue Watching history are stored strictly inside your own browser&apos;s <code>localStorage</code> and never leave your device.
      </p>
      <h2>Third-Party Embeds &amp; Services</h2>
      <p>
        Third-party video embed providers and analytics or advertising partners may set cookies or collect anonymous technical logs in accordance with their respective privacy policies.
      </p>
    </article>
  );
}
