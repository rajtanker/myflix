jsx
import { SITE } from '@/lib/config';

export const metadata = { title: 'Contact Us' };

export default function ContactPage() {
  return (
    <article className="prose-card">
      <h1>Contact {SITE.name}</h1>
      <p>
        Have a movie request, broken link report, feedback, or copyright inquiry? Reach out to our team directly via email.
      </p>
      <p>
        <strong>Email:</strong> {SITE.email}
      </p>
    </article>
  );
}
