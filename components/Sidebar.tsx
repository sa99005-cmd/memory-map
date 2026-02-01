import { Pin } from './types';
import { MapPin, Calendar, Search, Trash2, Plane, Download, Upload } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';

interface SidebarProps {
    pins: Pin[];
    onPinClick: (pin: Pin) => void;
    onDeletePin: (id: number) => void;

    onCountryClick: (lat: number, lng: number, zoom: number) => void;
    onImportData: (data: Pin[]) => void;
}

const RECOMMENDED_COUNTRIES = [
    { name: '대한민국', lat: 35.9078, lng: 127.7669, zoom: 7 },
    { name: '프랑스', lat: 46.2276, lng: 2.2137, zoom: 6 },
    { name: '일본', lat: 36.2048, lng: 138.2529, zoom: 5 },
    { name: '미국', lat: 37.0902, lng: -95.7129, zoom: 4 },
    { name: '호주', lat: -25.2744, lng: 133.7751, zoom: 4 },
];

export default function Sidebar({ pins, onPinClick, onDeletePin, onCountryClick, onImportData }: SidebarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sort pins by date (newest first)
    const sortedPins = [...pins].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const handleBackup = () => {
        const dataStr = JSON.stringify(pins, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `memory-map-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleRestoreClick = () => {
        if (confirm("데이터를 복원하면 현재 기록에 추가/덮어쓰기 됩니다. 진행하시겠습니까?")) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target?.result as string);
                if (Array.isArray(parsed)) {
                    onImportData(parsed);
                    alert("데이터가 성공적으로 복원되었습니다!");
                } else {
                    alert("올바르지 않은 백업 파일입니다.");
                }
            } catch (err) {
                alert("파일을 읽는 중 오류가 발생했습니다.");
            }
        };
        reader.readAsText(file);
        if (e.target) e.target.value = '';
    };

    return (
        <div className="w-full md:w-80 h-[550px] md:h-full bg-white md:rounded-2xl rounded-t-2xl shadow-lg flex flex-col border border-gray-100/50 overflow-hidden">
            {/* Header */}
            <div className="p-5 bg-sage-green text-cream-white flex items-center justify-between shadow-sm">
                <h2 className="font-bold text-lg flex items-center gap-2">
                    <MapPin size={20} className="text-cream-white" />
                    추억 보관함
                </h2>
                <div className="flex items-center gap-2">
                    <Link
                        href="/library"
                        title="갤러리 모드로 보기"
                        className="p-1.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors flex items-center justify-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-grid-2x2">
                            <rect width="18" height="18" x="3" y="3" rx="2" />
                            <path d="M3 12h18" />
                            <path d="M12 3v18" />
                        </svg>
                    </Link>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                        {pins.length}
                    </span>
                </div>
            </div>

            {/* Recommended Countries */}
            <div className="p-3 border-b border-gray-100">
                <h3 className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">
                    <Plane size={12} /> 추천 여행지
                </h3>
                <div className="flex flex-wrap gap-2">
                    {RECOMMENDED_COUNTRIES.map((country) => (
                        <button
                            key={country.name}
                            onClick={() => onCountryClick(country.lat, country.lng, country.zoom)}
                            className="text-xs px-3 py-1.5 bg-gray-50 hover:bg-sage-green hover:text-white text-gray-600 rounded-full transition-colors border border-gray-200"
                        >
                            {country.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-gray-100">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="기록 검색..."
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-green/50 transition-all text-gray-700"
                    />
                </div>
            </div>

            {/* Pin List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {sortedPins.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm">
                        <p className="mb-2">아직 기록된 추억이 없어요.</p>
                        <p>지도에 핀을 꽂아보세요!</p>
                    </div>
                ) : (
                    sortedPins.map((pin) => (
                        <div
                            key={pin.id}
                            onClick={() => onPinClick(pin)}
                            className="group p-4 rounded-xl bg-white border border-gray-100 hover:border-sage-green/50 hover:shadow-md cursor-pointer transition-all duration-200 relative"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-gray-800 group-hover:text-sage-green transition-colors flex-1 pr-6">
                                    {pin.title}
                                </h3>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        onDeletePin(pin.id);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 absolute top-3 right-3 z-20"
                                    title="삭제하기"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                {pin.memo}
                            </p>
                            {pin.photo && (
                                <div className="mb-3 rounded-lg overflow-hidden h-32 w-full">
                                    <img src={pin.photo} alt="Attached memory" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Calendar size={12} />
                                {pin.date}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Backup/Restore Footer */}
            <div className="p-3 border-t border-gray-100 bg-gray-50 flex gap-2">
                <button
                    onClick={handleBackup}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-sage-green hover:text-white hover:border-transparent transition-all shadow-sm"
                    title="데이터를 파일로 저장"
                >
                    <Download size={14} />
                    백업 저장
                </button>
                <button
                    onClick={handleRestoreClick}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-sage-green hover:text-white hover:border-transparent transition-all shadow-sm"
                    title="저장된 파일 불러오기"
                >
                    <Upload size={14} />
                    복원하기
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".json"
                    onChange={handleFileChange}
                />
            </div>
        </div>
    );
}
