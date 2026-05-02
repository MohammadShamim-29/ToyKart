import { Link2, Mail, Share2 } from "lucide-react";

const ProductShareRow = ({ url, title }) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const nativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: title, url });
        return;
      } catch {
        /* user cancelled or share failed */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* ignore */
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* ignore */
    }
  };

  const links = [
    {
      label: "Share on Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      glyph: "f",
      mod: "facebook"
    },
    {
      label: "Share on X",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      glyph: "X",
      mod: "x"
    },
    {
      label: "Share on LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      glyph: "in",
      mod: "linkedin"
    },
    {
      label: "Share by email",
      href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
      icon: "mail"
    }
  ];

  return (
    <div className="pd-share">
      <span className="pd-share-label">Share</span>
      <div className="pd-share-btns">
        <button type="button" className="pd-share-btn" aria-label="Share or copy link" onClick={nativeShare}>
          <Share2 size={18} strokeWidth={1.75} />
        </button>
        {links.map((item) =>
          item.icon === "mail" ? (
            <a key={item.label} href={item.href} className="pd-share-btn" aria-label={item.label}>
              <Mail size={18} strokeWidth={1.75} />
            </a>
          ) : (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`pd-share-btn pd-share-btn--${item.mod}`}
              aria-label={item.label}
            >
              <span className="pd-share-glyph">{item.glyph}</span>
            </a>
          )
        )}
        <button type="button" className="pd-share-btn" aria-label="Copy link" onClick={copyLink}>
          <Link2 size={18} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
};

export default ProductShareRow;
