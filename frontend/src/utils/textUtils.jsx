import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Parses plain text and converts hashtags (#tag) and mentions (@username)
 * into clickable, stylish Links.
 */
export function formatEditorialText(text) {
  if (!text) return '';

  // Regex matching hashtags (#word) and mentions (@word)
  const regex = /((?:#|@)[a-zA-Z0-9_]{2,30})/g;
  const parts = String(text).split(regex);

  return parts.map((part, index) => {
    if (part.startsWith('#')) {
      const tag = part.slice(1);
      return (
        <Link
          key={`${part}-${index}`}
          to={`/explore?q=${encodeURIComponent(tag)}`}
          className="font-medium text-accent hover:underline inline-block"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </Link>
      );
    }
    if (part.startsWith('@')) {
      const username = part.slice(1);
      return (
        <Link
          key={`${part}-${index}`}
          to={`/profile/${encodeURIComponent(username)}`}
          className="font-semibold text-accent hover:underline inline-block"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </Link>
      );
    }
    return part;
  });
}
