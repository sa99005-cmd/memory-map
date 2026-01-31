import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'pins.json');

// Helper to ensure data directory exists
const ensureDataDir = () => {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

export async function GET() {
    try {
        ensureDataDir();
        if (!fs.existsSync(DATA_FILE_PATH)) {
            return NextResponse.json([]);
        }
        const fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
        const data = JSON.parse(fileContent || '[]');
        return NextResponse.json(data);
    } catch (error) {
        console.error("Failed to read pins data:", error);
        return NextResponse.json({ error: "Failed to read data" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        ensureDataDir();
        const body = await request.json();
        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(body, null, 2), 'utf-8');
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to save pins data:", error);
        return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
    }
}
