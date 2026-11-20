import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  Calendar,
  Check,
  Clock,
  Link2,
  MessageCircle,
  Share2,
  User,
} from 'lucide-react';
import type { BlogPost } from '../types/autoTrade.ts';
import type { AppRoute } from './Navbar';
import { ResilientImage } from './ResilientImage';

interface BlogPostPageProps {
  post?: BlogPost;
  allPosts: BlogPost[];
  loading: boolean;
  onBackToBlog: () => void;
  onOpenPost: (slug: string) => void;
  onNavigate: (route: AppRoute) => void;
}

function formatArticleDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return 'Recent';
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}

function renderInlineFormatting(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-zinc-950">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={idx}>{part}</Fragment>;
  });
}

function renderStructuredArticle(content: string) {
  const blocks = content
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    if (block.startsWith('## ')) {
      return (
        <h2
          key={index}
          className="font-display text-2xl sm:text-[26px] font-semibold tracking-tight text-zinc-950 pt-4"
        >
          {block.replace(/^##\s+/, '')}
        </h2>
      );
    }

    if (block.startsWith('### ')) {
      return (
        <h3
          key={index}
          className="font-display text-xl font-semibold tracking-tight text-zinc-950 pt-2"
        >
          {block.replace(/^###\s+/, '')}
        </h3>
      );
    }

    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    const isBulletList = lines.length > 0 && lines.every((l) => l.startsWith('- ') || l.startsWith('* '));

    if (isBulletList) {
      return (
        <ul key={index} className="space-y-2.5 pl-5 list-disc marker:text-blue-900">
          {lines.map((line, liIdx) => (
            <li
              key={liIdx}
              className="text-base sm:text-[17px] text-slate-700 leading-[1.7] pl-1"
            >
              {renderInlineFormatting(line.replace(/^[-*]\s+/, ''))}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <p key={index} className="text-base sm:text-[17px] text-slate-700 leading-[1.78]">
        {renderInlineFormatting(lines.join(' '))}
      </p>
    );
  });
}

export function BlogPostPage({
  post,
  allPosts,
  loading,
  onBackToBlog,
  onOpenPost,
  onNavigate,
}: BlogPostPageProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
  }, [post?.id]);

  const relatedPosts = useMemo(() => {
    if (!post) return [];
    const others = allPosts.filter((p) => p.status === 'Published' && p.id !== post.id);
    const sameCategory = others.filter((p) => p.category === post.category);
    const fallback = others.filter((p) => p.category !== post.category);
    return [...sameCategory, ...fallback].slice(0, 3);
  }, [allPosts, post]);

  const shareUrl = useMemo(() => {
    if (!post) return '';
    if (typeof window === 'undefined') return `/blog/${encodeURIComponent(post.slug)}`;
    return `${window.location.origin}/blog/${encodeURIComponent(post.slug)}`;
  }, [post]);

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const temp = document.createElement('textarea');
        temp.value = shareUrl;
        temp.setAttribute('readonly', '');
        temp.style.position = 'fixed';
        temp.style.opacity = '0';
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  if (loading && !post) {
    return (
      <div className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6 animate-pulse">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-10 w-5/6 bg-slate-200 rounded" />
          <div className="aspect-video w-full bg-slate-200 rounded-xl" />
          <div className="space-y-3 pt-4">
            <div className="h-4 w-full bg-slate-100 rounded" />
            <div className="h-4 w-11/12 bg-slate-100 rounded" />
            <div className="h-4 w-4/5 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center space-y-5">
          <h1 className="font-display text-3xl font-semibold text-zinc-950">
            Article Not Found
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            This article may have been moved, unpublished, or removed from our export journal.
          </p>
          <button
            type="button"
            onClick={onBackToBlog}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-900 hover:bg-blue-950 rounded-lg cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to Blog Archive</span>
          </button>
        </div>
      </section>
    );
  }

  const twitterShareHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}`;
  const whatsappShareHref = `https://wa.me/?text=${encodeURIComponent(`${post.title} — ${shareUrl}`)}`;

  return (
    <article className="bg-white">
      {/* Top Breadcrumb Bar */}
      <div className="bg-slate-50 border-b border-slate-200 py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToBlog}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 hover:text-[#C81E1E] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to All Blog Articles</span>
          </button>

          <div className="text-xs font-medium text-[#C81E1E]">{post.category}</div>
        </div>
      </div>

      {/* Article Hero Header & Cover Photo */}
      <header className="pt-10 pb-8 sm:pt-14 sm:pb-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 mb-4">
            <span className="font-medium text-[#C81E1E]">{post.category}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" aria-hidden="true" />
              {post.authorName}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
              {formatArticleDate(post.createdAt)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              {post.readTimeMinutes} min read
            </span>
          </div>

          <h1 className="font-display font-bold tracking-tight text-zinc-950 text-[clamp(2rem,3.6vw,3rem)] leading-[1.12]">
            {post.title}
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
            {post.excerpt}
          </p>

          {/* Social Share Actions */}
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 mr-1">
              <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Share:</span>
            </span>

            <a
              href={twitterShareHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Share "${post.title}" on Twitter`}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-zinc-950 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-lg transition-colors"
            >
              <svg
                className="w-3.5 h-3.5 text-zinc-950 shrink-0"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>Twitter</span>
            </a>

            <a
              href={whatsappShareHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Share "${post.title}" on WhatsApp`}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-emerald-900 bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200 rounded-lg transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
              <span>WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={handleCopyLink}
              aria-label={`Copy link to "${post.title}"`}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium border rounded-lg transition-colors cursor-pointer ${
                copied
                  ? 'text-blue-900 bg-blue-50 border-blue-200'
                  : 'text-zinc-950 bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-blue-900 shrink-0" aria-hidden="true" />
                  <span>Link Copied</span>
                </>
              ) : (
                <>
                  <Link2 className="w-3.5 h-3.5 text-slate-600 shrink-0" aria-hidden="true" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-7 aspect-[16/9] w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
            <ResilientImage
              src={post.coverImage}
              alt={post.coverImageAlt}
              fallbackTitle={post.title}
              priority
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </header>

      {/* Main Single Article Body */}
      <div className="pb-14 sm:pb-20 border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          {renderStructuredArticle(post.content)}

          {/* In-Article Share & Conversion Callout */}
          <div className="mt-10 pt-8 border-t border-slate-200 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-medium text-slate-600">
                Found this guide helpful? Share it with a buyer or import partner:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={twitterShareHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-950 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                >
                  <svg
                    className="w-3 h-3 text-zinc-950 shrink-0"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span>Twitter</span>
                </a>
                <a
                  href={whatsappShareHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-900 bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200 rounded-lg transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
                  <span>WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors cursor-pointer ${
                    copied
                      ? 'text-blue-900 bg-blue-50 border-blue-200'
                      : 'text-zinc-950 bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-blue-900 shrink-0" aria-hidden="true" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Link2 className="w-3.5 h-3.5 text-slate-600 shrink-0" aria-hidden="true" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-blue-900">
                  PJS Ventures Direct Export Desk
                </div>
                <h3 className="font-display text-xl font-semibold text-zinc-950">
                  Ready to calculate CIF freight or inspect available vehicles?
                </h3>
                <p className="text-sm text-slate-600">
                  Compare verified Japanese stock or request a custom auction quote to your local port.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigate('/calculator')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-zinc-950 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Calculator className="w-4 h-4 text-blue-900" aria-hidden="true" />
                  <span>CIF Calculator</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/inventory')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#C81E1E] hover:bg-[#A51616] rounded-lg transition-colors cursor-pointer"
                >
                  <span>Browse Vehicles</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Articles Strip */}
      {relatedPosts.length > 0 && (
        <section className="py-14 sm:py-16 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4 mb-8">
              <div>
                <p className="text-xs font-medium text-blue-900 mb-1">Keep Reading</p>
                <h2 className="font-display text-2xl font-semibold text-zinc-950">
                  More Auto Export Guides
                </h2>
              </div>
              <button
                type="button"
                onClick={onBackToBlog}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-900 hover:underline cursor-pointer"
              >
                <span>All Articles</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((rel) => (
                <button
                  key={rel.id}
                  type="button"
                  onClick={() => onOpenPost(rel.slug)}
                  className="group text-left bg-white border border-slate-200 hover:border-blue-900 rounded-xl overflow-hidden flex flex-col justify-between transition-colors cursor-pointer"
                >
                  <div>
                    <div className="aspect-[16/10] w-full bg-slate-100 overflow-hidden border-b border-slate-200">
                      <ResilientImage
                        src={rel.coverImage}
                        alt={rel.coverImageAlt}
                        fallbackTitle={rel.title}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    </div>
                    <div className="p-5">
                      <div className="text-xs font-medium text-blue-900">{rel.category}</div>
                      <h3 className="mt-1.5 font-display text-base font-semibold text-zinc-950 group-hover:text-blue-900 line-clamp-2 leading-snug">
                        {rel.title}
                      </h3>
                      <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {rel.excerpt}
                      </p>
                    </div>
                  </div>
                  <div className="px-5 py-3 border-t border-slate-100 text-xs font-medium text-blue-900 inline-flex items-center gap-1.5">
                    <span>Read Article</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
