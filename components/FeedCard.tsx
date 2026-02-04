'use client';

import { FeedPost } from './types';
import { MapPin, Calendar, Trash2, Edit3, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import Linkify from './Linkify';

interface FeedCardProps {
    post: FeedPost;
    onDelete: (id: number) => void;
    onEdit?: (post: FeedPost) => void;
}

export default function FeedCard({ post, onDelete, onEdit }: FeedCardProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const images = post.photos || (post.photo ? [post.photo] : []);

    const handlePrevImage = () => {
        setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNextImage = () => {
        setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const handleDelete = () => {
        if (confirm('이 게시글을 삭제하시겠습니까?')) {
            onDelete(post.id);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
            {/* 이미지 캐러셀 */}
            {images.length > 0 && (
                <div className="relative aspect-square bg-gray-100">
                    <img
                        src={images[currentImageIndex]}
                        alt={post.title}
                        className="w-full h-full object-cover"
                    />

                    {/* 이미지 네비게이션 */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={handlePrevImage}
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-all"
                                aria-label="이전 이미지"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={handleNextImage}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-all"
                                aria-label="다음 이미지"
                            >
                                <ChevronRight size={20} />
                            </button>

                            {/* 이미지 인디케이터 */}
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                {images.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`h-1.5 rounded-full transition-all ${index === currentImageIndex
                                                ? 'w-6 bg-white'
                                                : 'w-1.5 bg-white/50'
                                            }`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* 콘텐츠 */}
            <div className="p-5">
                {/* 제목 */}
                <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                    {post.title}
                </h3>

                {/* 내용 */}
                <div className="text-gray-600 mb-4 line-clamp-3 whitespace-pre-wrap">
                    <Linkify text={post.memo} />
                </div>

                {/* 메타 정보 */}
                <div className="flex flex-col gap-2 text-sm text-gray-500 mb-4">
                    {/* 위치 */}
                    {post.locationName && (
                        <div className="flex items-center gap-1.5">
                            <MapPin size={16} className="text-sage-green" />
                            <span>{post.locationName}</span>
                        </div>
                    )}

                    {/* 날짜 */}
                    <div className="flex items-center gap-1.5">
                        <Calendar size={16} className="text-sage-green" />
                        <span>{new Date(post.date).toLocaleDateString('ko-KR')}</span>
                    </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                    {onEdit && (
                        <button
                            onClick={() => onEdit(post)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-sage-green/10 text-sage-green rounded-lg hover:bg-sage-green hover:text-white transition-all font-medium"
                        >
                            <Edit3 size={16} />
                            <span>수정</span>
                        </button>
                    )}
                    <button
                        onClick={handleDelete}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all font-medium"
                    >
                        <Trash2 size={16} />
                        <span>삭제</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
