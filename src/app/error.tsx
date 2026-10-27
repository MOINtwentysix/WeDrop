"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="narrow center">
      <h1>Something went wrong.</h1>
      <p className="intro">Please try again in a moment.</p>
      <button className="primary" onClick={reset}>
        Try again
      </button>
    </section>
  );
}
