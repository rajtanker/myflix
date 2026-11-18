jsx
import { SITE } from '@/lib/config';

export const metadata = { title: 'DMCA Takedown Policy' };

export default function DmcaPage() {
  return (
    <article className="prose-card">
      <h1>DMCA &amp; Copyright Policy</h1>
      <p>
        {SITE.name} respects the intellectual property rights of others. This website operates strictly as an informational index and embeds links hosted by third-party services not affiliated with {SITE.name}.
      </p>
      <h2>Filing a Removal Request</h2>
      <p>
        If you are a copyright owner or authorized agent and believe any indexed title infringes your copyright, please send a notice containing the exact page URL, title, and proof of ownership. Verified requests are processed within 48 hours.
      </p>
      <p>
        <strong>DMCA Contact Email:</strong> {SITE.email}
      </p>
    </article>
  );
}
