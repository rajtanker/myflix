export default function MovieFAQ({ item }) {
  const isTv = item.type === 'tv';
  const genresText = (item.genres || []).join(', ') || 'Entertainment';
  const castText = (item.cast || []).slice(0, 4).join(', ');
  const providersText = (item.providers || []).map((p) => p.name).join(', ');

  const faqs = [
    {
      q: `What is ${item.title} (${item.year}) about?`,
      a: item.overview || `${item.title} is a ${genresText} ${isTv ? 'series' : 'movie'} released in ${item.year}.`,
    },
    {
      q: `Where can I watch ${item.title} online?`,
      a: providersText
        ? `${item.title} can be streamed or rented on platforms such as ${providersText}, and you can also watch its official trailer and details right here on MyFlix.`
        : `You can watch trailers, explore multiple player servers, and view full cast and reviews for ${item.title} on this page.`,
    },
    {
      q: isTv
        ? `How many seasons does ${item.title} have?`
        : `How long is ${item.title} and who stars in it?`,
      a: isTv
        ? `${item.title} features ${item.seasons || 1} season(s)${castText ? ` starring ${castText}` : ''}.`
        : `${item.title} has a runtime of ${item.runtime ? `${item.runtime} minutes` : 'standard feature length'}${item.director ? `, directed by ${item.director}` : ''}${castText ? ` and starring ${castText}` : ''}.`,
    },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <section className="faq-sec">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c'),
        }}
      />
      <div className="sec-head">
        <h2 className="sec-title">
          <span className="sec-bar" />
          Frequently Asked Questions
        </h2>
      </div>
      <div className="faq-list">
        {faqs.map((f, i) => (
          <details key={i} className="faq-item" open={i === 0}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
