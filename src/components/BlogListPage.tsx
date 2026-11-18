import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Calendar, Clock, Search } from 'lucide-react';
import type { BlogCategory, BlogPost } from '../types/autoTrade.ts';
import type { AppRoute } from './Navbar';
import { PageBanner } from './PageBanner';
import { ResilientImage } from './ResilientImage';

interface BlogListPageProps {
  posts: BlogPost[];
  loading: boolean;
  onOpenPost: (slug: string) => void;
  onNavigate: (route: AppRoute) => void;
}

const CATEGORIES: ('All Articles' | BlogCategory)[] = [
  'All Articles',
  'Import Guides',
  'Auction Tips',
  'Port & Customs',
  'Market Updates',
];

function formatArticleDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return 'Recent';
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

export function BlogListPage({ posts, loading, onOpenPost, onNavigate }: BlogListPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<'All Articles' | BlogCategory>(
    'All Articles',
  );
  const [searchQuery, setSearchQuery] = useState('');

  const publishedPosts = useMemo(
    () => posts.filter((p) => p.status === 'Published'),
    [posts],
  );

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return publishedPosts.filter((post) => {
      if (selectedCategory !== 'All Articles' && post.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      return (
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.category.toLowerCase().includes(q) ||
        post.authorName.toLowerCase().includes(q)
      );
    });
  }, [publishedPosts, selectedCategory, searchQuery]);

  const showFeaturedBanner =
    selectedCategory === 'All Articles' && !searchQuery.trim() && filteredPosts.length > 0;
  const featuredPost = showFeaturedBanner ? filteredPosts[0] : null;
  const gridPosts = showFeaturedBanner ? filteredPosts.slice(1) : filteredPosts;

  return (
    <div>
      <PageBanner
        breadcrumb="PJS Ventures · Auto Export Journal"
        title="Japanese Auto Import Guides, Auction Insights & Shipping Updates"
        subtitle="Practical field guides on reading Japanese auction sheets, choosing RoRo or container shipping, and claiming in-transit port balance-release vehicles."
      />

      <section className="py-12 sm:py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Category Filter + Search Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {CATEGORIES.map((category) => {
                const active = selectedCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'border-blue-900 bg-blue-900 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:text-zinc-950'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full lg:w-72 shrink-0">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles, ports, auctions..."
                aria-label="Search blog articles"
                className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-zinc-950 placeholder:text-slate-400 focus:outline-none focus:border-blue-900"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse"
                >
                  <div className="aspect-[16/10] bg-slate-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 w-24 bg-slate-200 rounded" />
                    <div className="h-5 w-4/5 bg-slate-200 rounded" />
                    <div className="h-4 w-full bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-4">
              <BookOpen className="w-8 h-8 text-blue-900 mx-auto" aria-hidden="true" />
              <div className="space-y-1">
                <h2 className="font-display text-xl font-semibold text-zinc-950">
                  {publishedPosts.length === 0
                    ? 'No blog articles published yet'
                    : 'No articles matched your filter'}
                </h2>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  {publishedPosts.length === 0
                    ? 'Authorized team editors can publish new export guides and port updates directly from the Seller Portal CRM.'
                    : 'Try clearing your search term or selecting All Articles above.'}
                </p>
              </div>
              {publishedPosts.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('All Articles');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-900 hover:bg-blue-950 rounded-lg cursor-pointer"
                >
                  Reset Filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate('/inventory')}
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-900 hover:bg-blue-950 rounded-lg cursor-pointer"
                >
                  Browse Export Vehicles
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {/* Featured Lead Article */}
              {featuredPost && (
                <article
                  onClick={() => onOpenPost(featuredPost.slug)}
                  className="group bg-white border border-slate-200 hover:border-blue-900 rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-colors cursor-pointer"
                >
                  <div className="lg:col-span-7 aspect-[16/10] lg:aspect-auto lg:min-h-[320px] bg-slate-100 overflow-hidden">
                    <ResilientImage
                      src={featuredPost.coverImage}
                      alt={featuredPost.coverImageAlt}
                      fallbackTitle={featuredPost.title}
                      priority
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  </div>
                  <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-blue-900">
                        <span>Featured Guide</span>
                        <span aria-hidden="true" className="text-slate-300">
                          ·
                        </span>
                        <span>{featuredPost.category}</span>
                      </div>

                      <h2 className="mt-3 font-display text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950 group-hover:text-blue-900 transition-colors leading-snug">
                        {featuredPost.title}
                      </h2>

                      <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                        {featuredPost.excerpt}
                      </p>
                    </div>

                    <div className="mt-6 pt-5 border-t border-slate-200 flex items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                          {formatArticleDate(featuredPost.createdAt)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                          {featuredPost.readTimeMinutes} min read
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-900 whitespace-nowrap shrink-0">
                        <span>Read Article</span>
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                </article>
              )}

              {/* Remaining Article Grid */}
              {gridPosts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {gridPosts.map((post) => (
                    <article
                      key={post.id}
                      onClick={() => onOpenPost(post.slug)}
                      className="group bg-white border border-slate-200 hover:border-blue-900 rounded-xl overflow-hidden flex flex-col justify-between transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="aspect-[16/10] w-full bg-slate-100 overflow-hidden border-b border-slate-200">
                          <ResilientImage
                            src={post.coverImage}
                            alt={post.coverImageAlt}
                            fallbackTitle={post.title}
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                          />
                        </div>

                        <div className="p-5 sm:p-6">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                            <span className="font-medium text-blue-900">{post.category}</span>
                            <span aria-hidden="true">·</span>
                            <span>{formatArticleDate(post.createdAt)}</span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">{post.readTimeMinutes} min</span>
                          </div>

                          <h3 className="mt-2.5 font-display text-lg font-semibold text-zinc-950 group-hover:text-blue-900 transition-colors leading-snug">
                            {post.title}
                          </h3>

                          <p className="mt-2 text-sm text-slate-600 leading-relaxed line-clamp-3">
                            {post.excerpt}
                          </p>
                        </div>
                      </div>

                      <div className="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
                        <span className="text-xs text-slate-500 truncate">{post.authorName}</span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-900 shrink-0">
                          <span>Read Full Post</span>
                          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
