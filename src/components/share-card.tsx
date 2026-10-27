"use client";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, Share2, ArrowUpRight } from "lucide-react";
import { shareUrl } from "@/lib/client";
export function ShareCard({ id }: { id: string }) {
  const url = shareUrl(id);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setMessage("Link copied to clipboard.");
    } catch {
      setMessage("Copy the link from the field below.");
    }
  }
  return (
    <div className="share-card">
      <div className="qr">
        <QRCodeSVG
          value={url}
          size={172}
          marginSize={3}
          title="Scan to open this drop"
        />
      </div>
      <div className="share-details">
        <span className="eyebrow">A LITTLE LINK. ENDLESS POSSIBILITIES.</span>
        <h2>Ready to pass it on.</h2>
        <p>
          Anyone with this link can open your drop. Share the password
          separately if you added one.
        </p>
        <label className="sr-only" htmlFor={`link-${id}`}>
          Share link
        </label>
        <input
          id={`link-${id}`}
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
        />
        <div className="button-row">
          <button className="primary" onClick={copy}>
            {copied ? <Check size={16} /> : <Copy size={16} />}Copy Link
          </button>
          <button
            className="secondary"
            onClick={async () => {
              if (!navigator.share) return copy();
              try {
                await navigator.share({
                  title: "WeDrop – Drop it. Share it.",
                  url,
                });
              } catch (e) {
                if ((e as Error).name !== "AbortError")
                  setMessage("Sharing is unavailable. Copy the link instead.");
              }
            }}
          >
            <Share2 size={16} />
            Share
          </button>
          <a className="icon-button" href={`/d/${id}`} aria-label="Open drop">
            <ArrowUpRight size={18} />
          </a>
        </div>
        <p className="feedback" role="status">
          {message}
        </p>
      </div>
    </div>
  );
}
