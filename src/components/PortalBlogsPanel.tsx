import { useState, type ChangeEvent, type FormEvent } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { BLOG_COVER_PRESETS } from '../data/seedBlogs.ts';
import { formatPortalErrorMessage, slugifyBlogTitle } from '../lib/storeClient.ts';
import type { BlogCategory, BlogPost, BlogStatus } from '../types/autoTrade.ts';
import { ResilientImage } from './ResilientImage';

interface PortalBlogsPanelProps {
  blogs: BlogPost[];
  defaultAuthorName: string;
  onCreateBlog: (input: Omit<BlogPost, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateBlog: (id: string, updates: Partial<BlogPost>) => Promise<void>;
  onRequestDeleteBlog: (post: BlogPost) => void;
  onViewLivePost: (slug: string) => void;
}

const BLOG_CATEGORIES: BlogCategory[] = [
  'Import Guides',
  'Auction Tips',
  'Port & Customs',
  'Market Updates',
];

async function compressCoverToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image file.'));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error('Invalid image file selected.'));
      img.onload = () => {
        const maxWidth = 1200;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Image compression is unavailable in this browser.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        let quality = 0.82;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (dataUrl.length > 320000 && quality > 0.35) {
          quality -= 0.12;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        if (dataUrl.length > 345000) {
          reject(new Error('Compressed image exceeds storage limit. Choose a smaller photo.'));
          return;
        }
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function formatShortDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return 'Recent';
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

export function PortalBlogsPanel({
  blogs,
  defaultAuthorName,
  onCreateBlog,
  onUpdateBlog,
  onRequestDeleteBlog,
  onViewLivePost,
}: PortalBlogsPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [category, setCategory] = useState<BlogCategory>('Import Guides');
  const [status, setStatus] = useState<BlogStatus>('Published');
  const [authorName, setAuthorName] = useState(defaultAuthorName || 'PJS Ventures Editorial');
  const [coverImage, setCoverImage] = useState(BLOG_COVER_PRESETS[0].src);
  const [coverImageAlt, setCoverImageAlt] = useState(BLOG_COVER_PRESETS[0].alt);
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [listFilter, setListFilter] = useState<'All' | BlogStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const estimatedReadMinutes = Math.min(60, Math.max(1, Math.round(wordCount / 180)));

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setSlug('');
    setSlugTouched(false);
    setCategory('Import Guides');
    setStatus('Published');
    setAuthorName(defaultAuthorName || 'PJS Ventures Editorial');
    setCoverImage(BLOG_COVER_PRESETS[0].src);
    setCoverImageAlt(BLOG_COVER_PRESETS[0].alt);
    setExcerpt('');
    setContent('');
    setError(null);
  };

  const handleEditClick = (post: BlogPost) => {
    setEditingId(post.id);
    setTitle(post.title);
    setSlug(post.slug);
    setSlugTouched(true);
    setCategory(post.category);
    setStatus(post.status);
    setAuthorName(post.authorName);
    setCoverImage(post.coverImage);
    setCoverImageAlt(post.coverImageAlt);
    setExcerpt(post.excerpt);
    setContent(post.content);
    setError(null);
    setNotice(null);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugTouched) {
      setSlug(val.trim() ? slugifyBlogTitle(val) : '');
    }
  };

  const handleUploadCover = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    setUploadingPhoto(true);
    try {
      const compressed = await compressCoverToDataUrl(file);
      setCoverImage(compressed);
      if (!coverImageAlt.trim() || coverImageAlt === BLOG_COVER_PRESETS[0].alt) {
        setCoverImageAlt(title.trim() || 'PJS Ventures Blog Cover Image');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process cover image.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!title.trim()) {
      setError('Please enter a blog headline.');
      return;
    }
    if (!excerpt.trim()) {
      setError('Please enter a short summary / excerpt for the blog card.');
      return;
    }
    if (!content.trim()) {
      setError('Please enter the full article content.');
      return;
    }
    if (!coverImage.trim()) {
      setError('Please choose a preset photo, upload an image, or enter a cover image URL.');
      return;
    }

    const cleanSlug = slugifyBlogTitle(slug || title);

    setSaving(true);
    try {
      const payload: Omit<BlogPost, 'id' | 'createdAt'> = {
        slug: cleanSlug,
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        category,
        authorName: authorName.trim() || 'PJS Ventures Editorial',
        readTimeMinutes: estimatedReadMinutes,
        coverImage: coverImage.trim(),
        coverImageAlt: coverImageAlt.trim() || title.trim(),
        status,
      };

      if (editingId) {
        await onUpdateBlog(editingId, payload);
        setNotice(`Updated blog post "${payload.title}" (${payload.status}).`);
        resetForm();
      } else {
        await onCreateBlog(payload);
        setNotice(
          payload.status === 'Published'
            ? `Published "${payload.title}" live at /blog/${cleanSlug}.`
            : `Saved draft "${payload.title}".`,
        );
        resetForm();
      }
    } catch (err) {
      setError(formatPortalErrorMessage(err, 'Unable to save blog post.'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (post: BlogPost) => {
    const nextStatus: BlogStatus = post.status === 'Published' ? 'Draft' : 'Published';
    try {
      await onUpdateBlog(post.id, { status: nextStatus });
      setNotice(`"${post.title}" moved to ${nextStatus}.`);
    } catch (err) {
      setError(formatPortalErrorMessage(err, 'Unable to update post status.'));
    }
  };

  const filteredBlogs = blogs.filter((post) => {
    if (listFilter !== 'All' && post.status !== listFilter) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      post.title.toLowerCase().includes(q) ||
      post.category.toLowerCase().includes(q) ||
      post.slug.toLowerCase().includes(q)
    );
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Create / Edit Blog Post Form */}
      <form
        noValidate
        onSubmit={handleSubmit}
        className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 space-y-4"
      >
        <div className="border-b border-slate-200 dark:border-zinc-800 pb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-zinc-950 dark:text-white">
              {editingId ? 'Edit Blog Article' : 'Add New Blog Post'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Publish buyer guides, auction tips, or port arrival updates straight to /blog.
            </p>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-md cursor-pointer shrink-0"
            >
              + New Post
            </button>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg px-3.5 py-2.5">
            {error}
          </p>
        )}

        {notice && (
          <p className="text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3.5 py-2.5 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{notice}</span>
          </p>
        )}

        <div>
          <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
            Article Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g. How to Inspect a Toyota Land Cruiser Prado Auction Sheet"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-900 dark:focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
              URL Slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
              }}
              placeholder="auto-generated-slug"
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as BlogCategory)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 focus:outline-none focus:border-blue-900"
            >
              {BLOG_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
              Author Name
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="PJS Ventures Editorial"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 focus:outline-none focus:border-blue-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
              Visibility Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as BlogStatus)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 focus:outline-none focus:border-blue-900"
            >
              <option value="Published">Published (Live on /blog)</option>
              <option value="Draft">Draft (Hidden from Public)</option>
            </select>
          </div>
        </div>

        {/* Cover Photo Section */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-950 dark:text-zinc-200">
              Cover Image *
            </label>
            <label className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-900 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-md cursor-pointer">
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{uploadingPhoto ? 'Compressing...' : 'Upload Photo'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadCover}
                className="sr-only"
              />
            </label>
          </div>

          <div className="aspect-[16/9] w-full rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-950">
            <ResilientImage
              src={coverImage}
              alt={coverImageAlt || title || 'Blog cover preview'}
              fallbackTitle={title || 'Cover Photo Preview'}
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1">
              <ImageIcon className="w-3 h-3" aria-hidden="true" />
              <span>Or pick an editorial PJS Ventures preset:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {BLOG_COVER_PRESETS.map((preset) => (
                <button
                  key={preset.src}
                  type="button"
                  onClick={() => {
                    setCoverImage(preset.src);
                    setCoverImageAlt(preset.alt);
                  }}
                  className={`px-2 py-1 text-[11px] font-medium rounded border transition-colors cursor-pointer ${
                    coverImage === preset.src
                      ? 'border-blue-900 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300'
                      : 'border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 hover:border-slate-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            value={coverImage.startsWith('data:') ? '' : coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder={
              coverImage.startsWith('data:')
                ? 'Uploaded JPEG compressed & ready'
                : 'Or paste https://... cover image URL'
            }
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-900"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
            Short Excerpt / Card Summary *
          </label>
          <textarea
            rows={2}
            required
            maxLength={400}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="1–2 crisp sentences shown on the blog listing and homepage cards..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-900"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200">
              Full Article Body *
            </label>
            <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 tabular-nums">
              {wordCount} words · {estimatedReadMinutes} min read
            </span>
          </div>
          <textarea
            rows={8}
            required
            maxLength={15000}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Write your full guide here.\n\nUse ## Section Heading for headings\n\n- Use dashes for bullet points\n- Leave a blank line between paragraphs`}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-900 leading-relaxed"
          />
        </div>

        <button
          type="submit"
          disabled={saving || uploadingPhoto}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-blue-900 hover:bg-blue-950 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:bg-slate-400 dark:disabled:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>
            {saving
              ? 'Saving...'
              : editingId
                ? 'Update Blog Article'
                : status === 'Published'
                  ? 'Publish Blog Post'
                  : 'Save Draft Article'}
          </span>
        </button>
      </form>

      {/* Right: Existing Blog Posts List */}
      <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-zinc-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-zinc-950 dark:text-white">
                Manage Export Blog Articles
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Published posts go live on /blog and /blog/:slug immediately for all readers.
              </p>
            </div>
            <span className="font-mono text-xs text-slate-500 dark:text-zinc-400 tabular-nums">
              {blogs.length} {blogs.length === 1 ? 'article' : 'articles'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              {(['All', 'Published', 'Draft'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setListFilter(tab)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                    listFilter === tab
                      ? 'border-blue-900 dark:border-blue-500 bg-blue-900 dark:bg-blue-600 text-white'
                      : 'border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-56">
              <Search
                className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-900"
              />
            </div>
          </div>
        </div>

        {filteredBlogs.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <BookOpen className="w-7 h-7 text-slate-400 mx-auto" aria-hidden="true" />
            <div className="text-sm font-medium text-zinc-950 dark:text-white">
              {blogs.length === 0
                ? 'No blog articles stored yet.'
                : 'No articles match this filter.'}
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Use the editor on the left to publish your first Japanese auto export article.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {filteredBlogs.map((post) => (
              <div
                key={post.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:bg-slate-50/70 dark:hover:bg-zinc-800/40"
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="w-24 aspect-[16/10] rounded-lg overflow-hidden bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shrink-0">
                    <ResilientImage
                      src={post.coverImage}
                      alt={post.coverImageAlt}
                      fallbackTitle={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-[11px] font-medium rounded border ${
                          post.status === 'Published'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {post.status}
                      </span>
                      <span className="text-xs font-medium text-blue-900 dark:text-blue-400">
                        {post.category}
                      </span>
                      <span className="text-[11px] text-slate-400">·</span>
                      <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                        {formatShortDate(post.createdAt)}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-zinc-950 dark:text-white line-clamp-1">
                      {post.title}
                    </h3>

                    <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 truncate">
                      /blog/{post.slug} · {post.readTimeMinutes} min read
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {post.status === 'Published' && (
                    <button
                      type="button"
                      onClick={() => onViewLivePost(post.slug)}
                      title="Open live article"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>View</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(post)}
                    title={post.status === 'Published' ? 'Unpublish to Draft' : 'Publish Live'}
                    className="p-2 text-slate-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  >
                    {post.status === 'Published' ? (
                      <EyeOff className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Eye className="w-4 h-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEditClick(post)}
                    title="Edit article"
                    className="p-2 text-blue-900 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onRequestDeleteBlog(post)}
                    aria-label={`Delete blog post ${post.title}`}
                    className="p-2 text-slate-400 dark:text-zinc-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
