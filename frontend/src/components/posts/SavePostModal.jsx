import React, { useEffect, useState } from "react";
import { Bookmark, FolderPlus, FolderCheck, Check, Sparkles } from "lucide-react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import { savedPostService } from "../../services/savedPostService";
import { collectionService } from "../../services/collectionService";
import { useToast } from "../../context/ToastContext";

export default function SavePostModal({ isOpen, onClose, postId, onSavedChange }) {
  const { showError, showSuccess } = useToast();
  const [collections, setCollections] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingCollection, setSavingCollection] = useState("");

  useEffect(() => {
    if (!isOpen || !postId) return undefined;
    let active = true;
    Promise.all([collectionService.getCollections(), savedPostService.getStatus(postId)])
      .then(([collectionData, status]) => {
        if (!active) return;
        setCollections(collectionData.collections || []);
        setIsSaved(Boolean(status.isSaved));
        onSavedChange?.(Boolean(status.isSaved));
      })
      .catch((error) => {
        if (active) showError(error.message || "Could not load save options.");
      });
    return () => {
      active = false;
    };
  }, [isOpen, postId, showError]);

  const toggleSaved = async () => {
    setLoading(true);
    try {
      if (isSaved) {
        await savedPostService.remove(postId);
        setIsSaved(false);
        const collectionData = await collectionService.getCollections();
        setCollections(collectionData.collections || []);
        onSavedChange?.(false);
        showSuccess("Post removed from your library.");
      } else {
        await savedPostService.save(postId);
        setIsSaved(true);
        onSavedChange?.(true);
        showSuccess("Post bookmarked to library.");
      }
    } catch (error) {
      showError(error.message || "Could not update bookmark.");
    } finally {
      setLoading(false);
    }
  };

  const createCollection = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const result = await collectionService.createCollection({ name: name.trim() });
      setCollections((items) => [result.collection, ...items]);
      setName("");
      showSuccess("Collection created.");
    } catch (error) {
      showError(error.message || "Could not create collection.");
    } finally {
      setLoading(false);
    }
  };

  const addToCollection = async (collection) => {
    const id = collection._id;
    setSavingCollection(id);
    try {
      if (!isSaved) {
        await savedPostService.save(postId);
        setIsSaved(true);
        onSavedChange?.(true);
      }
      await collectionService.addPost(id, postId);
      const collectionData = await collectionService.getCollections();
      setCollections(collectionData.collections || []);
      showSuccess(`Added to ${collection.name}.`);
    } catch (error) {
      showError(error.message || "Could not add post to collection.");
    } finally {
      setSavingCollection("");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Save to Library">
      <div className="space-y-4">
        {/* Primary Save / Unsave Action Card */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border-subtle bg-surface-subtle/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl transition-colors ${isSaved ? 'bg-accent/10 text-accent' : 'bg-surface-elevated text-txt-secondary'}`}>
              <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-txt-primary">
                {isSaved ? "Saved to Library" : "Save this piece"}
              </p>
              <p className="text-xs text-txt-tertiary">
                {isSaved ? "Saved in your primary reading list" : "Bookmark to revisit anytime"}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant={isSaved ? "secondary" : "primary"}
            isLoading={loading}
            onClick={toggleSaved}
          >
            {isSaved ? "Remove" : "Save"}
          </Button>
        </div>

        {/* Collections Drawer */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-txt-tertiary">
              Add to Collection
            </h4>
            <span className="mono-meta text-[11px] text-txt-tertiary">
              {collections.length} available
            </span>
          </div>

          {collections.length > 0 ? (
            <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
              {collections.map((col) => (
                <div
                  key={col._id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface px-3 py-2.5 transition-colors hover:border-border-medium hover:bg-surface-elevated/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-txt-primary">
                      {col.name}
                    </p>
                    <p className="font-mono text-[10px] text-txt-muted">
                      {col.postCount || 0} entries
                    </p>
                  </div>
                  <Button
                    size="xs"
                    variant="outline"
                    isLoading={savingCollection === col._id}
                    onClick={() => addToCollection(col)}
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border-subtle p-3 text-center text-xs text-txt-tertiary">
              No collections yet. Group your bookmarks below.
            </div>
          )}
        </div>

        {/* Quick Create Collection Form */}
        <form
          onSubmit={createCollection}
          className="flex items-center gap-2 border-t border-border-subtle pt-3"
        >
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={50}
            placeholder="New collection title..."
            className="min-w-0 flex-1 rounded-xl border border-border-subtle bg-surface-subtle px-3 py-2 text-xs text-txt-primary placeholder:text-txt-muted focus:border-accent focus:bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <Button
            type="submit"
            size="sm"
            icon={FolderPlus}
            disabled={!name.trim()}
            isLoading={loading}
          >
            Create
          </Button>
        </form>
      </div>
    </Modal>
  );
}
