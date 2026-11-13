import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Bookmark, FolderHeart, FolderPlus, Trash2, Plus, Sparkles, Layers } from "lucide-react";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import ErrorState from "../components/common/ErrorState";
import PostCard from "../components/posts/PostCard";
import { collectionService } from "../services/collectionService";
import { savedPostService } from "../services/savedPostService";
import { useSocket } from "../context/SocketContext";
import { useToast } from "../context/ToastContext";

export default function SavedPage() {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [collections, setCollections] = useState([]);
  const [posts, setPosts] = useState([]);
  const [collection, setCollection] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadCollections = useCallback(async () => {
    try {
      const response = await collectionService.getCollections();
      setCollections(response.collections || []);
    } catch (requestError) {
      showError(requestError.message || "Could not load collections.");
    }
  }, [showError]);

  const loadItems = useCallback(async (requestedPage = 1, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError("");
    try {
      if (collectionId) {
        const response = await collectionService.getCollectionPosts(collectionId, { page: requestedPage, limit: 12 });
        setCollection(response.collection);
        setPosts((current) => append ? [...current, ...(response.posts || [])] : response.posts || []);
        setTotalPages(response.pagination?.totalPages || 1);
      } else {
        const response = await savedPostService.getSavedPosts({ page: requestedPage, limit: 12 });
        setCollection(null);
        setPosts((current) => append ? [...current, ...(response.posts || [])] : response.posts || []);
        setTotalPages(response.pagination?.totalPages || 1);
      }
      setPage(requestedPage);
    } catch (requestError) {
      setError(requestError.message || "Could not load saved posts.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [collectionId]);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    setName(collection?.name || "");
    setDescription(collection?.description || "");
  }, [collection]);

  const createCollection = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    try {
      const response = await collectionService.createCollection({
        name: name.trim(),
        description: description.trim(),
      });
      setCollections((items) => [response.collection, ...items]);
      setName("");
      setDescription("");
      setShowCreateForm(false);
      showSuccess("Collection created.");
    } catch (requestError) {
      showError(requestError.message || "Could not create collection.");
    }
  };

  const updateCollection = async (event) => {
    event.preventDefault();
    try {
      const response = await collectionService.updateCollection(collectionId, {
        name: name.trim(),
        description: description.trim(),
      });
      setCollection(response.collection);
      setCollections((items) => items.map((item) =>
        item._id === collectionId ? { ...item, ...response.collection } : item
      ));
      showSuccess("Collection updated.");
    } catch (requestError) {
      showError(requestError.message || "Could not update collection.");
    }
  };

  const deleteCollection = async () => {
    if (!window.confirm(`Delete "${collection?.name}"? Saved posts will remain saved.`)) return;
    try {
      await collectionService.deleteCollection(collectionId);
      setCollections((items) => items.filter((item) => item._id !== collectionId));
      showSuccess("Collection deleted.");
      navigate("/saved");
    } catch (requestError) {
      showError(requestError.message || "Could not delete collection.");
    }
  };

  const removePost = async (postId) => {
    try {
      if (collectionId) {
        await collectionService.removePost(collectionId, postId);
      } else {
        await savedPostService.remove(postId);
      }
      setPosts((items) => items.filter((item) => (item._id || item.id) !== postId));
      showSuccess(collectionId ? "Post removed from collection." : "Post unsaved.");
      loadCollections();
    } catch (requestError) {
      showError(requestError.message || "Could not remove post.");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Editorial Header */}
      <header className="rounded-3xl border border-border-subtle bg-surface p-6 shadow-editorial-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="rounded-2xl bg-accent/10 p-3 text-accent shrink-0">
              {collectionId ? <FolderHeart className="h-6 w-6" /> : <Bookmark className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="editorial-chip">
                  {collectionId ? "Curated Collection" : "Reading Library"}
                </span>
                <span className="font-mono text-[11px] text-txt-tertiary">
                  {posts.length} {posts.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-serif font-bold tracking-tight text-txt-primary">
                {collection?.name || "Saved Dispatches"}
              </h1>
              <p className="mt-1 text-sm text-txt-secondary max-w-xl">
                {collection?.description || (collectionId ? "Posts organized in this collection." : "Your personal archive of inspiring stories, ideas, and creative references.")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {!collectionId && (
              <Button
                size="sm"
                variant={showCreateForm ? "secondary" : "outline"}
                icon={FolderPlus}
                onClick={() => setShowCreateForm((prev) => !prev)}
              >
                {showCreateForm ? "Cancel" : "New Collection"}
              </Button>
            )}
            {collectionId && (
              <Button
                variant="ghost"
                size="sm"
                icon={Trash2}
                onClick={deleteCollection}
                className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
              >
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Collection Pills Bar */}
        <nav className="mt-6 flex gap-2 overflow-x-auto border-t border-border-subtle pt-4">
          <Link
            to="/saved"
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium tracking-wide transition-all ${
              !collectionId
                ? "bg-accent text-white shadow-editorial-xs"
                : "bg-surface-elevated text-txt-secondary hover:text-txt-primary border border-border-subtle hover:border-border-medium"
            }`}
          >
            All Saved
          </Link>
          {collections.map((item) => (
            <Link
              key={item._id}
              to={`/collections/${item._id}`}
              className={`flex items-center gap-1.5 shrink-0 rounded-full px-4 py-2 text-xs font-medium tracking-wide transition-all ${
                collectionId === item._id
                  ? "bg-accent text-white shadow-editorial-xs"
                  : "bg-surface-elevated text-txt-secondary hover:text-txt-primary border border-border-subtle hover:border-border-medium"
              }`}
            >
              <span>{item.name}</span>
              <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full ${
                collectionId === item._id ? 'bg-white/20 text-white' : 'bg-surface text-txt-muted'
              }`}>
                {item.postCount || 0}
              </span>
            </Link>
          ))}
        </nav>
      </header>

      {/* Inline Create Collection Panel */}
      {showCreateForm && !collectionId && (
        <form
          onSubmit={createCollection}
          className="rounded-3xl border border-accent/20 bg-surface p-5 shadow-editorial-sm space-y-3"
        >
          <div className="flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-serif font-bold text-txt-primary">Create New Collection</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={50}
              required
              aria-label="New collection name"
              placeholder="e.g., Typography Insights, Architecture"
              className="rounded-xl border border-border-subtle bg-surface-elevated px-3 py-2 text-xs text-txt-primary placeholder:text-txt-muted outline-none focus:border-accent"
            />
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={200}
              aria-label="New collection description"
              placeholder="Description (optional)"
              className="rounded-xl border border-border-subtle bg-surface-elevated px-3 py-2 text-xs text-txt-primary placeholder:text-txt-muted outline-none focus:border-accent"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="xs">
              Save Collection
            </Button>
          </div>
        </form>
      )}

      {/* Collection Details Edit Form (When inside a specific collection) */}
      {collectionId && (
        <form
          onSubmit={updateCollection}
          className="space-y-3 rounded-3xl border border-border-subtle bg-surface p-5 shadow-editorial-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-txt-tertiary">
              Edit Collection Metadata
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={50}
              required
              aria-label="Collection name"
              placeholder="Collection name"
              className="w-full rounded-xl border border-border-subtle bg-surface-elevated px-3 py-2 text-xs text-txt-primary placeholder:text-txt-muted outline-none focus:border-accent"
            />
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={200}
              aria-label="Collection description"
              placeholder="Description (optional)"
              className="w-full rounded-xl border border-border-subtle bg-surface-elevated px-3 py-2 text-xs text-txt-primary placeholder:text-txt-muted outline-none focus:border-accent"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" size="xs">
              Update Collection
            </Button>
          </div>
        </form>
      )}

      {/* Content Posts Section */}
      {loading ? (
        <div className="rounded-3xl border border-border-subtle bg-surface p-12 text-center text-sm text-txt-secondary">
          <p className="font-serif">Curating your reading list…</p>
        </div>
      ) : error ? (
        <ErrorState title="Could not load saved posts" message={error} onRetry={loadItems} />
      ) : posts.length ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post._id || post.id}
              post={post}
              onRemoveFromCollection={collectionId ? () => removePost(post._id || post.id) : undefined}
              onSavedChange={(postId, saved) => {
                if (!saved) {
                  setPosts((items) => items.filter((item) => (item._id || item.id) !== postId));
                  loadCollections();
                }
              }}
              removeLabel={collectionId ? "Remove from collection" : "Unsave post"}
            />
          ))}
          {page < totalPages && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                isLoading={loadingMore}
                onClick={() => loadItems(page + 1, true)}
              >
                Load more dispatches
              </Button>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={collectionId ? FolderHeart : Bookmark}
          title={collectionId ? "This collection is empty" : "No saved dispatches yet"}
          description={
            collectionId
              ? "Bookmark interesting stories and add them to this curated collection."
              : "Use the bookmark button on any dispatch to save it to your personal library."
          }
        />
      )}
    </div>
  );
}
