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
