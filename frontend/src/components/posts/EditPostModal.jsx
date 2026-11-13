import React, { useEffect, useState } from "react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import { postService } from "../../services/postService";
import { useToast } from "../../context/ToastContext";

export default function EditPostModal({ isOpen, onClose, post, onUpdated }) {
  const { showError, showSuccess } = useToast();
  const [caption, setCaption] = useState(post.caption || "");
  const [image, setImage] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const imageUrl = post.imageUrl || "";
  const [filePreview, setFilePreview] = useState("");

  useEffect(() => {
    setCaption(post.caption || "");
    setImage(null);
    setRemoveImage(false);
  }, [isOpen, post]);

  useEffect(() => {
    if (!image) {
      setFilePreview("");
      return undefined;
    }
    const objectUrl = URL.createObjectURL(image);
    setFilePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);
  const preview = filePreview || (removeImage ? "" : imageUrl);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await postService.updatePost(post._id || post.id, {
        caption,
        image,
        removeImage,
      });
      onUpdated?.(response.post);
      showSuccess("Post updated.");
      onClose();
    } catch (error) {
      showError(error.message || "Could not update post.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit post">
      <form onSubmit={submit} className="space-y-4">
        <textarea
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          maxLength={2000}
          rows={5}
          placeholder="Write a caption..."
          className="w-full rounded-2xl border border-border-medium bg-surface p-3.5 text-sm text-txt-primary placeholder-txt-muted outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <p className="mono-meta text-right text-[11px] text-txt-tertiary">{caption.length}/2000</p>
        {preview && <img src={preview} alt="Post preview" className="max-h-64 w-full rounded-2xl object-cover border border-border-subtle" />}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="cursor-pointer text-xs font-semibold text-accent hover:underline">
              Replace image
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => {
                setImage(event.target.files?.[0] || null);
                setRemoveImage(false);
              }} />
            </label>
            {imageUrl && !removeImage && (
              <button type="button" className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline" onClick={() => {
                setImage(null);
                setRemoveImage(true);
              }}>
                Remove image
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={submitting} disabled={!caption.trim() && !preview}>Save changes</Button>
          </div>
        </div>
        <p className="mono-meta text-[11px] text-txt-tertiary">Posts can only be edited for 15 minutes after publishing.</p>
      </form>
    </Modal>
  );
}
