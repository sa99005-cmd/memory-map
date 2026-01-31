'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Pin } from '@/components/types';
import { MapPin, Calendar, ArrowLeft, Image as ImageIcon, Edit2, Save, X, Upload, Trash2, Check, Camera, Crosshair } from 'lucide-react';
import Linkify from '../../components/Linkify';

export default function LibraryPage() {
    const [pins, setPins] = useState<Pin[]>([]);
    const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Pin | null>(null);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchPins = async () => {
            try {
                const res = await fetch('/api/pins');
                if (res.ok) {
                    const data = await res.json();
                    setPins(data.sort((a: Pin, b: Pin) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    ));
                }
            } catch (error) {
                console.error("Failed to fetch pins:", error);
            }
        };
        fetchPins();
    }, []);

    const openModal = (pin: Pin) => {
        setSelectedPin(pin);
        setIsEditing(false);
        setEditForm(pin);
        setCurrentPhotoIndex(0);
    };

    const closeModal = () => {
        setSelectedPin(null);
        setIsEditing(false);
        setEditForm(null);
        setCurrentPhotoIndex(0);
    };

    const handleStartEdit = () => {
        setIsEditing(true);
        // Normalize photos for edit form
        const photos = selectedPin?.photos || (selectedPin?.photo ? [selectedPin.photo] : []);
        setEditForm(selectedPin ? { ...selectedPin, photos } : null);
        setCurrentPhotoIndex(0);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditForm(selectedPin);
        setCurrentPhotoIndex(0);
    };

    const handleSaveEdit = async () => {
        if (!editForm || !selectedPin) return;

        // Ensure backward compatibility: set 'photo' to the first image if available
        const updatedPin = {
            ...editForm,
            photo: editForm.photos && editForm.photos.length > 0 ? editForm.photos[0] : undefined
        };

        // Optimistic update
        const updatedPins = pins.map(p => p.id === editForm.id ? updatedPin : p);
        setPins(updatedPins);
        setSelectedPin(updatedPin);
        setIsEditing(false);

        try {
            await fetch('/api/pins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedPins),
            });
        } catch (error) {
            console.error("Failed to save changes:", error);
            alert("저장에 실패했습니다.");
        }
    };

    const handleDeletePin = async (id: number) => {
        if (!confirm("정말로 이 추억을 삭제하시겠습니까?")) return;

        const updatedPins = pins.filter(p => p.id !== id);
        setPins(updatedPins);

        if (selectedPin?.id === id) {
            closeModal();
        }

        try {
            await fetch('/api/pins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedPins),
            });
        } catch (error) {
            console.error("Failed to delete pin:", error);
            alert("삭제에 실패했습니다.");
            // Revert on error
            setPins(pins);
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && editForm) {
            const currentPhotos = editForm.photos || [];
            if (currentPhotos.length >= 3) {
                alert("사진은 최대 3장까지만 업로드할 수 있습니다.");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const newPhotos = [...currentPhotos, reader.result as string];
                setEditForm({ ...editForm, photos: newPhotos });
                setCurrentPhotoIndex(newPhotos.length - 1); // Move to new photo
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveCurrentPhoto = () => {
        if (!editForm) return;
        const currentPhotos = editForm.photos || [];
        if (currentPhotos.length === 0) return;

        const newPhotos = currentPhotos.filter((_, idx) => idx !== currentPhotoIndex);
        setEditForm({ ...editForm, photos: newPhotos });

        // Adjust index if needed
        if (currentPhotoIndex >= newPhotos.length) {
            setCurrentPhotoIndex(Math.max(0, newPhotos.length - 1));
        }
    };

    const handlePrevPhoto = (e: React.MouseEvent) => {
        e.stopPropagation();
        const photos = isEditing ? editForm?.photos : (selectedPin?.photos || (selectedPin?.photo ? [selectedPin.photo] : []));
        if (!photos || photos.length <= 1) return;
        setCurrentPhotoIndex(prev => (prev - 1 + photos.length) % photos.length);
    };

    const handleNextPhoto = (e: React.MouseEvent) => {
        e.stopPropagation();
        const photos = isEditing ? editForm?.photos : (selectedPin?.photos || (selectedPin?.photo ? [selectedPin.photo] : []));
        if (!photos || photos.length <= 1) return;
        setCurrentPhotoIndex(prev => (prev + 1) % photos.length);
    };

    const currentData = isEditing ? editForm : selectedPin;

    // Fixed: Removed early return that was blocking the entire page render

    return (
        <main className="min-h-screen bg-[#F9F9F5] p-4 md:p-8 relative">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
                    <div>
                        <Link
                            href="/"
                            className="inline-flex items-center text-gray-500 hover:text-sage-green mb-2 transition-colors"
                        >
                            <ArrowLeft size={16} className="mr-1" /> 지도로 돌아가기
                        </Link>
                        <h1 className="text-3xl font-bold text-sage-green flex items-center gap-2">
                            <ImageIcon size={32} />
                            나의 추억 갤러리
                        </h1>
                        <p className="text-gray-500 mt-1">
                            기록된 {pins.length}개의 소중한 순간들
                        </p>
                    </div>
                </header>

                {/* Gallery Grid */}
                {pins.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <ImageIcon size={48} className="mb-4 opacity-50" />
                        <p>아직 저장된 추억이 없습니다.</p>
                        <Link href="/" className="mt-4 px-4 py-2 bg-sage-green text-white rounded-lg hover:bg-[#7A9288] transition-colors">
                            지도에 첫 기록 남기기
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {pins.map((pin) => {
                            // Display logic for thumbnail: prefer photos array first item, then legacy photo
                            const displayPhoto = (pin.photos && pin.photos.length > 0) ? pin.photos[0] : pin.photo;
                            const hasMultiplePhotos = (pin.photos && pin.photos.length > 1);

                            return (
                                <div
                                    key={pin.id}
                                    onClick={() => openModal(pin)}
                                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden border border-gray-100 group hover:-translate-y-1 duration-300 relative"
                                >
                                    {/* Photo Area */}
                                    <div className="aspect-video bg-gray-100 relative overflow-hidden">
                                        {displayPhoto ? (
                                            <img
                                                src={displayPhoto}
                                                alt={pin.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                                                <MapPin size={32} />
                                            </div>
                                        )}
                                        {hasMultiplePhotos && (
                                            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                                                <ImageIcon size={10} />
                                                {pin.photos?.length}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content Area */}
                                    <div className="p-4">
                                        <h3 className="font-bold text-gray-800 mb-2 truncate" title={pin.title}>
                                            {pin.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 line-clamp-3 h-[60px]">
                                            {pin.memo || "메모가 없습니다."}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal Overlay */}
            {selectedPin && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={closeModal}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Image Section (Left/Top) */}
                        <div className="w-full md:w-3/5 bg-gray-100 relative min-h-[300px] md:min-h-full group select-none">
                            {(() => {
                                // Determine current photos to display
                                const photos = currentData?.photos?.length ? currentData.photos : (currentData?.photo ? [currentData.photo] : []);
                                const currentPhoto = photos[currentPhotoIndex];

                                return (
                                    <>
                                        {currentPhoto ? (
                                            <img
                                                src={currentPhoto}
                                                alt={currentData?.title}
                                                className="w-full h-full object-contain bg-black/5"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                                                <MapPin size={48} />
                                                <span>사진 없음</span>
                                            </div>
                                        )}

                                        {/* Carousel Controls */}
                                        {photos.length > 1 && (
                                            <>
                                                <button
                                                    onClick={handlePrevPhoto}
                                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-md text-gray-700 hover:text-sage-green transition-all"
                                                >
                                                    <ArrowLeft size={20} />
                                                </button>
                                                <button
                                                    onClick={handleNextPhoto}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-md text-gray-700 hover:text-sage-green transition-all transform rotate-180"
                                                >
                                                    <ArrowLeft size={20} />
                                                </button>

                                                {/* Dots Indicator */}
                                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                                    {photos.map((_, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={`w-2 h-2 rounded-full transition-all ${idx === currentPhotoIndex ? 'bg-sage-green w-4' : 'bg-gray-300'}`}
                                                        />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </>
                                );
                            })()}

                            {/* Photo Edit Overlay */}
                            {isEditing && (
                                <div className="absolute top-4 right-4 flex flex-col gap-2">
                                    {/* Only show upload button if less than 3 photos */}
                                    {((editForm?.photos?.length || 0) < 3) && (
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="p-3 bg-white hover:bg-sage-green hover:text-white rounded-full transition-colors shadow-lg group-hover:opacity-100 opacity-0 transition-opacity" // Initial opacity 0, show on hover? No, better always visible or handle logic
                                            style={{ opacity: 1 }} // Force visible
                                            title="사진 추가 (최대 3장)"
                                        >
                                            <Upload size={20} />
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handlePhotoUpload}
                                            />
                                        </button>
                                    )}

                                    {/* Delete current photo button */}
                                    {(editForm?.photos && editForm.photos.length > 0) && (
                                        <button
                                            onClick={handleRemoveCurrentPhoto}
                                            className="p-3 bg-white hover:bg-red-500 hover:text-white rounded-full transition-colors shadow-lg"
                                            title="현재 사진 삭제"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Content Section (Right/Bottom) */}
                        <div className="w-full md:w-2/5 p-6 md:p-8 flex flex-col bg-white overflow-y-auto">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex-1 mr-4">
                                    <button
                                        className="flex items-center gap-2 text-sm text-sage-green font-medium mb-1 hover:underline"
                                        title="날짜는 수정할 수 없습니다 (기록일 기준)"
                                    >
                                        <Calendar size={14} />
                                        {currentData?.date}
                                    </button>

                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editForm?.title || ''}
                                            onChange={(e) => setEditForm(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
                                            className="text-2xl font-bold text-gray-800 w-full border-b-2 border-sage-green/50 focus:border-sage-green outline-none bg-transparent px-1 py-0.5"
                                            placeholder="제목 입력"
                                        />
                                    ) : (
                                        <h2 className="text-2xl font-bold text-gray-800">{currentData?.title}</h2>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {isEditing ? (
                                        <>
                                            <button
                                                onClick={handleSaveEdit}
                                                className="p-2 bg-sage-green text-white hover:bg-[#7A9288] rounded-full transition-colors shadow-sm"
                                                title="저장"
                                            >
                                                <Save size={18} />
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
                                                title="취소"
                                            >
                                                <X size={18} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={handleStartEdit}
                                                className="p-2 bg-gray-100 hover:bg-sage-green hover:text-white text-gray-500 rounded-full transition-colors"
                                                title="수정"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => currentData && handleDeletePin(currentData.id)}
                                                className="p-2 bg-gray-100 hover:bg-red-500 hover:text-white text-gray-500 rounded-full transition-colors"
                                                title="삭제"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            <button
                                                onClick={closeModal}
                                                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-colors"
                                                title="닫기"
                                            >
                                                <X size={18} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                {isEditing ? (
                                    <textarea
                                        value={editForm?.memo || ''}
                                        onChange={(e) => setEditForm(prev => prev ? ({ ...prev, memo: e.target.value }) : null)}
                                        className="w-full h-full min-h-[200px] p-3 text-lg text-gray-600 leading-relaxed border border-gray-200 rounded-lg focus:ring-2 focus:ring-sage-green/20 focus:border-sage-green outline-none resize-none bg-gray-50"
                                        placeholder="이곳에 추억을 기록하세요..."
                                    />
                                ) : (
                                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-lg">
                                        <Linkify>{currentData?.memo || "작성된 메모가 없습니다."}</Linkify>
                                    </p>
                                )}
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-100 flex justify-between items-center text-sm text-gray-400">
                                <span>위치: {currentData?.lat.toFixed(4)}, {currentData?.lng.toFixed(4)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
