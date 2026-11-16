import { useState } from 'react';
import { Layers } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  fallbackTitle?: string;
  className?: string;
  priority?: boolean;
}

export function ResilientImage({
  src,
  alt,
  fallbackTitle,
  className = '',
  priority = false,
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 text-slate-600 p-6 ${className}`}
      >
        <Layers className="w-8 h-8 text-slate-400 mb-2" aria-hidden="true" />
        <span className="text-sm font-medium text-slate-700 text-center">
          {fallbackTitle ?? alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading={priority ? 'eager' : 'lazy'}
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
