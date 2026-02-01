'use client';

import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Map as MapIcon, X, Plus, Trash2, Image as ImageIcon, Crosshair, Camera, Search } from 'lucide-react';
import { Pin } from './types';
import Linkify from './Linkify';
import { compressImage } from './imageCompression';
import { renderToStaticMarkup } from 'react-dom/server';

// Fix for default marker icons in Next.js
const customIcon = L.divIcon({
    className: 'custom-pin-icon',
    html: renderToStaticMarkup(<MapPin size={24} color="#8DA399" fill="#F9F9F5" />),
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
});

const userLocationIcon = L.divIcon({
    className: 'user-location-icon',
    html: renderToStaticMarkup(
        <div className="relative flex items-center justify-center w-6 h-6">
            <span className="absolute w-full h-full rounded-full bg-blue-500 opacity-30 animate-ping"></span>
            <span className="relative w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md"></span>
        </div>
    ),
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

const tempIcon = L.divIcon({
    className: 'temp-pin-icon',
    html: renderToStaticMarkup(<MapPin size={24} color="#FF6B6B" fill="#F9F9F5" />),
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
});

const PIN_ICONS = ["⚠️", "❓", "🔨", "💰", "📦", "🗝️", "❤️", "⭐", "📖", "⏳"];

const getPinIcon = (title: string) => {
    // Check if title starts with any of the defined icons
    const icon = PIN_ICONS.find(emoji => title.startsWith(emoji));

    if (icon) {
        return L.divIcon({
            className: 'custom-emoji-icon',
            html: `<div style="font-size: 30px; line-height: 1; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); transition: transform 0.2s;" class="hover:scale-110 cursor-pointer">${icon}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, -15],
        });
    }
    return customIcon;
};

interface MapComponentProps {
    pins: Pin[];
    onAddPin: (pin: Pin) => void;
    focusedPin: Pin | null;
    onDeletePin?: (id: number) => void;
    flyToLocation?: { lat: number, lng: number, zoom: number } | null;
}

function MapController({ focusedPin, flyToLocation }: { focusedPin: Pin | null, flyToLocation?: { lat: number, lng: number, zoom: number } | null }) {
    const map = useMap();

    useEffect(() => {
        if (focusedPin) {
            map.flyTo([focusedPin.lat, focusedPin.lng], 13, {
                animate: true,
                duration: 1.5,
            });
        }
    }, [focusedPin, map]);

    useEffect(() => {
        if (flyToLocation) {
            map.flyTo([flyToLocation.lat, flyToLocation.lng], flyToLocation.zoom, {
                animate: true,
                duration: 2.0, // A bit slower for long distance
            });
        }
    }, [flyToLocation, map]);

    return null;
}

function MapClickHandler({ onMapClick, onLocate }: { onMapClick: (lat: number, lng: number) => void, onLocate?: (map: L.Map) => void }) {
    const map = useMap();

    useEffect(() => {
        if (onLocate) {
            onLocate(map);
        }
    }, [map, onLocate]);

    useMapEvents({
        click: (e) => {
            onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

// Portal Component
const Portal = ({ children }: { children: React.ReactNode }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted) return null;

    return createPortal(children, document.body);
};


export default function MapComponent({ pins, onAddPin, focusedPin, onDeletePin, flyToLocation }: MapComponentProps) {
    const [tempPin, setTempPin] = useState<{ lat: number; lng: number } | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const [newMemo, setNewMemo] = useState("");
    const [newPhotos, setNewPhotos] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
    const [myLocation, setMyLocation] = useState<{ lat: number, lng: number } | null>(null);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error("Search failed:", error);
            alert("검색 중 오류가 발생했습니다.");
        }
    };

    const handleSelectLocation = (lat: string, lon: string) => {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        mapInstance?.flyTo([latitude, longitude], 13, {
            duration: 1.5
        });

        setSearchResults([]); // Clear results after selection
        // Don't clear query so user knows what they searched, or maybe clear it? Let's keep it for now.
    };

    const handleLocateMe = () => {
        if (!mapInstance) return;

        if (!navigator.geolocation) {
            alert("브라우저가 위치 정보를 지원하지 않습니다.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setMyLocation({ lat: latitude, lng: longitude });
                mapInstance.flyTo([latitude, longitude], 15, {
                    animate: true,
                    duration: 1.5
                });
            },
            () => {
                alert("위치 정보를 가져올 수 없습니다. 권한을 확인해주세요.");
            }
        );
    };

    const handleMapClick = (lat: number, lng: number) => {
        setTempPin({ lat, lng });
        setNewTitle('');
        setNewMemo('');
        setNewPhotos([]);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (newPhotos.length >= 3) {
                alert("사진은 최대 3장까지만 업로드할 수 있습니다.");
                return;
            }

            try {
                const compressed = await compressImage(file);
                setNewPhotos(prev => [...prev, compressed]);
            } catch (error) {
                console.error("Image compression failed:", error);
                alert("이미지 처리 중 오류가 발생했습니다.");
            }
        }
        // Reset input so the same file can be selected again if needed
        if (e.target) e.target.value = '';
    };

    const handleRemovePhoto = (index: number) => {
        setNewPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        if (!tempPin || !newTitle) return;

        const newPin: Pin = {
            id: Date.now(),
            lat: tempPin.lat,
            lng: tempPin.lng,
            title: newTitle,
            memo: newMemo,
            date: new Date().toISOString().split('T')[0],
            photo: newPhotos.length > 0 ? newPhotos[0] : undefined, // Backward compatibility
            photos: newPhotos,
        };

        onAddPin(newPin);
        setTempPin(null);
    };

    return (
        <>
            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg border-4 border-cream-white/50">
                <MapContainer
                    center={[37.5665, 126.9780] as L.LatLngExpression}
                    zoom={3}
                    scrollWheelZoom={true}
                    className="w-full h-full"
                    style={{ background: '#F9F9F5' }}
                >
                    <MapClickHandler onMapClick={handleMapClick} onLocate={setMapInstance} />

                    {/* Location Button */}
                    <div
                        className="leaflet-bottom leaflet-right"
                        style={{ marginBottom: '20px', marginRight: '10px', pointerEvents: 'auto', zIndex: 1000 }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onDoubleClick={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                    >
                        <div className="leaflet-control leaflet-bar">
                            <button
                                onClick={handleLocateMe}
                                className="bg-white p-2 hover:bg-gray-50 text-sage-green shadow-sm flex items-center justify-center w-[34px] h-[34px]"
                                title="내 위치로 이동"
                            >
                                <Crosshair size={20} />
                            </button>
                        </div>
                    </div>

                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        className="map-tiles-desaturated"
                    />

                    {/* User Location Marker */}
                    {myLocation && (
                        <Marker position={[myLocation.lat, myLocation.lng]} icon={userLocationIcon}>
                            <Popup className="sage-popup">
                                <div className="text-center p-1">
                                    <span className="font-bold text-blue-600 text-sm">내 현재 위치</span>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    <MapController focusedPin={focusedPin} flyToLocation={flyToLocation} />

                    {/* Search Bar */}
                    <div
                        className="absolute top-3 left-12 w-[calc(100%-60px)] md:top-4 md:left-[60px] md:w-[300px] z-[1000] transition-all"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onDoubleClick={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                    >
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="장소 검색 (예: 서울역, Paris)"
                                className="w-full pl-10 pr-4 py-2.5 rounded-full shadow-lg border border-gray-200 focus:outline-none focus:border-sage-green focus:ring-2 focus:ring-sage-green/20 text-gray-700 bg-white/95 backdrop-blur-sm transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <button
                                onClick={handleSearch}
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-sage-green transition-colors"
                            >
                                <Search size={20} />
                            </button>
                            {searchQuery && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSearchResults([]);
                                    }}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden max-h-60 overflow-y-auto">
                                {searchResults.map((result, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => handleSelectLocation(result.lat, result.lon)}
                                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none flex items-start gap-3 transition-colors"
                                    >
                                        <MapPin size={16} className="text-sage-green mt-1 flex-shrink-0" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-800">{result.display_name.split(',')[0]}</div>
                                            <div className="text-xs text-gray-500 line-clamp-1">{result.display_name}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>


                    {/* Existing Pins */}
                    {pins.map((pin) => {
                        // Decide which photo to show on map popup thumbnail
                        const displayPhoto = (pin.photos && pin.photos.length > 0) ? pin.photos[0] : pin.photo;

                        return (
                            <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={getPinIcon(pin.title)}>
                                <Popup className="sage-popup">
                                    <div className="p-2 min-w-[200px] max-w-[250px]">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-sage-green text-lg">{pin.title}</h3>
                                            {onDeletePin && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        onDeletePin(pin.id);
                                                    }}
                                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                    title="삭제하기"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-gray-600 text-sm mb-2 break-keep">
                                            <Linkify>{pin.memo}</Linkify>
                                        </p>
                                        {displayPhoto && (
                                            <div className="mb-2 rounded-lg overflow-hidden max-h-[150px] relative">
                                                <img src={displayPhoto} alt="Memory" className="w-full h-full object-cover" />
                                                {(pin.photos && pin.photos.length > 1) && (
                                                    <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                                        +{pin.photos.length - 1}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <div className="text-xs text-gray-400 text-right">{pin.date}</div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}

                    {/* Temporary Pin Marker (Just the icon) */}
                    {tempPin && (
                        <Marker position={[tempPin.lat, tempPin.lng]} icon={tempIcon} />
                    )}
                </MapContainer>
            </div>

            {/* Creation Modal Overlay (Moved to Portal) */}
            {tempPin && (
                <Portal>
                    {/* Backdrop for better focus */}
                    <div className="fixed inset-0 bg-black/20 z-[99999]" style={{ pointerEvents: 'auto' }} onClick={() => setTempPin(null)} />

                    {/* Modal Content */}
                    <div className="fixed left-4 right-4 bottom-6 md:top-1/2 md:left-1/2 md:bottom-auto md:right-auto md:-translate-x-1/2 md:-translate-y-1/2 z-[100000] bg-white rounded-2xl shadow-2xl p-5 border border-gray-100 animate-in slide-in-from-bottom-5 fade-in duration-300">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-gray-800">이곳에 추억 남기기</h3>
                            <button
                                onClick={() => setTempPin(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Icon Selector */}
                        <div className="flex gap-2 mb-2 overflow-x-auto pb-1 scrollbar-hide">
                            {PIN_ICONS.map((icon) => (
                                <button
                                    key={icon}
                                    onClick={() => setNewTitle(prev => icon + " " + prev)}
                                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-sage-green/10 rounded-full text-lg transition-colors border border-gray-100"
                                    title="아이콘 추가"
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>

                        <input
                            type="text"
                            placeholder="제목 (예: 파리에서의 아침)"
                            className="w-full p-2 mb-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-sage-green"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            autoFocus
                        />
                        <textarea
                            placeholder="어떤 기억이 있나요?"
                            className="w-full p-2 mb-2 border border-gray-200 rounded text-sm h-20 resize-none focus:outline-none focus:border-sage-green"
                            value={newMemo}
                            onChange={(e) => setNewMemo(e.target.value)}
                        />

                        {/* Photo Preview Grid */}
                        {newPhotos.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                {newPhotos.map((photo, idx) => (
                                    <div key={idx} className="relative rounded-lg overflow-hidden aspect-square group border border-gray-100">
                                        <img src={photo} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => handleRemovePhoto(idx)}
                                            className="absolute top-0.5 right-0.5 bg-black/50 text-white p-0.5 rounded-full hover:bg-red-500 transition-colors"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {newPhotos.length < 3 && (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="mb-3 p-3 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-sage-green/50 hover:text-sage-green cursor-pointer transition-colors"
                            >
                                <Camera size={20} className="mb-1" />
                                <span className="text-xs">사진 추가하기 ({newPhotos.length}/3)</span>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />

                        <div className="flex gap-2">
                            <button
                                onClick={() => setTempPin(null)}
                                className="flex-1 py-3 text-sm text-gray-500 hover:bg-gray-100 rounded-xl font-medium"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!newTitle}
                                className="flex-1 py-3 text-sm bg-sage-green text-white rounded-xl hover:bg-[#7D9389] disabled:opacity-50 font-bold transition-colors shadow-md"
                            >
                                기록하기
                            </button>
                        </div>
                    </div>
                </Portal>
            )}


            {/* Tooltip Overlay */}

        </>
    );
}
