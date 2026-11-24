import QuizClient from '@/components/QuizClient';

export const metadata = {
  title: 'Daily Movie & TV Quiz — Test Your Cinema Knowledge',
  description: 'Can you guess the movie from its plot and rating? Play the MyFlix Movie Quiz and challenge your friends!',
  alternates: { canonical: '/quiz/' },
};

export default function QuizPage() {
  return (
    <>
      <div className="page-banner" style={{ textAlign: 'center' }}>
        <h1>Daily Movie &amp; Series Quiz</h1>
        <p>Guess 10 titles from plot clues and challenge your friends to beat your score!</p>
      </div>
      <QuizClient />
    </>
  );
}
