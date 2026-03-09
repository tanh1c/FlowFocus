
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'lofi';

    try {
        const response = await fetch(`https://api.beeziee.com/api/v1/client/musics?type=${type}`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`External API responded with status: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error proxying request to music API:', error);
        return NextResponse.json(
            { error: 'Failed to fetch music data' },
            { status: 500 }
        );
    }
}
