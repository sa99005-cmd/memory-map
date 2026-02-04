'use client';

import { FeedPost } from './types';
import FeedCard from './FeedCard';
import FeedPostModal from './FeedPostModal';
import { useState } from 'react';
import { FileText } from 'lucide-react';

interface FeedProps {
    posts: FeedPost[];
    onAddPost: (post: Omit<FeedPost, 'id'>) => void;
    onDeletePost: (id: number) => void;
    onUpdatePost: (id: number, post: Omit<FeedPost, 'id'>) => void;
}

export default function Feed({ posts, onAddPost, onDeletePost, onUpdatePost }: FeedProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<FeedPost | undefined>(undefined);

    const handleOpenModal = () => {
        setEditingPost(undefined);
        setIsModalOpen(true);
    };

    const handleEditPost = (post: FeedPost) => {
        setEditingPost(post);
        setIsModalOpen(true);
    };

    const handleSavePost = (postData: Omit<FeedPost, 'id'>) => {
        if (editingPost) {
            onUpdatePost(editingPost.id, postData);
        } else {
            onAddPost(postData);
        }
        setIsModalOpen(false);
        setEditingPost(undefined);
    };

    return (
        <div className="w-full">
            {/* 헤더 - 게시글 작성 버튼 */}
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">피드</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        {posts.length}개의 추억
                    </p>
                </div>
                <button
                    onClick={handleOpenModal}
                    className="px-5 py-2.5 bg-sage-green text-white rounded-lg hover:bg-sage-green/90 transition-all font-medium shadow-md hover:shadow-lg"
                >
                    + 새 게시글
                </button>
            </div>

            {/* 게시글 목록 */}
            {posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <FileText size={64} strokeWidth={1} className="mb-4" />
                    <p className="text-lg font-medium">아직 게시글이 없습니다</p>
                    <p className="text-sm mt-2">첫 추억을 공유해보세요!</p>
                    <button
                        onClick={handleOpenModal}
                        className="mt-6 px-6 py-3 bg-sage-green text-white rounded-lg hover:bg-sage-green/90 transition-all font-medium"
                    >
                        게시글 작성하기
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map((post) => (
                        <FeedCard
                            key={post.id}
                            post={post}
                            onDelete={onDeletePost}
                            onEdit={handleEditPost}
                        />
                    ))}
                </div>
            )}

            {/* 게시글 작성/수정 모달 */}
            <FeedPostModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingPost(undefined);
                }}
                onSave={handleSavePost}
                editPost={editingPost}
            />
        </div>
    );
}
