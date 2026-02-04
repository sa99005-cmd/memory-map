export interface Pin {
    id: number;
    lat: number;
    lng: number;
    title: string;
    memo: string;
    date: string;
    photo?: string;
    photos?: string[];
}

// 피드 게시글 타입 (Pin을 확장)
export interface FeedPost extends Pin {
    locationName?: string;  // 위치 이름 (예: "서울, 대한민국")
    likes?: number;         // 좋아요 수 (향후 확장용)
    tags?: string[];        // 해시태그 (향후 확장용)
}
