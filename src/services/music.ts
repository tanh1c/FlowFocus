export interface Music {
    _id: string;
    name: string;
    description: string;
    image: string;
    audioUrl: string;
    author: string;
    isPremium: boolean;
    deleted: boolean;
    createdAt: string;
    updatedAt: string;
    tags: string[];
    type: string;
}

export interface MusicResponse {
    message: string;
    data: Music[];
    statusCode: number;
    success: boolean;
    meta: {
        timestamp: string;
        request_id: string;
        total_record: number;
        total_page: number;
        total_record_in_page: number;
    };
    status: string;
}

export const fetchMusicByType = async (type: string): Promise<Music[]> => {
    try {
        // Use the local API route to avoid CORS issues
        const response = await fetch(`/api/music?type=${type}`);
        if (!response.ok) {
            throw new Error('Failed to fetch music');
        }
        const result: MusicResponse = await response.json();
        return result.data;
    } catch (error) {
        console.error('Error fetching music:', error);
        return [];
    }
};
