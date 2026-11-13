import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { postService } from '../services/postService';
import PostCard from '../components/posts/PostCard';
import { PostSkeleton } from '../components/common/LoadingSkeleton';
import ErrorState from '../components/common/ErrorState';
import Button from '../components/common/Button';
import { ArrowLeft, ChevronRight, Share2 } from 'lucide-react';

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await postService.getPostById(id);
        if (isMounted) {
          const postData = res.post || res.data || res;
          setPost(postData);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Post could not be found');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPost();
    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Top Editorial Breadcrumb Bar */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2 text-xs">
          <Button
            variant="ghost"
            size="sm"
            icon={ArrowLeft}
            onClick={() => navigate(-1)}
            className="text-txt-secondary hover:text-txt-primary -ml-2"
          >
            Back
          </Button>
          <span className="text-txt-muted">•</span>
          <Link to="/feed" className="text-txt-secondary hover:text-txt-primary hover:underline">
            Feed
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-txt-muted" />
          <span className="font-mono text-txt-muted truncate max-w-[120px]">
            {post ? `@${post.author?.username || 'dispatch'}` : 'Loading'}
          </span>
        </div>
      </div>

      {loading ? (
        <PostSkeleton />
      ) : error ? (
        <ErrorState
          title="Dispatch not found"
          message={error}
          onRetry={() => window.location.reload()}
        />
      ) : post ? (
        <PostCard
          post={post}
          onDelete={() => {
            navigate('/feed');
          }}
        />
      ) : null}
    </div>
  );
}
