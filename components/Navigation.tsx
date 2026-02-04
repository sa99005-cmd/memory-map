'use client';

import { Home, Map, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavigationProps {
    onCreatePost?: () => void;
}

export default function Navigation({ onCreatePost }: NavigationProps) {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg md:relative md:border-t-0 md:border-b md:shadow-none">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-around md:justify-start md:gap-8 h-16">
                    {/* 피드 탭 */}
                    <Link
                        href="/"
                        className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-4 py-2 rounded-lg transition-all ${pathname === '/'
                                ? 'text-sage-green font-bold'
                                : 'text-gray-500 hover:text-sage-green'
                            }`}
                    >
                        <Home size={24} />
                        <span className="text-xs md:text-base">피드</span>
                    </Link>

                    {/* 지도 탭 */}
                    <Link
                        href="/map"
                        className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-4 py-2 rounded-lg transition-all ${pathname === '/map'
                                ? 'text-sage-green font-bold'
                                : 'text-gray-500 hover:text-sage-green'
                            }`}
                    >
                        <Map size={24} />
                        <span className="text-xs md:text-base">지도</span>
                    </Link>

                    {/* 게시글 작성 버튼 */}
                    {onCreatePost && (
                        <button
                            onClick={onCreatePost}
                            className="flex flex-col md:flex-row items-center gap-1 md:gap-2 px-4 py-2 rounded-lg text-sage-green hover:bg-sage-green hover:text-white transition-all font-medium"
                        >
                            <PlusCircle size={24} />
                            <span className="text-xs md:text-base">작성</span>
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}
