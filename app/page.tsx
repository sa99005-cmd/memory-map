'use client';

import { useState, useEffect } from 'react';
import Feed from '@/components/Feed';
import Navigation from '@/components/Navigation';
import { FeedPost } from '@/components/types';
import { MapPin } from 'lucide-react';

export default function Home() {
  const [posts, setPosts] = useState<FeedPost[]>([]);

  // Load from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('memory-map-feeds');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPosts(parsed);
      } catch (e) {
        console.error("Failed to parse feeds from local storage", e);
      }
    }
  }, []);

  const handleAddPost = (postData: Omit<FeedPost, 'id'>) => {
    const newPost: FeedPost = {
      ...postData,
      id: Date.now(),
    };
    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);
    try {
      localStorage.setItem('memory-map-feeds', JSON.stringify(updatedPosts));
    } catch (error) {
      console.error("Failed to save post:", error);
      alert("저장에 실패했습니다. 저장 공간을 확인해주세요.");
    }
  };

  const handleDeletePost = (id: number) => {
    const updatedPosts = posts.filter(post => post.id !== id);
    setPosts(updatedPosts);
    try {
      localStorage.setItem('memory-map-feeds', JSON.stringify(updatedPosts));
    } catch (error) {
      console.error("Failed to save deletion:", error);
    }
  };

  const handleUpdatePost = (id: number, postData: Omit<FeedPost, 'id'>) => {
    const updatedPosts = posts.map(post =>
      post.id === id ? { ...postData, id } : post
    );
    setPosts(updatedPosts);
    try {
      localStorage.setItem('memory-map-feeds', JSON.stringify(updatedPosts));
    } catch (error) {
      console.error("Failed to save update:", error);
      alert("저장에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* 네비게이션 */}
      <Navigation />

      {/* 메인 컨텐츠 */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full pb-20 md:pb-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 mb-6 border-b border-gray-200">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-sage-green mb-2 flex items-center gap-2">
              <MapPin className="text-sage-green" fill="#F9F9F5" size={36} />
              Memory Map
            </h1>
            <p className="text-gray-500 font-medium">당신의 발자취를 지도 위에 남겨보세요.</p>
          </div>
          <div className="text-xs text-gray-400 mt-2 md:mt-0 font-light">
            Beta v1.0 • Built with ❤️
          </div>
        </header>

        {/* 피드 컨텐츠 */}
        <Feed
          posts={posts}
          onAddPost={handleAddPost}
          onDeletePost={handleDeletePost}
          onUpdatePost={handleUpdatePost}
        />
      </main>
    </div>
  );
}
