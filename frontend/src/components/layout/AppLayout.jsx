import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import NavigationRail from './NavigationRail';
import RightSidebar from './RightSidebar';
import MobileNavigation from './MobileNavigation';
import CreatePostModal from '../posts/CreatePostModal';

export default function AppLayout() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-canvas text-txt-primary flex flex-col transition-colors duration-200">
      {/* Floating Vertical Navigation Rail (Desktop & Tablet) */}
      <NavigationRail onOpenCreatePost={() => setIsCreateModalOpen(true)} />

      {/* Main Layout Area offset by navigation rail */}
      <div className="flex-1 flex flex-col md:pl-24 lg:pl-28 transition-all duration-200">
        {/* Distinctive Application Header */}
        <Navbar onOpenCreatePost={() => setIsCreateModalOpen(true)} />

        {/* Spacious Main Content & Secondary Panel Grid */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-center gap-8">
            {/* Primary Main Content Canvas with smooth page entrance */}
            <div
              key={location.pathname}
              className="w-full max-w-2xl min-h-[calc(100vh-12rem)] pb-24 md:pb-12 animate-page-enter"
            >
              <Outlet context={{ openCreateModal: () => setIsCreateModalOpen(true) }} />
            </div>

            {/* Carefully Positioned Secondary Panel */}
            <RightSidebar />
          </div>
        </main>
      </div>

      {/* Floating Mobile Bottom Island Navigation */}
      <MobileNavigation onOpenCreatePost={() => setIsCreateModalOpen(true)} />

      {/* Post Creation Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={() => {
          window.dispatchEvent(new Event('connectly:post-created'));
        }}
      />
    </div>
  );
}
