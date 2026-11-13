import React, { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import UserAvatar from '../common/UserAvatar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { userService } from '../../services/userService';
import { Image, Upload, AlertCircle } from 'lucide-react';

export default function EditProfileModal({ isOpen, onClose, onProfileUpdated }) {
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(user?.name || '');
    setUsername(user?.username || '');
    setBio(user?.bio || '');
    setAvatarUrl(user?.avatarUrl || '');
    setAvatarFile(null);
    setAvatarPreview('');
    setErrorMsg('');
  }, [isOpen, user]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview('');
      return undefined;
    }
    const objectUrl = URL.createObjectURL(avatarFile);
    setAvatarPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Display name is required.');
      return;
    }

    if (!username.trim()) {
      setErrorMsg('Username is required.');
      return;
    }

    if (username.length < 3) {
      setErrorMsg('Username must be at least 3 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const profileData = avatarFile
        ? new FormData()
        : {
            name: name.trim(),
            username: username.trim().toLowerCase(),
            bio: bio.trim(),
            avatarUrl: avatarUrl.trim(),
          };

      if (avatarFile) {
        profileData.append('name', name.trim());
        profileData.append('username', username.trim().toLowerCase());
        profileData.append('bio', bio.trim());
        profileData.append('avatar', avatarFile);
      }

      const updated = await userService.updateProfile(profileData);
      const mergedUser = updated?.user || updated?.data || updated;

      updateUser(mergedUser);
      showSuccess('Profile updated successfully!');
      if (onProfileUpdated) onProfileUpdated(mergedUser);
      onClose();
    } catch (err) {
      const msg = err.message || 'Failed to update profile. Please verify your inputs.';
      setErrorMsg(msg);
      showError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Atelier Profile">
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMsg && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Profile Avatar Upload / Preview */}
        <div className="flex flex-col items-center justify-center gap-3 py-2">
          <div className="relative group rounded-full">
            <UserAvatar
              src={avatarPreview || avatarUrl}
              name={name || username}
              size="2xl"
              className="rounded-full ring-4 ring-surface shadow-editorial-md"
            />
            <label
              className="absolute -bottom-1 -right-1 cursor-pointer rounded-full bg-accent p-2.5 text-white shadow-editorial-sm hover:scale-110 active:scale-95 transition-all"
              aria-label="Upload profile image"
              title="Upload new image"
            >
              <Upload className="h-4 w-4" />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                    showError('Choose a JPEG, PNG, or WebP image.');
                    event.target.value = '';
                    return;
                  }
                  if (file.size > 5 * 1024 * 1024) {
                    showError('Profile images must be 5 MB or smaller.');
                    event.target.value = '';
                    return;
                  }
                  setAvatarFile(file);
                  event.target.value = '';
                }}
              />
            </label>
          </div>
          <span className="text-xs text-txt-muted text-center max-w-xs">
            Upload a portrait photo from your device (JPEG, PNG, or WebP; up to 5 MB).
          </span>
        </div>

        <Input
          label="Display Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Jane Doe"
          required
        />

        <Input
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. janedoe"
          required
        />

        {/* Bio with counter */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-txt-primary tracking-tight font-serif">
              Studio Bio
            </label>
            <span className="text-[10px] mono-meta text-txt-muted">{bio.length}/300</span>
          </div>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={300}
            placeholder="Share your craft, disciplines, ideas, and creative interests…"
            rows={3}
            className="w-full rounded-2xl border border-border-subtle bg-surface-elevated/50 text-txt-primary placeholder-txt-muted text-sm p-3.5 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          />
        </div>

        {/* Optional Avatar URL */}
        <Input
          label="Or Image URL (Optional)"
          value={avatarUrl}
          onChange={(e) => {
            setAvatarUrl(e.target.value);
            setAvatarFile(null);
          }}
          placeholder="https://example.com/avatar.jpg"
          helperText="Direct image URL if not uploading a file."
        />

        {/* Modal Actions */}
        <div className="flex justify-end gap-2.5 pt-4 border-t border-border-subtle">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
