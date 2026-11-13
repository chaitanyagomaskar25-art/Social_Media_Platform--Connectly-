import React, { useEffect, useState } from 'react';
import {
  Moon,
  Shield,
  Bell,
  UserRound,
  Sun,
  Laptop,
  Check,
  Lock,
  UserCheck,
  UserX,
  Palette,
  Fingerprint,
  Mail,
  ShieldAlert,
} from 'lucide-react';
import Button from '../components/common/Button';
import ThemeToggle from '../components/common/ThemeToggle';
import UserAvatar from '../components/common/UserAvatar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { userService } from '../services/userService';

const DEFAULT_PREFERENCES = { likes: true, comments: true, follows: true, mentions: true };

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showError, showSuccess } = useToast();
  const [activeTab, setActiveTab] = useState('appearance');
  const [privateAccount, setPrivateAccount] = useState(Boolean(user?.privateAccount));
  const [preferences, setPreferences] = useState({
    ...DEFAULT_PREFERENCES,
    ...user?.notificationPreferences,
  });
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [followRequests, setFollowRequests] = useState([]);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);

  useEffect(() => {
    let active = true;
    userService
      .getBlockedUsers()
      .then((response) => {
        if (active) setBlockedUsers(response.blockedUsers || []);
      })
      .catch((error) => {
        if (active && error.status !== 404)
          showError(error.message || 'Could not load blocked users.');
      });

    userService
      .getFollowRequests()
      .then((response) => {
        if (active) setFollowRequests(response.requests || []);
      })
      .catch((error) => {
        if (active && error.status !== 404)
          showError(error.message || 'Could not load follow requests.');
      });

    return () => {
      active = false;
    };
  }, [showError]);

  const savePrivacy = async () => {
    setSavingPrivacy(true);
    try {
      const response = await userService.updateProfile({ privateAccount });
      const updated = response.user || response;
      updateUser(updated);
      showSuccess('Privacy settings updated.');
    } catch (error) {
      showError(error.message || 'Could not save privacy settings.');
    } finally {
      setSavingPrivacy(false);
    }
  };

  const savePreferences = async () => {
    setSavingPreferences(true);
    try {
      const response = await userService.updateNotificationPreferences(preferences);
      updateUser({ notificationPreferences: response.notificationPreferences });
      showSuccess('Notification preferences updated.');
    } catch (error) {
      showError(error.message || 'Could not save notification preferences.');
    } finally {
      setSavingPreferences(false);
    }
  };

  const unblock = async (id) => {
    try {
      await userService.unblockUser(id);
      setBlockedUsers((current) => current.filter((entry) => entry._id !== id));
      showSuccess('User unblocked.');
    } catch (error) {
      showError(error.message || 'Could not unblock user.');
    }
  };

  const respondToRequest = async (requestId, action) => {
    try {
      await userService.respondToFollowRequest(requestId, action);
      setFollowRequests((current) => current.filter((request) => request._id !== requestId));
      showSuccess(action === 'accept' ? 'Follow request accepted.' : 'Follow request declined.');
    } catch (error) {
      showError(error.message || 'Could not update follow request.');
    }
  };

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'account', label: 'Account Profile', icon: Fingerprint },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Editorial Header */}
      <header className="rounded-3xl border border-border-subtle bg-surface p-6 shadow-editorial-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="editorial-chip">Studio Preferences</span>
            </div>
            <h1 className="mt-2 text-2xl font-serif font-bold tracking-tight text-txt-primary">
              Settings & Preferences
            </h1>
            <p className="mt-1 text-sm text-txt-secondary">
              Manage your visual aesthetics, privacy boundaries, and dispatch alerts.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-center">
            <UserAvatar
              src={user?.avatarUrl || user?.avatar || user?.profilePicture}
              name={user?.name || user?.username}
              size="md"
            />
            <div className="text-left">
              <p className="text-sm font-semibold text-txt-primary">
                {user?.name || user?.username}
              </p>
              <p className="font-mono text-xs text-txt-tertiary">
                @{user?.username}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="mt-6 flex gap-2 overflow-x-auto border-t border-border-subtle pt-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 shrink-0 rounded-full px-4 py-2 text-xs font-medium tracking-wide transition-all ${
                  isActive
                    ? 'bg-accent text-white shadow-editorial-xs'
                    : 'bg-surface-elevated text-txt-secondary hover:text-txt-primary hover:border-border-medium border border-border-subtle'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-white' : 'text-accent'}`} />
                <span>{tab.label}</span>
                {tab.id === 'privacy' && followRequests.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-mono">
                    {followRequests.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Tab 1: Appearance */}
      {activeTab === 'appearance' && (
        <section className="space-y-6">
          <div className="rounded-3xl border border-border-subtle bg-surface p-6 shadow-editorial-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 font-serif font-bold text-lg text-txt-primary">
                  <Palette className="h-5 w-5 text-accent" /> Interface Theme
                </h2>
                <p className="mt-1 text-xs text-txt-tertiary">
                  Select your preferred palette or sync automatically with your operating system.
                </p>
              </div>
              <ThemeToggle variant="switch" />
            </div>

            {/* Three-Way Theme Mode Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {[
                {
                  id: 'light',
                  label: 'Warm Editorial',
                  sub: 'Ivory background, crisp paper tones',
                  icon: Sun,
                },
                {
                  id: 'dark',
                  label: 'Deep Charcoal',
                  sub: 'Nocturnal contrast, soft highlights',
                  icon: Moon,
                },
                {
                  id: 'system',
                  label: 'System Adaptive',
                  sub: 'Follows device lighting conditions',
                  icon: Laptop,
                },
              ].map((mode) => {
                const Icon = mode.icon;
                const isSelected = theme === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setTheme(mode.id)}
                    className={`flex flex-col items-start text-left p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? 'border-accent bg-accent/5 ring-1 ring-accent shadow-editorial-sm'
                        : 'border-border-subtle bg-surface-subtle/50 hover:bg-surface-elevated hover:border-border-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-3">
                      <div
                        className={`p-2 rounded-xl ${
                          isSelected ? 'bg-accent text-white' : 'bg-surface-elevated text-txt-secondary'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      {isSelected && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-accent">
                          <Check className="w-3.5 h-3.5" /> Active
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-txt-primary">
                      {mode.label}
                    </span>
                    <span className="text-xs text-txt-tertiary mt-0.5">
                      {mode.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Tab 2: Privacy & Security */}
      {activeTab === 'privacy' && (
        <div className="space-y-6">
          {/* Account Visibility */}
          <section className="rounded-3xl border border-border-subtle bg-surface p-6 shadow-editorial-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 font-serif font-bold text-lg text-txt-primary">
                  <Lock className="h-5 w-5 text-accent" /> Account Visibility
                </h2>
                <p className="mt-1 text-xs text-txt-tertiary">
                  When enabled, only people you approve can see your dispatches and collections.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={privateAccount}
                onClick={() => setPrivateAccount(!privateAccount)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  privateAccount ? 'bg-accent' : 'bg-surface-elevated'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    privateAccount ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-border-subtle">
              <Button
                size="sm"
                isLoading={savingPrivacy}
                onClick={savePrivacy}
              >
                Save Privacy Setting
              </Button>
            </div>
          </section>

          {/* Follow Requests */}
          <section className="rounded-3xl border border-border-subtle bg-surface p-6 shadow-editorial-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 font-serif font-bold text-lg text-txt-primary">
                  <UserCheck className="h-5 w-5 text-accent" /> Follow Requests
                </h2>
                <p className="mt-1 text-xs text-txt-tertiary">
                  People requesting permission to read your private dispatches.
                </p>
              </div>
              <span className="font-mono text-xs text-txt-tertiary">
                {followRequests.length} pending
              </span>
            </div>

            {followRequests.length > 0 ? (
              <div className="divide-y divide-border-subtle">
                {followRequests.map((request) => (
                  <div
                    key={request._id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        src={request.requester?.avatarUrl || request.requester?.avatar}
                        name={request.requester?.name || request.requester?.username}
                        size="sm"
                      />
                      <div>
                        <p className="text-sm font-semibold text-txt-primary">
                          {request.requester?.name || request.requester?.username}
                        </p>
                        <p className="font-mono text-xs text-txt-tertiary">
                          @{request.requester?.username || 'user'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="xs"
                        variant="primary"
                        onClick={() => respondToRequest(request._id, 'accept')}
                      >
                        Accept
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => respondToRequest(request._id, 'decline')}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border-subtle p-6 text-center text-xs text-txt-tertiary">
                No pending follow requests at this time.
              </div>
            )}
          </section>

          {/* Blocked Accounts */}
          <section className="rounded-3xl border border-border-subtle bg-surface p-6 shadow-editorial-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 font-serif font-bold text-lg text-txt-primary">
                  <UserX className="h-5 w-5 text-accent" /> Blocked Accounts
                </h2>
                <p className="mt-1 text-xs text-txt-tertiary">
                  Accounts you have blocked cannot interact with your posts or profile.
                </p>
              </div>
              <span className="font-mono text-xs text-txt-tertiary">
                {blockedUsers.length} blocked
              </span>
            </div>

            {blockedUsers.length > 0 ? (
              <div className="divide-y divide-border-subtle">
                {blockedUsers.map((blocked) => (
                  <div
                    key={blocked._id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <span className="text-sm font-medium text-txt-primary">
                      @{blocked.username}
                    </span>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => unblock(blocked._id)}
                    >
                      Unblock
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border-subtle p-6 text-center text-xs text-txt-tertiary">
                You have not blocked any accounts.
              </div>
            )}
          </section>
        </div>
      )}

      {/* Tab 3: Notifications */}
      {activeTab === 'notifications' && (
        <section className="rounded-3xl border border-border-subtle bg-surface p-6 shadow-editorial-sm space-y-6">
          <div>
            <h2 className="flex items-center gap-2 font-serif font-bold text-lg text-txt-primary">
              <Bell className="h-5 w-5 text-accent" /> Dispatch Alerts & Notifications
            </h2>
            <p className="mt-1 text-xs text-txt-tertiary">
              Configure which activities trigger notifications across your feed.
            </p>
          </div>

          <div className="divide-y divide-border-subtle">
            {[
              {
                key: 'likes',
                title: 'Likes & Appreciations',
                desc: 'Alert when readers like or bookmark your dispatches.',
              },
              {
                key: 'comments',
                title: 'Comments & Discussions',
                desc: 'Alert when readers contribute responses to your work.',
              },
              {
                key: 'follows',
                title: 'New Followers',
                desc: 'Alert when other creators subscribe to your publication.',
              },
              {
                key: 'mentions',
                title: 'Mentions & Citations',
                desc: 'Alert when someone references @your handle in a post.',
              },
            ].map(({ key, title, desc }) => (
              <div key={key} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-semibold text-txt-primary">{title}</p>
                  <p className="text-xs text-txt-tertiary">{desc}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={Boolean(preferences[key])}
                  onClick={() =>
                    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }))
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    preferences[key] ? 'bg-accent' : 'bg-surface-elevated'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      preferences[key] ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-3 border-t border-border-subtle">
            <Button
              size="sm"
              isLoading={savingPreferences}
              onClick={savePreferences}
            >
              Save Notification Preferences
            </Button>
          </div>
        </section>
      )}

      {/* Tab 4: Account Info */}
      {activeTab === 'account' && (
        <section className="rounded-3xl border border-border-subtle bg-surface p-6 shadow-editorial-sm space-y-6">
          <div>
            <h2 className="flex items-center gap-2 font-serif font-bold text-lg text-txt-primary">
              <Fingerprint className="h-5 w-5 text-accent" /> Account Overview
            </h2>
            <p className="mt-1 text-xs text-txt-tertiary">
              Summary of your registration details and member status.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-border-subtle bg-surface-subtle/50">
              <p className="font-mono text-xs uppercase text-txt-tertiary">Display Name</p>
              <p className="mt-1 text-sm font-semibold text-txt-primary">
                {user?.name || user?.username}
              </p>
            </div>
            <div className="p-4 rounded-2xl border border-border-subtle bg-surface-subtle/50">
              <p className="font-mono text-xs uppercase text-txt-tertiary">Handle</p>
              <p className="mt-1 text-sm font-semibold text-txt-primary font-mono">
                @{user?.username}
              </p>
            </div>
            <div className="p-4 rounded-2xl border border-border-subtle bg-surface-subtle/50">
              <p className="font-mono text-xs uppercase text-txt-tertiary">Email Address</p>
              <p className="mt-1 text-sm font-semibold text-txt-primary font-mono">
                {user?.email || 'Registered account'}
              </p>
            </div>
            <div className="p-4 rounded-2xl border border-border-subtle bg-surface-subtle/50">
              <p className="font-mono text-xs uppercase text-txt-tertiary">Access Role</p>
              <p className="mt-1 text-sm font-semibold text-accent capitalize">
                {user?.role || 'Creator'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-border-subtle bg-surface-subtle/30 flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-accent shrink-0" />
            <p className="text-xs text-txt-secondary leading-relaxed">
              To update your bio, profile picture, or public handle, head over to your{' '}
              <a href="/profile" className="text-accent underline font-medium">
                Creator Profile
              </a>{' '}
              and click "Edit Profile".
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
