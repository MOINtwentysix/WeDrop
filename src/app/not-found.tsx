import Link from "next/link";
export default function NotFound() {
  return (
    <section className="narrow center">
      <h1>A little lost?</h1>
      <p className="intro">This page could not be found.</p>
      <Link href="/" className="primary">
        Back to WeDrop
      </Link>
    </section>
  );
}
