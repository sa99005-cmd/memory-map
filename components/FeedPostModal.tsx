'use client';

import { FeedPost } from './types';
import { X, Upload, Image as ImageIcon, MapPin as MapPinIcon } from 'lucide-react';
import { useState, useRef, ChangeEvent } from 'react';
import { compressImage } from './imageCompression';

interface FeedPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (post: Omit<FeedPost, 'id'>) => void;
    editPost?: FeedPost;
}

export default function FeedPostModal({ isOpen, onClose, onSave, editPost }: FeedPostModalProps) {
    const [title, setTitle] = useState(editPost?.title || '');
    const [memo, setMemo] = useState(editPost?.memo || '');
    const [photos, setPhotos] = useState<string[]>(editPost?.photos || []);
    const [locationName, setLocationName] = useState(editPost?.locationName || '');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const newPhotos: string[] = [];

        try {
            for (let i = 0; i < Math.min(files.length, 10); i++) {
                const file = files[i];
                const compressed = await compressImage(file, 800, 0.8);
                newPhotos.push(compressed);
            }
            setPhotos([...photos, ...newPhotos]);
        } catch (error) {
            console.error('이미지 업로드 실패:', error);
            alert('이미지 업로드에 실패했습니다.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemovePhoto = (index: number) => {
        setPhotos(photos.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (!title.trim()) {
            alert('제목을 입력해주세요.');
            return;
        }

        const postData: Omit<FeedPost, 'id'> = {
            title: title.trim(),
            memo: memo.trim(),
            date: editPost?.date || new Date().toISOString(),
            photos: photos.length > 0 ? photos : undefined,
            lat: editPost?.lat || 37.5665,  // 기본값: 서울
            lng: editPost?.lng || 126.9780,
            locationName: locationName.trim() || undefined,
        };

        onSave(postData);
        handleClose();
    };

    const handleClose = () => {
        setTitle('');
        setMemo('');
        setPhotos([]);
        setLocationName('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* 헤더 */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {editPost ? '게시글 수정' : '새 게시글'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="닫기"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* 콘텐츠 */}
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                    {/* 제목 입력 */}
                    <div className="mb-5">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            제목 *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="제목을 입력하세요"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-green focus:border-transparent"
                            maxLength={100}
                        />
                    </div>

                    {/* 내용 입력 */}
                    <div className="mb-5">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            내용
                        </label>
                        <textarea
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                            placeholder="내용을 입력하세요"
                            rows={6}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-green focus:border-transparent resize-none"
                            maxLength={2000}
                        />
                        <div className="text-xs text-gray-500 mt-1 text-right">
                            {memo.length} / 2000
                        </div>
                    </div>

                    {/* 위치 입력 */}
                    <div className="mb-5">
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <MapPinIcon size={16} className="text-sage-green" />
                            위치
                        </label>
                        <input
                            type="text"
                            value={locationName}
                            onChange={(e) => setLocationName(e.target.value)}
                            placeholder="예: 서울, 대한민국"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-green focus:border-transparent"
                            maxLength={100}
                        />
                    </div>

                    {/* 이미지 업로드 */}
                    <div className="mb-5">
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <ImageIcon size={16} className="text-sage-green" />
                            이미지 ({photos.length}/10)
                        </label>

                        {/* 이미지 미리보기 */}
                        {photos.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
                                {photos.map((photo, index) => (
                                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                                        <img
                                            src={photo}
                                            alt={`사진 ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            onClick={() => handleRemovePhoto(index)}
                                            className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            aria-label="삭제"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 업로드 버튼 */}
                        {photos.length < 10 && (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-sage-green hover:bg-sage-green/5 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-sage-green disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Upload size={20} />
                                <span className="font-medium">
                                    {isUploading ? '업로드 중...' : '이미지 추가'}
                                </span>
                            </button>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                    </div>
                </div>

                {/* 푸터 */}
                <div className="flex gap-3 p-5 border-t border-gray-200">
                    <button
                        onClick={handleClose}
                        className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!title.trim() || isUploading}
                        className="flex-1 px-6 py-3 bg-sage-green text-white rounded-lg hover:bg-sage-green/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {editPost ? '수정하기' : '게시하기'}
                    </button>
                </div>
            </div>
        </div>
    );
}
