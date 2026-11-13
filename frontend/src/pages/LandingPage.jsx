import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import ThemeToggle from '../components/common/ThemeToggle';
import {
  Sparkles,
  Users,
  MessageCircle,
  Share2,
  Heart,
  Shield,
  Zap,
  ArrowRight,
  Clock,
  Bookmark,
  CheckCircle2,
  Compass,
  Send,
  Eye,
  Play,
  Layers,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';

export default function LandingPage() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'stories' | 'chat' | 'explore'
  const [demoLiked, setDemoLiked] = useState(false);
  const [demoLikeCount, setDemoLikeCount] = useState(384);
  const [demoBookmarked, setDemoBookmarked] = useState(false);
  const [activeStoryProgress, setActiveStoryProgress] = useState(45);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Gentle pulse for demo story progress
  useEffect(() => {
    if (activeTab === 'stories') {
      const interval = setInterval(() => {
        setActiveStoryProgress((prev) => (prev >= 100 ? 5 : prev + 4));
      }, 300);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const handleLikeToggle = () => {
    if (demoLiked) {
      setDemoLikeCount((c) => c - 1);
      setDemoLiked(false);
    } else {
      setDemoLikeCount((c) => c + 1);
      setDemoLiked(true);
    }
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-canvas text-txt-primary flex flex-col selection:bg-accent selection:text-white transition-colors duration-300 relative overflow-x-hidden w-full">
      {/* Ambient Decorative Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1100px] h-[450px] sm:h-[550px] bg-gradient-to-b from-accent/15 via-accent/5 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" />
      <div className="hidden sm:block absolute top-[600px] -left-48 w-80 sm:w-96 h-80 sm:h-96 bg-accent/5 blur-3xl pointer-events-none -z-10 rounded-full" />
      <div className="hidden sm:block absolute top-[1200px] -right-48 w-80 sm:w-96 h-80 sm:h-96 bg-accent/5 blur-3xl pointer-events-none -z-10 rounded-full" />

      {/* Top Header */}
      <header className="border-b border-border-subtle bg-canvas/85 backdrop-blur-xl sticky top-0 z-40 transition-colors duration-300 w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-accent to-accent-hover text-white flex items-center justify-center shadow-editorial-sm group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-bold text-lg sm:text-xl tracking-tight text-txt-primary">
                  Connectly
                </span>
                <span className="hidden xs:inline-block px-1.5 py-0.5 text-[9px] sm:text-[10px] font-mono tracking-widest font-semibold uppercase bg-accent/10 text-accent rounded-md border border-accent/20">
                  Atelier
                </span>
              </div>
              <p className="text-[9px] font-mono uppercase tracking-wider text-txt-tertiary hidden sm:block">
                Editorial Social Space
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-xs font-semibold text-txt-secondary">
            <a href="#showcase" className="hover:text-accent transition-colors">
              Live Preview
            </a>
            <a href="#features" className="hover:text-accent transition-colors">
              Capabilities
            </a>
            <a href="#stories" className="hover:text-accent transition-colors">
              24h Stories
            </a>
            <a href="#community" className="hover:text-accent transition-colors">
              Community
            </a>
            <Link to="/explore" className="hover:text-accent transition-colors flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" />
              Explore
            </Link>
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <ThemeToggle variant="icon" />

            {isAuthenticated ? (
              <Link to="/feed">
                <Button
                  size="sm"
                  className="px-3 sm:px-4 text-xs font-semibold shadow-editorial-sm bg-accent hover:bg-accent-hover text-white rounded-xl"
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  <span className="hidden xs:inline">Enter</span> Feed
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link to="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-2.5 sm:px-4 text-xs font-semibold shadow-editorial-xs border-border-medium hover:border-accent/40 rounded-xl"
                  >
                    Log In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    size="sm"
                    className="px-3 sm:px-4 text-xs font-semibold shadow-editorial-sm bg-accent hover:bg-accent-hover text-white rounded-xl"
                  >
                    <span className="hidden xs:inline">Get</span> Started
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-txt-secondary hover:text-txt-primary hover:bg-surface-elevated transition-colors border border-border-subtle"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border-medium bg-surface/95 backdrop-blur-xl px-4 py-4 space-y-3 animate-fade-in shadow-editorial-md">
            <nav className="flex flex-col gap-2 text-sm font-semibold text-txt-primary">
              <a
                href="#showcase"
                onClick={closeMobileMenu}
                className="px-3 py-2 rounded-xl hover:bg-surface-subtle transition-colors flex items-center justify-between"
              >
                <span>Live Interactive Preview</span>
                <ChevronDown className="w-4 h-4 -rotate-90 text-txt-tertiary" />
              </a>
              <a
                href="#features"
                onClick={closeMobileMenu}
                className="px-3 py-2 rounded-xl hover:bg-surface-subtle transition-colors flex items-center justify-between"
              >
                <span>Platform Capabilities</span>
                <ChevronDown className="w-4 h-4 -rotate-90 text-txt-tertiary" />
              </a>
              <a
                href="#stories"
                onClick={closeMobileMenu}
                className="px-3 py-2 rounded-xl hover:bg-surface-subtle transition-colors flex items-center justify-between"
              >
                <span>24h Expiring Stories</span>
                <ChevronDown className="w-4 h-4 -rotate-90 text-txt-tertiary" />
              </a>
              <a
                href="#community"
                onClick={closeMobileMenu}
                className="px-3 py-2 rounded-xl hover:bg-surface-subtle transition-colors flex items-center justify-between"
              >
                <span>Creator Community</span>
                <ChevronDown className="w-4 h-4 -rotate-90 text-txt-tertiary" />
              </a>
              <Link
                to="/explore"
                onClick={closeMobileMenu}
                className="px-3 py-2 rounded-xl hover:bg-surface-subtle transition-colors flex items-center justify-between text-accent"
              >
                <span className="flex items-center gap-2">
                  <Compass className="w-4 h-4" />
                  Explore Perspectives
                </span>
                <ChevronDown className="w-4 h-4 -rotate-90 text-accent" />
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-8 sm:pt-16 lg:pt-20 pb-12 sm:pb-20 lg:pb-24 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Release Badge */}
          <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-surface border border-border-medium shadow-editorial-xs text-[11px] sm:text-xs font-semibold mb-5 sm:mb-6 animate-fade-in max-w-full">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-txt-primary font-serif">Connectly 2.0</span>
            <span className="text-txt-muted hidden xs:inline">&bull;</span>
            <span className="text-accent truncate">Intentional Social Media</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-txt-primary tracking-tight max-w-5xl mx-auto leading-[1.14] sm:leading-[1.12] px-1 sm:px-4">
            Where meaningful stories flourish and{' '}
            <span className="italic font-serif bg-gradient-to-r from-accent via-amber-600 to-accent bg-clip-text text-transparent">
              visual thoughts breathe.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-4 sm:mt-6 text-sm xs:text-base sm:text-lg md:text-xl text-txt-secondary max-w-2xl mx-auto leading-relaxed px-2">
            Step away from algorithmic clutter. Immerse yourself in chronological feeds, ephemeral 24-hour visual stories, real-time WebSocket conversations, and calm editorial design.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-sm sm:max-w-md mx-auto px-2">
            {isAuthenticated ? (
              <Link to="/feed" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  icon={ArrowRight}
                  iconPosition="right"
                  className="w-full sm:w-auto px-7 py-3 text-sm sm:text-base font-semibold shadow-editorial-md bg-accent hover:bg-accent-hover text-white rounded-2xl"
                >
                  Go to Feed
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    icon={ArrowRight}
                    iconPosition="right"
                    className="w-full sm:w-auto px-7 py-3 text-sm sm:text-base font-semibold shadow-editorial-md bg-accent hover:bg-accent-hover text-white rounded-2xl"
                  >
                    Start Creating Free
                  </Button>
                </Link>
                <Link to="/explore" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    icon={Compass}
                    className="w-full sm:w-auto px-5 py-3 text-sm sm:text-base font-semibold shadow-editorial-xs border-border-medium hover:border-accent/40 rounded-2xl"
                  >
                    Explore
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Value Badges */}
          <div className="mt-8 sm:mt-10 grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2 sm:gap-6 text-[11px] sm:text-xs font-mono text-txt-secondary max-w-xl mx-auto text-left sm:text-center px-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent shrink-0" />
              <span>Chronological Feed</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent shrink-0" />
              <span>24h Expiring Stories</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent shrink-0" />
              <span>Real-Time Socket Chat</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent shrink-0" />
              <span>Zero Algorithmic Traps</span>
            </span>
          </div>

          {/* Interactive Editorial App Showcase */}
          <div id="showcase" className="mt-12 sm:mt-16 lg:mt-20 max-w-4xl mx-auto scroll-mt-20 px-1 sm:px-0">
            {/* Interactive Showcase Window */}
            <div className="relative rounded-2xl sm:rounded-3xl bg-surface border border-border-medium shadow-editorial-lg overflow-hidden transition-all duration-300 text-left">
              {/* Window Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-border-subtle bg-surface-subtle/70">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-400" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-400" />
                  <span className="ml-1 sm:ml-2 font-mono text-[10px] sm:text-[11px] text-txt-tertiary hidden md:inline">
                    atelier.connectly.app
                  </span>
                </div>

                {/* Interactive Demo Tabs */}
                <div className="flex items-center gap-0.5 sm:gap-1 bg-surface p-0.5 sm:p-1 rounded-xl border border-border-subtle text-[11px] sm:text-xs font-semibold overflow-x-auto max-w-full">
                  <button
                    type="button"
                    onClick={() => setActiveTab('feed')}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all whitespace-nowrap ${
                      activeTab === 'feed'
                        ? 'bg-accent text-white shadow-editorial-xs'
                        : 'text-txt-secondary hover:text-txt-primary'
                    }`}
                  >
                    Feed
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('stories')}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all whitespace-nowrap ${
                      activeTab === 'stories'
                        ? 'bg-accent text-white shadow-editorial-xs'
                        : 'text-txt-secondary hover:text-txt-primary'
                    }`}
                  >
                    Stories
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('chat')}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all whitespace-nowrap ${
                      activeTab === 'chat'
                        ? 'bg-accent text-white shadow-editorial-xs'
                        : 'text-txt-secondary hover:text-txt-primary'
                    }`}
                  >
                    Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('explore')}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all whitespace-nowrap ${
                      activeTab === 'explore'
                        ? 'bg-accent text-white shadow-editorial-xs'
                        : 'text-txt-secondary hover:text-txt-primary'
                    }`}
                  >
                    Explore
                  </button>
                </div>

                <div className="hidden xs:flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Live Sync</span>
                </div>
              </div>

              {/* Showcase Body Content (Dynamic per tab) */}
              <div className="p-3.5 sm:p-6 lg:p-8 min-h-[420px] sm:min-h-[460px] bg-canvas/40 flex flex-col justify-center">
                {activeTab === 'feed' && (
                  <div className="space-y-3.5 sm:space-y-4 max-w-xl mx-auto w-full animate-fade-in">
                    {/* Mini Stories Row */}
                    <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto pb-2 scrollbar-none border-b border-border-subtle/80">
                      {[
                        { name: 'Your Story', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', active: false },
                        { name: 'Elena R.', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80', active: true },
                        { name: 'Julian T.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', active: true },
                        { name: 'Maya Lin', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80', active: true },
                        { name: 'Kenji S.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80', active: false },
                      ].map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group">
                          <div
                            className={`p-0.5 rounded-full ${
                              item.active
                                ? 'bg-gradient-to-tr from-accent via-amber-500 to-rose-500'
                                : 'border border-border-medium'
                            }`}
                          >
                            <img
                              src={item.avatar}
                              alt={item.name}
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <span className="text-[9px] sm:text-[10px] font-medium text-txt-secondary group-hover:text-txt-primary truncate max-w-[56px] text-center">
                            {item.name}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Post Card */}
                    <div className="rounded-2xl bg-surface border border-border-subtle p-3.5 sm:p-5 shadow-editorial-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                          <img
                            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                            alt="Amara"
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs sm:text-sm font-semibold text-txt-primary">Amara Okafor</h4>
                              <span className="text-[9px] sm:text-[10px] font-mono px-1 py-0.2 rounded bg-surface-subtle text-txt-tertiary">
                                Pro
                              </span>
                            </div>
                            <p className="text-[10px] sm:text-xs text-txt-tertiary font-mono">@amara.okafor &bull; 14m ago</p>
                          </div>
                        </div>
                        <span className="text-[10px] sm:text-xs font-mono text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                          Architecture
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-txt-secondary leading-relaxed">
                        The quiet dialogue between Scandinavian woodwork and Japanese brutalist concrete in early morning light. No filters, just raw geometry.
                      </p>

                      <div className="rounded-xl overflow-hidden aspect-[16/9] relative group">
                        <img
                          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&auto=format&fit=crop&q=80"
                          alt="Modern House Architecture"
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-border-subtle text-[11px] sm:text-xs font-semibold text-txt-secondary">
                        <div className="flex items-center gap-4 sm:gap-5">
                          <button
                            type="button"
                            onClick={handleLikeToggle}
                            className={`flex items-center gap-1.5 transition-colors ${
                              demoLiked ? 'text-rose-500' : 'hover:text-rose-500'
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${demoLiked ? 'fill-rose-500' : ''}`} />
                            <span>{demoLikeCount}</span>
                          </button>
                          <span className="flex items-center gap-1.5 hover:text-accent cursor-pointer">
                            <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 42
                          </span>
                          <span className="flex items-center gap-1.5 hover:text-accent cursor-pointer">
                            <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Share
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDemoBookmarked(!demoBookmarked)}
                          className={`hover:text-accent transition-colors ${
                            demoBookmarked ? 'text-accent' : ''
                          }`}
                        >
                          <Bookmark className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${demoBookmarked ? 'fill-accent' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'stories' && (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-7 max-w-xl mx-auto w-full animate-fade-in py-2">
                    {/* Story Phone Card Preview */}
                    <div className="w-56 xs:w-60 sm:w-64 h-84 sm:h-96 rounded-3xl overflow-hidden relative shadow-editorial-lg border border-border-medium bg-black flex flex-col justify-between p-3.5 text-white shrink-0">
                      {/* Blurred Ambient Backdrop */}
                      <img
                        src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80"
                        alt="Story background"
                        className="absolute inset-0 w-full h-full object-cover opacity-85"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80 pointer-events-none" />

                      {/* Top Story Controls */}
                      <div className="relative z-10 space-y-2">
                        {/* Segmented Progress Bars */}
                        <div className="flex items-center gap-1 w-full">
                          <div className="h-1 flex-1 rounded-full bg-white/90 overflow-hidden" />
                          <div className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden">
                            <div
                              className="h-full bg-white transition-all duration-300"
                              style={{ width: `${activeStoryProgress}%` }}
                            />
                          </div>
                          <div className="h-1 flex-1 rounded-full bg-white/30" />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img
                              src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80"
                              alt="Elena"
                              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-white/60"
                            />
                            <span className="text-[11px] sm:text-xs font-semibold drop-shadow">@elena.rostova</span>
                          </div>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20">
                            30s Story
                          </span>
                        </div>
                      </div>

                      {/* Bottom Story Controls */}
                      <div className="relative z-10 space-y-1.5">
                        <p className="text-[11px] sm:text-xs font-serif italic text-white/95 drop-shadow">
                          "Sunset over the Mediterranean cliffs. Will disappear in 22 hours."
                        </p>
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-white/20">
                          <span className="flex items-center gap-1 text-[10px] sm:text-[11px] text-white/90">
                            <Eye className="w-3.5 h-3.5" /> 1,420 views
                          </span>
                          <span className="text-[9px] font-mono bg-accent/80 text-white px-2 py-0.5 rounded-full">
                            Hold to pause
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Story Feature Description */}
                    <div className="space-y-2.5 sm:space-y-3 text-center sm:text-left max-w-xs">
                      <span className="px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[11px] font-semibold font-mono">
                        Ephemeral 24h Lifecycle
                      </span>
                      <h3 className="text-base sm:text-lg font-serif font-bold text-txt-primary">
                        Real-World Stories with Ambient Lighting
                      </h3>
                      <p className="text-xs text-txt-secondary leading-relaxed">
                        Automatic 30-second smooth progression, tap-to-navigate, gesture hold-to-pause, and zero letterbox black bars. Automatically deleted in 24 hours.
                      </p>
                      <div className="pt-1 flex justify-center sm:justify-start">
                        <Link to="/stories">
                          <Button size="xs" variant="outline" icon={Play} className="text-xs font-semibold">
                            Try Stories Viewer
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'chat' && (
                  <div className="max-w-md mx-auto w-full space-y-2.5 sm:space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-surface border border-border-subtle shadow-editorial-xs">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <img
                            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                            alt="Julian"
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover"
                          />
                          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-surface" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-txt-primary">Julian Thorne</h4>
                          <p className="text-[9px] sm:text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                            typing in real-time...
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-mono text-txt-tertiary">Socket.IO 4.8</span>
                    </div>

                    {/* Message Thread */}
                    <div className="p-3 sm:p-4 rounded-2xl bg-surface border border-border-subtle space-y-2.5 text-xs">
                      <div className="flex justify-start">
                        <div className="max-w-[85%] sm:max-w-[78%] rounded-2xl rounded-tl-sm bg-surface-subtle p-2.5 sm:p-3 text-txt-secondary border border-border-subtle leading-relaxed">
                          Have you seen the new editorial typography layout in Atelier? It feels like reading an art publication!
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="max-w-[85%] sm:max-w-[78%] rounded-2xl rounded-tr-sm bg-accent text-white p-2.5 sm:p-3 shadow-editorial-xs leading-relaxed">
                          Yes! And the stories viewer has zero black voids now with ambient backdrop lighting.
                        </div>
                      </div>
                      <div className="flex justify-start items-center gap-1 text-[10px] text-txt-tertiary">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce delay-100" />
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce delay-200" />
                        <span className="ml-1 font-mono">Julian is replying</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded-xl bg-surface border border-border-subtle">
                      <input
                        type="text"
                        placeholder="Write a mindful message..."
                        disabled
                        className="flex-1 bg-transparent px-2 text-xs text-txt-primary placeholder:text-txt-muted focus:outline-none"
                      />
                      <Button size="xs" className="bg-accent text-white rounded-lg px-2.5 py-1">
                        <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}

                {activeTab === 'explore' && (
                  <div className="max-w-xl mx-auto w-full space-y-3 animate-fade-in">
                    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none text-[11px] sm:text-xs font-semibold">
                      {['#architecture', '#minimalism', '#editorial', '#filmPhotography', '#typography'].map(
                        (tag, idx) => (
                          <span
                            key={idx}
                            className={`px-2.5 sm:px-3 py-1 rounded-full cursor-pointer shrink-0 transition-colors whitespace-nowrap ${
                              idx === 0
                                ? 'bg-accent text-white'
                                : 'bg-surface border border-border-medium text-txt-secondary hover:text-txt-primary'
                            }`}
                          >
                            {tag}
                          </span>
                        )
                      )}
                    </div>

                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5 sm:gap-3">
                      <div className="rounded-xl sm:rounded-2xl overflow-hidden relative group aspect-[4/3] bg-surface-subtle border border-border-subtle">
                        <img
                          src="https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80"
                          alt="Interior"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex items-end p-2.5 sm:p-3 text-white">
                          <p className="text-xs font-semibold truncate">Living With Warm Ceramics</p>
                        </div>
                      </div>
                      <div className="rounded-xl sm:rounded-2xl overflow-hidden relative group aspect-[4/3] bg-surface-subtle border border-border-subtle">
                        <img
                          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80"
                          alt="Modern Building"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex items-end p-2.5 sm:p-3 text-white">
                          <p className="text-xs font-semibold truncate">Urban Monoliths in Tokyo</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Strip */}
      <section className="py-8 sm:py-12 bg-surface border-y border-border-subtle transition-colors duration-300 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 text-center">
            <div className="p-2 sm:p-3 space-y-1">
              <p className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-accent">24 Hours</p>
              <p className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-txt-secondary">
                Story Lifecycle
              </p>
            </div>
            <div className="p-2 sm:p-3 space-y-1">
              <p className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-accent">&lt; 50ms</p>
              <p className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-txt-secondary">
                Socket Latency
              </p>
            </div>
            <div className="p-2 sm:p-3 space-y-1">
              <p className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-accent">Zero Ads</p>
              <p className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-txt-secondary">
                Chronological Feed
              </p>
            </div>
            <div className="p-2 sm:p-3 space-y-1">
              <p className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-accent">100%</p>
              <p className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-txt-secondary">
                Data Ownership
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities Bento Grid */}
      <section id="features" className="py-14 sm:py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-16 w-full">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          <span className="text-accent text-[11px] sm:text-xs font-mono font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
            Crafted for Meaningful Depth
          </span>
          <h2 className="mt-3 sm:mt-4 text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-txt-primary">
            Every feature designed with intention.
          </h2>
          <p className="mt-3 sm:mt-4 text-txt-secondary text-xs sm:text-sm md:text-base leading-relaxed px-2">
            Connectly eliminates doom-scrolling mechanisms. Experience high-aesthetic typography, respectful real-time interactions, and calm spaces.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Bento 1: Large Span 2 */}
          <div className="md:col-span-2 lg:col-span-2 rounded-2xl sm:rounded-3xl bg-surface border border-border-medium p-5 sm:p-7 lg:p-9 shadow-editorial-sm hover:shadow-editorial transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-accent/10 text-accent flex items-center justify-center group-hover:scale-105 transition-transform">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-txt-primary">
                Ephemeral 24h Stories with Ambient Lighting
              </h3>
              <p className="text-xs sm:text-sm text-txt-secondary leading-relaxed max-w-xl">
                Broadcast visual snippets of your life that automatically delete after 24 hours. Enjoy ambient edge-to-edge backdrop lighting that eliminates harsh letterbox black bars, with smooth 30-second progress bars and hold-to-pause gestures.
              </p>
            </div>
            <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-border-subtle flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] sm:text-xs font-mono text-txt-tertiary">
              <span className="flex items-center gap-1.5 text-accent">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> 30-Sec Auto Advance
              </span>
              <span className="flex items-center gap-1.5 text-accent">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> Live Viewers Counter
              </span>
              <span className="flex items-center gap-1.5 text-accent">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> MongoDB 24h Purge Engine
              </span>
            </div>
          </div>

          {/* Bento 2: Real-time Socket */}
          <div className="rounded-2xl sm:rounded-3xl bg-surface border border-border-medium p-5 sm:p-7 lg:p-9 shadow-editorial-sm hover:shadow-editorial transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-accent/10 text-accent flex items-center justify-center group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-bold text-txt-primary">
                Instant Real-Time Chat
              </h3>
              <p className="text-xs sm:text-sm text-txt-secondary leading-relaxed">
                Direct messages powered by Socket.IO with typing pulses, read indicators, and seamless thread management.
              </p>
            </div>
            <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-border-subtle">
              <span className="text-[11px] sm:text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                Persistent Socket Connection
              </span>
            </div>
          </div>

          {/* Bento 3: Editorial Typography */}
          <div className="rounded-2xl sm:rounded-3xl bg-surface border border-border-medium p-5 sm:p-7 lg:p-9 shadow-editorial-sm hover:shadow-editorial transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-accent/10 text-accent flex items-center justify-center group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-bold text-txt-primary">
                Editorial Typography
              </h3>
              <p className="text-xs sm:text-sm text-txt-secondary leading-relaxed">
                Typeset in Newsreader and Plus Jakarta Sans. Reading posts feels like leafing through an architectural journal.
              </p>
            </div>
            <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-border-subtle">
              <span className="text-[11px] sm:text-xs font-mono text-txt-tertiary">
                High-legibility optical sizing
              </span>
            </div>
          </div>

          {/* Bento 4: Bookmarks & Collections */}
          <div className="rounded-2xl sm:rounded-3xl bg-surface border border-border-medium p-5 sm:p-7 lg:p-9 shadow-editorial-sm hover:shadow-editorial transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-accent/10 text-accent flex items-center justify-center group-hover:scale-105 transition-transform">
                <Bookmark className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-bold text-txt-primary">
                Curated Collections
              </h3>
              <p className="text-xs sm:text-sm text-txt-secondary leading-relaxed">
                Save resonant essays, visual moods, and inspirations into neatly organized, private or public collections.
              </p>
            </div>
            <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-border-subtle">
              <span className="text-[11px] sm:text-xs font-mono text-txt-tertiary">
                Organized reference vault
              </span>
            </div>
          </div>

          {/* Bento 5: Privacy-First */}
          <div className="rounded-2xl sm:rounded-3xl bg-surface border border-border-medium p-5 sm:p-7 lg:p-9 shadow-editorial-sm hover:shadow-editorial transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-accent/10 text-accent flex items-center justify-center group-hover:scale-105 transition-transform">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-bold text-txt-primary">
                Complete Privacy Control
              </h3>
              <p className="text-xs sm:text-sm text-txt-secondary leading-relaxed">
                No third-party ad pixels. Granular visibility controls, secure authentication tokens, and full account deletion at any time.
              </p>
            </div>
            <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-border-subtle">
              <span className="text-[11px] sm:text-xs font-mono text-txt-tertiary">
                Zero tracking, zero surveillance
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Community Perspectives Section */}
      <section id="community" className="py-14 sm:py-20 bg-surface border-y border-border-subtle transition-colors duration-300 scroll-mt-16 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <span className="text-accent text-[11px] sm:text-xs font-mono font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
              Community Perspectives
            </span>
            <h2 className="mt-3 sm:mt-4 text-2xl xs:text-3xl sm:text-4xl font-serif font-bold text-txt-primary">
              Loved by creators who value calm clarity.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {[
              {
                quote:
                  'Connectly restored my joy for sharing photography. There are no toxic engagement traps or intrusive ads—just gorgeous visual presentation and thoughtful dialogue.',
                name: 'Julian Thorne',
                role: 'Architectural Photographer',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
              },
              {
                quote:
                  'The 24h stories with ambient background lighting look stunning. The 30-second pacing gives room for genuine creative storytelling without rush.',
                name: 'Elena Rostova',
                role: 'Visual Director & Filmmaker',
                avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
              },
              {
                quote:
                  'As an essayist, having clean Newsreader typography and a chronological feed means my readers actually read what I write instead of battling an algorithm.',
                name: 'Amara Okafor',
                role: 'Essayist & Design Critic',
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-surface-elevated border border-border-subtle shadow-editorial-xs flex flex-col justify-between space-y-4 sm:space-y-6"
              >
                <p className="text-xs sm:text-sm text-txt-secondary leading-relaxed font-serif italic">
                  "{item.quote}"
                </p>
                <div className="flex items-center gap-3 pt-3 sm:pt-4 border-t border-border-subtle">
                  <img
                    src={item.avatar}
                    alt={item.name}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shrink-0"
                  />
                  <div>
                    <h4 className="text-xs font-semibold text-txt-primary">{item.name}</h4>
                    <p className="text-[10px] sm:text-[11px] text-txt-tertiary">{item.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-14 sm:py-20 lg:py-28 relative overflow-hidden w-full">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-b from-surface to-surface-subtle border border-border-medium p-6 sm:p-10 lg:p-14 shadow-editorial-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-60 sm:w-80 h-60 sm:h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 sm:w-80 h-60 sm:h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto space-y-4 sm:space-y-6">
              <span className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-accent/10 text-accent text-[11px] sm:text-xs font-semibold border border-accent/20">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Join Connectly Today
              </span>

              <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-txt-primary tracking-tight leading-tight">
                Ready for social media that respects your focus?
              </h2>

              <p className="text-xs sm:text-sm md:text-base text-txt-secondary leading-relaxed px-2">
                Create your profile in 30 seconds. Connect with genuine creators, publish visual stories, and experience a cleaner, calmer digital space.
              </p>

              <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-sm sm:max-w-md mx-auto">
                {isAuthenticated ? (
                  <Link to="/feed" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      icon={ArrowRight}
                      iconPosition="right"
                      className="w-full sm:w-auto px-7 py-3 text-sm sm:text-base font-semibold shadow-editorial-md bg-accent hover:bg-accent-hover text-white rounded-2xl"
                    >
                      Open Atelier Feed
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/register" className="w-full sm:w-auto">
                      <Button
                        size="lg"
                        icon={ArrowRight}
                        iconPosition="right"
                        className="w-full sm:w-auto px-7 py-3 text-sm sm:text-base font-semibold shadow-editorial-md bg-accent hover:bg-accent-hover text-white rounded-2xl"
                      >
                        Create Your Account
                      </Button>
                    </Link>
                    <Link to="/login" className="w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full sm:w-auto px-5 py-3 text-sm sm:text-base font-semibold shadow-editorial-xs border-border-medium rounded-2xl"
                      >
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comprehensive Footer */}
      <footer className="mt-auto py-10 sm:py-12 bg-canvas text-txt-secondary border-t border-border-subtle transition-colors duration-300 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8 pb-8 sm:pb-12 border-b border-border-subtle">
            {/* Brand column */}
            <div className="col-span-2 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-accent text-white flex items-center justify-center shadow-editorial-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="font-serif font-bold text-lg sm:text-xl text-txt-primary">Connectly</span>
              </div>
              <p className="text-xs text-txt-secondary leading-relaxed max-w-sm">
                The editorial social network engineered for mindful conversations, 24-hour visual storytelling, and high-fidelity real-time connectivity.
              </p>
              <div className="flex items-center gap-2 text-[11px] font-mono text-txt-tertiary">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>All Systems Operational</span>
              </div>
            </div>

            {/* Product Links */}
            <div className="space-y-2.5 sm:space-y-3">
              <h4 className="text-[11px] sm:text-xs font-mono font-semibold uppercase tracking-wider text-txt-primary">
                Product
              </h4>
              <ul className="space-y-2 text-xs text-txt-secondary">
                <li>
                  <Link to="/feed" className="hover:text-accent transition-colors">
                    Chronological Feed
                  </Link>
                </li>
                <li>
                  <Link to="/stories" className="hover:text-accent transition-colors">
                    24h Stories
                  </Link>
                </li>
                <li>
                  <Link to="/explore" className="hover:text-accent transition-colors">
                    Explore & Topics
                  </Link>
                </li>
                <li>
                  <Link to="/messages" className="hover:text-accent transition-colors">
                    WebSocket Chat
                  </Link>
                </li>
              </ul>
            </div>

            {/* Platform Links */}
            <div className="space-y-2.5 sm:space-y-3">
              <h4 className="text-[11px] sm:text-xs font-mono font-semibold uppercase tracking-wider text-txt-primary">
                Platform
              </h4>
              <ul className="space-y-2 text-xs text-txt-secondary">
                <li>
                  <Link to="/settings" className="hover:text-accent transition-colors">
                    Privacy Controls
                  </Link>
                </li>
                <li>
                  <Link to="/analytics" className="hover:text-accent transition-colors">
                    Creator Analytics
                  </Link>
                </li>
                <li>
                  <Link to="/saved" className="hover:text-accent transition-colors">
                    Saved Collections
                  </Link>
                </li>
                <li>
                  <a href="http://localhost:3000" target="_blank" rel="noreferrer" className="hover:text-accent transition-colors">
                    REST & Socket API
                  </a>
                </li>
              </ul>
            </div>

            {/* Account Links */}
            <div className="col-span-2 sm:col-span-1 space-y-2.5 sm:space-y-3">
              <h4 className="text-[11px] sm:text-xs font-mono font-semibold uppercase tracking-wider text-txt-primary">
                Account
              </h4>
              <ul className="space-y-2 text-xs text-txt-secondary">
                <li>
                  <Link to="/login" className="hover:text-accent transition-colors">
                    Log In
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-accent transition-colors">
                    Register
                  </Link>
                </li>
                <li>
                  <Link to="/settings" className="hover:text-accent transition-colors">
                    Account Settings
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] sm:text-xs font-mono text-txt-tertiary text-center sm:text-left">
            <p>&copy; {new Date().getFullYear()} Connectly Atelier. All rights reserved.</p>
            <div className="flex items-center gap-3 sm:gap-4">
              <span>Paper & Ink Aesthetics</span>
              <span>&bull;</span>
              <span>Built for Creators</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
