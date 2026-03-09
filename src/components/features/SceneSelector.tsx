'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { X, Sun, Heart } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';

export interface Scene {
  _id: string;
  name: string;
  sceneUrl: string;
  thumbnail: string;
  category: string;
  type: 'VIDEO' | 'IMAGE' | 'GIF';
  isPremium: boolean;
  viewCount: number;
  favoriteCount: number;
}

interface SceneSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScene?: (scene: Scene) => void;
  currentScene?: string;
  currentFilter: string;
  onSelectFilter: (filter: string) => void;
  pixelRendering?: 'crisp-edges' | 'pixelated';
  onPixelRenderingChange?: (v: 'crisp-edges' | 'pixelated') => void;
}

export interface Filter {
  name: string;
  value: string;
  previewColor: string;
}

const FILTER_PRESETS: Filter[] = [
  { name: 'Normal', value: 'none', previewColor: '#9ca3af' },
  { name: 'Vivid', value: 'saturate(1.3) contrast(1.1)', previewColor: '#fcd34d' },
  { name: 'Dim', value: 'brightness(0.6) saturate(0.8)', previewColor: '#4b5563' },
];

export const scenesData: Scene[] = [
  {
    "_id": "6908d218cf9c9d8232aeb13a",
    "name": "Living Room",
    "sceneUrl": "https://assets.beeziee.com/scenes/mylivewallpapers-com-Cozy-Cabin-Living-Room-4K.mp4",
    "thumbnail": "https://assets.beeziee.com/thumbnails/mylivewallpapers-com-Cozy-Cabin-Living-Room-4K.png",
    "category": "chill",
    "type": "VIDEO",
    "isPremium": false,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "6908d218cf9c9d8232aeb159",
    "name": "Japanese Fujiwara Tofu",
    "sceneUrl": "https://assets.beeziee.com/scenes/japanese-fujiwara-tofu-store-rainy-day-initial-d-moewalls.com.mp4",
    "thumbnail": "https://assets.beeziee.com/thumbnails/japanese-fujiwara-tofu-store-rainy-day-initial-d-moewalls.com.png",
    "category": "chill",
    "type": "VIDEO",
    "isPremium": false,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "6908d218cf9c9d8232aeb148",
    "name": "We Bare Bears",
    "sceneUrl": "/scenes/mylivewallpapers-com-We-Bare-Bears-4K.mp4",
    "thumbnail": "https://assets.beeziee.com/thumbnails/mylivewallpapers-com-We-Bare-Bears-4K.png",
    "category": "cute",
    "type": "VIDEO",
    "isPremium": false,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "6908d218cf9c9d8232aeb135",
    "name": "Underwater Kitten",
    "sceneUrl": "https://assets.beeziee.com/scenes/mylivewallpapers.com-Underwater-Kitten-4K.mp4",
    "thumbnail": "https://assets.beeziee.com/thumbnails/mylivewallpapers.com-Underwater-Kitten-4K.png",
    "category": "cute",
    "type": "VIDEO",
    "isPremium": false,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "69419b9cb8ef27280925d192",
    "name": "Corgi Dog Samurai",
    "sceneUrl": "https://assets.beeziee.com/scenes/corgi-dog-samurai.mp4",
    "thumbnail": "https://assets.beeziee.com/thumbnails/corgi-dog-samurai.PNG",
    "category": "chill",
    "type": "VIDEO",
    "isPremium": true,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "69419becb8ef27280925d195",
    "name": "Coffee Shop",
    "sceneUrl": "https://assets.beeziee.com/scenes/coffee-shop.mp4",
    "thumbnail": "https://assets.beeziee.com/thumbnails/coffee-shop.PNG",
    "category": "chill",
    "type": "VIDEO",
    "isPremium": true,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "69496d99ba05117ff34d65b7",
    "name": "Cat By The Window",
    "sceneUrl": "https://assets.beeziee.com/scenes/cat-by-the-window.mp4",
    "thumbnail": "https://assets.beeziee.com/thumbnails/cat-by-the-window.png",
    "category": "chill",
    "type": "VIDEO",
    "isPremium": true,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "6961314b19d32e345c5bce73",
    "name": "Night Sky",
    "sceneUrl": "https://assets.beeziee.com/scenes/3d-cartoon-night-sky.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/3d-cartoon-night-sky.avif",
    "category": "chill",
    "type": "IMAGE",
    "isPremium": true,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "6961319719d32e345c5bce74",
    "name": "Botanic Garden",
    "sceneUrl": "https://assets.beeziee.com/scenes/3d-rendering-illustration-botanic-garden.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/3d-rendering-illustration-botanic-garden.avif",
    "category": "chill",
    "type": "IMAGE",
    "isPremium": false,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "696131bb19d32e345c5bce75",
    "name": "Anime Moon",
    "sceneUrl": "https://assets.beeziee.com/scenes/anime-moon-landscape.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/anime-moon-landscape.avif",
    "category": "chill",
    "type": "IMAGE",
    "isPremium": false,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "696131d819d32e345c5bce76",
    "name": "Anime Moon",
    "sceneUrl": "https://assets.beeziee.com/scenes/anime-moon-landscape-2.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/anime-moon-landscape-2.avif",
    "category": "chill",
    "type": "IMAGE",
    "isPremium": false,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "6961320d19d32e345c5bce77",
    "name": "Office Space",
    "sceneUrl": "https://assets.beeziee.com/scenes/beautiful-office-space-cartoon-style-2.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/beautiful-office-space-cartoon-style-2.avif",
    "category": "chill",
    "type": "IMAGE",
    "isPremium": false,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "6961322119d32e345c5bce78",
    "name": "Office Space",
    "sceneUrl": "https://assets.beeziee.com/scenes/beautiful-office-space-cartoon-style.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/beautiful-office-space-cartoon-style.avif",
    "category": "chill",
    "type": "IMAGE",
    "isPremium": false,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "6961332419d32e345c5bce79",
    "name": "City Architecture",
    "sceneUrl": "https://assets.beeziee.com/scenes/city-architecture-landscape-digital-art.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/city-architecture-landscape-digital-art.avif",
    "category": "chill",
    "type": "IMAGE",
    "isPremium": false,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "6961334419d32e345c5bce7a",
    "name": "Cityspace",
    "sceneUrl": "https://assets.beeziee.com/scenes/cityscape-anime-inspired-urban-area.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/cityscape-anime-inspired-urban-area.avif",
    "category": "chill",
    "type": "IMAGE",
    "isPremium": false,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "6961336a19d32e345c5bce7b",
    "name": "Cozy Home",
    "sceneUrl": "https://assets.beeziee.com/scenes/cozy-home-interior-anime-style.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/cozy-home-interior-anime-style.avif",
    "category": "chill",
    "type": "IMAGE",
    "isPremium": true,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "696133bf19d32e345c5bce7c",
    "name": "Urban Landscape",
    "sceneUrl": "https://assets.beeziee.com/scenes/digital-art-with-urban-landscape-architecture.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/digital-art-with-urban-landscape-architecture.avif",
    "category": "chill",
    "type": "IMAGE",
    "isPremium": true,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "696133e319d32e345c5bce7d",
    "name": "Evening",
    "sceneUrl": "https://assets.beeziee.com/scenes/evening.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/evening.avif",
    "category": "chill",
    "type": "IMAGE",
    "isPremium": true,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "6961341419d32e345c5bce7e",
    "name": "Nature Hawaii",
    "sceneUrl": "https://assets.beeziee.com/scenes/nature-landscape-hawaii-with-digital-art-style.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/nature-landscape-hawaii-with-digital-art-style.avif",
    "category": "chill",
    "type": "IMAGE",
    "isPremium": true,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "69637c0ac638c10eee8c62fc",
    "name": "Tokyo City Scape Night Japan",
    "sceneUrl": "https://assets.beeziee.com/scenes/tokyo-cityscape-night-japan.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/tokyo-cityscape-night-japan.avif",
    "category": "chill",
    "type": "IMAGE",
    "isPremium": true,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "69637c5ac638c10eee8c62fd",
    "name": "Pathway Middle Buildings Dark Sky Japan",
    "sceneUrl": "https://assets.beeziee.com/scenes/pathway-middle-buildings-dark-sky-japan.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/pathway-middle-buildings-dark-sky-japan.avif",
    "category": "chill",
    "type": "IMAGE",
    "isPremium": true,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "69637c7ac638c10eee8c62fe",
    "name": "Anime City",
    "sceneUrl": "https://assets.beeziee.com/scenes/illustration-anime-city.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/illustration-anime-city.avif",
    "category": "chill",
    "type": "IMAGE",
    "isPremium": true,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "69637c98c638c10eee8c62ff",
    "name": "River Nature",
    "sceneUrl": "https://assets.beeziee.com/scenes/digital-art-style-river-nature-landscape.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/digital-art-style-river-nature-landscape.avif",
    "category": "chill",
    "type": "IMAGE",
    "isPremium": true,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "69637cb4c638c10eee8c6300",
    "name": "Isolated House",
    "sceneUrl": "https://assets.beeziee.com/scenes/digital-art-isolated-house.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/digital-art-isolated-house.avif",
    "category": "chill",
    "type": "IMAGE",
    "isPremium": true,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "69637ccfc638c10eee8c6301",
    "name": "City Architecture",
    "sceneUrl": "https://assets.beeziee.com/scenes/city-architecture-landscape-digital-art-2.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/city-architecture-landscape-digital-art-2.avif",
    "category": "chill",
    "type": "IMAGE",
    "isPremium": true,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "69637ceec638c10eee8c6302",
    "name": "Office Space",
    "sceneUrl": "https://assets.beeziee.com/scenes/beautiful-office-space-cartoon-style-4.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/beautiful-office-space-cartoon-style-4.avif",
    "category": "chill",
    "type": "IMAGE",
    "isPremium": true,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "69637d08c638c10eee8c6303",
    "name": "Office Space",
    "sceneUrl": "https://assets.beeziee.com/scenes/beautiful-office-space-cartoon-style-3.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/beautiful-office-space-cartoon-style-3.avif",
    "category": "chill",
    "type": "IMAGE",
    "isPremium": true,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "69637d37c638c10eee8c6304",
    "name": "Cozy Home",
    "sceneUrl": "https://assets.beeziee.com/scenes/anime-style-cozy-home-interior-with-furnishings.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/anime-style-cozy-home-interior-with-furnishings.avif",
    "category": "chill",
    "type": "IMAGE",
    "isPremium": true,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "69637d56c638c10eee8c6305",
    "name": "Night Sky",
    "sceneUrl": "https://assets.beeziee.com/scenes/anime-night-sky-illustration.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/anime-night-sky-illustration.avif",
    "category": "chill",
    "type": "IMAGE",
    "isPremium": true,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "69637d71c638c10eee8c6306",
    "name": "Moon Landscape",
    "sceneUrl": "https://assets.beeziee.com/scenes/anime-moon-landscape-3.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/anime-moon-landscape-3.avif",
    "category": "chill",
    "type": "IMAGE",
    "isPremium": true,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "69637d99c638c10eee8c6307",
    "name": "Tokyo Cityscape With Fuji Mountain",
    "sceneUrl": "https://assets.beeziee.com/scenes/aerial-view-tokyo-cityscape-with-fuji-mountain-japan.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/aerial-view-tokyo-cityscape-with-fuji-mountain-japan.avif",
    "category": "chill",
    "type": "IMAGE",
    "isPremium": true,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "69637dd0c638c10eee8c6308",
    "name": "American Village",
    "sceneUrl": "https://assets.beeziee.com/scenes/3d-cartoon-latin-american-village-scenery.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/3d-cartoon-latin-american-village-scenery.avif",
    "category": "chill",
    "type": "IMAGE",
    "isPremium": true,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "6969d8e4f5373372f117a107",
    "name": "Yoga & Chill",
    "sceneUrl": "https://assets.beeziee.com/scenes/still-life-yoga-equipment.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/still-life-yoga-equipment.avif",
    "category": "chill",
    "type": "IMAGE",
    "isPremium": false,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "6969d8e4f5373372f117a10a",
    "name": "Foggy Dark City II",
    "sceneUrl": "https://assets.beeziee.com/scenes/view-urban-dark-city-with-fog.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/view-urban-dark-city-with-fog.avif",
    "category": "dark",
    "type": "IMAGE",
    "isPremium": true,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "6969d8e4f5373372f117a104",
    "name": "Cozy Anime Room",
    "sceneUrl": "https://assets.beeziee.com/scenes/cozy-home-interior-anime-style.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/cozy-home-interior-anime-style.avif",
    "category": "anime",
    "type": "IMAGE",
    "isPremium": false,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "6969d8e4f5373372f117a101",
    "name": "Cozy Anime Home Interior",
    "sceneUrl": "https://assets.beeziee.com/scenes/anime-style-cozy-home-interior-with-furnishings.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/anime-style-cozy-home-interior-with-furnishings.avif",
    "category": "anime",
    "type": "IMAGE",
    "isPremium": false,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "6969d8e4f5373372f117a105",
    "name": "Cyberpunk City",
    "sceneUrl": "https://assets.beeziee.com/scenes/cyberpunk-urban-scenery.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/cyberpunk-urban-scenery.avif",
    "category": "cyberpunk",
    "type": "IMAGE",
    "isPremium": true,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "6969d8e4f5373372f117a109",
    "name": "Foggy Dark City I",
    "sceneUrl": "https://assets.beeziee.com/scenes/view-urban-dark-city-with-fog-1.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/view-urban-dark-city-with-fog-1.avif",
    "category": "dark",
    "type": "IMAGE",
    "isPremium": true,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "6969d8e4f5373372f117a103",
    "name": "Modern Glass Building",
    "sceneUrl": "https://assets.beeziee.com/scenes/beautiful-view-tall-glass-business-building-with-tall-swings-side.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/beautiful-view-tall-glass-business-building-with-tall-swings-side.avif",
    "category": "urban",
    "type": "IMAGE",
    "isPremium": false,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "6969d8e4f5373372f117a102",
    "name": "Anime House Architecture",
    "sceneUrl": "https://assets.beeziee.com/scenes/anime-style-house-architecture.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/anime-style-house-architecture.avif",
    "category": "anime",
    "type": "IMAGE",
    "isPremium": true,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "6969d8e4f5373372f117a108",
    "name": "Urban Red Light",
    "sceneUrl": "https://assets.beeziee.com/scenes/urban-view-with-red-traffic-light.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/urban-view-with-red-traffic-light.avif",
    "category": "urban",
    "type": "IMAGE",
    "isPremium": false,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "696e6122b00567589a636a2e",
    "name": "Cartoon Welcome Door",
    "sceneUrl": "https://assets.beeziee.com/scenes/3d-rendering-cartoon-welcome-door.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/3d-rendering-cartoon-welcome-door.avif",
    "category": "cartoon",
    "type": "IMAGE",
    "isPremium": false,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "696e6122b00567589a636a30",
    "name": "Anime Moon Landscape V",
    "sceneUrl": "https://assets.beeziee.com/scenes/anime-moon-landscape-5.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/anime-moon-landscape-5.avif",
    "category": "anime",
    "type": "IMAGE",
    "isPremium": false,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "696e6122b00567589a636a31",
    "name": "Beautiful Anime Landscape",
    "sceneUrl": "https://assets.beeziee.com/scenes/beautiful-anime-landscape-cartoon-scene.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/beautiful-anime-landscape-cartoon-scene.avif",
    "category": "anime",
    "type": "IMAGE",
    "isPremium": true,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "696e6122b00567589a636a32",
    "name": "Beautiful Sunset Sea",
    "sceneUrl": "https://assets.beeziee.com/scenes/beautiful-sunset-sea.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/beautiful-sunset-sea.avif",
    "category": "nature",
    "type": "IMAGE",
    "isPremium": false,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "696e6122b00567589a636a33",
    "name": "Coastal Sunset Grass",
    "sceneUrl": "https://assets.beeziee.com/scenes/coastal-sunset-scene-with-tall-grass.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/coastal-sunset-scene-with-tall-grass.avif",
    "category": "nature",
    "type": "IMAGE",
    "isPremium": true,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "696e6122b00567589a636a34",
    "name": "Japan Night Street",
    "sceneUrl": "https://assets.beeziee.com/scenes/japan-city-night-with-car-street.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/japan-city-night-with-car-street.avif",
    "category": "urban",
    "type": "IMAGE",
    "isPremium": false,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "696e6122b00567589a636a35",
    "name": "House Near Woods & Water",
    "sceneUrl": "https://assets.beeziee.com/scenes/landscape-house-near-woods-calm-body-water.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/landscape-house-near-woods-calm-body-water.avif",
    "category": "nature",
    "type": "IMAGE",
    "isPremium": true,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "696e6122b00567589a636a36",
    "name": "Urban Street View",
    "sceneUrl": "https://assets.beeziee.com/scenes/urban-view-with-people-street.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/urban-view-with-people-street.avif",
    "category": "urban",
    "type": "IMAGE",
    "isPremium": false,
    "viewCount": 0,
    "favoriteCount": 0
  },
  {
    "_id": "696e6122b00567589a636a37",
    "name": "Green Palm Foliage",
    "sceneUrl": "https://assets.beeziee.com/scenes/view-green-palm-tree-species-with-beautiful-foliage.avif",
    "thumbnail": "https://assets.beeziee.com/scenes/view-green-palm-tree-species-with-beautiful-foliage.avif",
    "category": "nature",
    "type": "IMAGE",
    "isPremium": true,
    "viewCount": 0,
    "favoriteCount": 0
  },
  // ─── Pixel Art GIF Scenes ────────────────────────────────────────────────────
  { _id: 'gif-01', name: 'LiveStreamer', sceneUrl: 'https://github.com/user-attachments/assets/4b2e233b-d247-4076-9850-17e16f9a6862', thumbnail: 'https://github.com/user-attachments/assets/4b2e233b-d247-4076-9850-17e16f9a6862', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-02', name: 'MultiTaskingGuy', sceneUrl: 'https://github.com/user-attachments/assets/eba80995-c43b-4282-9058-cda308b42e67', thumbnail: 'https://github.com/user-attachments/assets/eba80995-c43b-4282-9058-cda308b42e67', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-03', name: 'Autumn Fall', sceneUrl: 'https://github.com/user-attachments/assets/82eb3cb7-5258-41e2-a736-0aeee5b7fd3a', thumbnail: 'https://github.com/user-attachments/assets/82eb3cb7-5258-41e2-a736-0aeee5b7fd3a', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-04', name: 'Mario Coder', sceneUrl: 'https://github.com/user-attachments/assets/db1f70a4-c525-4e6f-b55e-ac8fe4e991b8', thumbnail: 'https://github.com/user-attachments/assets/db1f70a4-c525-4e6f-b55e-ac8fe4e991b8', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-05', name: 'Stock Chart', sceneUrl: 'https://github.com/user-attachments/assets/77748684-4cf2-4eb7-8188-678ffe93674f', thumbnail: 'https://github.com/user-attachments/assets/77748684-4cf2-4eb7-8188-678ffe93674f', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-06', name: 'Productive Fellow', sceneUrl: 'https://github.com/user-attachments/assets/29cf9353-a43a-4750-bcf1-94fb6a17c9bb', thumbnail: 'https://github.com/user-attachments/assets/29cf9353-a43a-4750-bcf1-94fb6a17c9bb', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-07', name: 'Typing Master', sceneUrl: 'https://github.com/user-attachments/assets/f3563df6-be53-4aba-ba97-0066c985e09e', thumbnail: 'https://github.com/user-attachments/assets/f3563df6-be53-4aba-ba97-0066c985e09e', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-08', name: 'Typing Queen', sceneUrl: 'https://github.com/user-attachments/assets/a3dbaa0c-8162-45f0-893f-0b2c300e6b37', thumbnail: 'https://github.com/user-attachments/assets/a3dbaa0c-8162-45f0-893f-0b2c300e6b37', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-09', name: 'Multitasking God', sceneUrl: 'https://github.com/user-attachments/assets/0da1985a-e647-4da0-b593-5cbb42a82864', thumbnail: 'https://github.com/user-attachments/assets/0da1985a-e647-4da0-b593-5cbb42a82864', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-10', name: 'HiTech Navigation', sceneUrl: 'https://github.com/user-attachments/assets/8c2e984e-29ee-4bdd-a991-3e1b2e401f1b', thumbnail: 'https://github.com/user-attachments/assets/8c2e984e-29ee-4bdd-a991-3e1b2e401f1b', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-11', name: 'Witch Coder', sceneUrl: 'https://github.com/user-attachments/assets/f2e5917a-b68e-402e-a9f5-61d1f28dd539', thumbnail: 'https://github.com/user-attachments/assets/f2e5917a-b68e-402e-a9f5-61d1f28dd539', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-12', name: 'Pixel Room 12', sceneUrl: 'https://github.com/user-attachments/assets/d31c35ba-9380-456f-b3d4-033fae26421e', thumbnail: 'https://github.com/user-attachments/assets/d31c35ba-9380-456f-b3d4-033fae26421e', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-13', name: 'Pixel Room 13', sceneUrl: 'https://github.com/user-attachments/assets/f9ee9640-2428-4a16-bea3-320018b8ee93', thumbnail: 'https://github.com/user-attachments/assets/f9ee9640-2428-4a16-bea3-320018b8ee93', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-14', name: 'Pixel Room 14', sceneUrl: 'https://github.com/user-attachments/assets/fefcc40f-b2e2-4663-88ef-ff90d85dff60', thumbnail: 'https://github.com/user-attachments/assets/fefcc40f-b2e2-4663-88ef-ff90d85dff60', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-15', name: 'Snow Man', sceneUrl: 'https://github.com/user-attachments/assets/6bc848d6-c8fd-49e2-881b-d3407aa95d41', thumbnail: 'https://github.com/user-attachments/assets/6bc848d6-c8fd-49e2-881b-d3407aa95d41', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-16', name: 'Pixel Room 16', sceneUrl: 'https://github.com/user-attachments/assets/df631917-e94a-4ca2-be80-0e64f774411a', thumbnail: 'https://github.com/user-attachments/assets/df631917-e94a-4ca2-be80-0e64f774411a', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-17', name: 'Pixel Room 17', sceneUrl: 'https://github.com/user-attachments/assets/b67b134f-d988-4807-b61e-666b779a321b', thumbnail: 'https://github.com/user-attachments/assets/b67b134f-d988-4807-b61e-666b779a321b', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-18', name: 'Relaxing Robo', sceneUrl: 'https://github.com/user-attachments/assets/dc7c289a-5913-4da1-9d91-3800c5adb2be', thumbnail: 'https://github.com/user-attachments/assets/dc7c289a-5913-4da1-9d91-3800c5adb2be', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-19', name: 'Abandoned Life', sceneUrl: 'https://github.com/user-attachments/assets/990e247d-43ff-4aa0-9e03-656407581558', thumbnail: 'https://github.com/user-attachments/assets/990e247d-43ff-4aa0-9e03-656407581558', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-20', name: 'Pixel Room 20', sceneUrl: 'https://github.com/user-attachments/assets/7bb05f47-9de9-4442-9499-db0cf9e75585', thumbnail: 'https://github.com/user-attachments/assets/7bb05f47-9de9-4442-9499-db0cf9e75585', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-21', name: 'Pixel Room 21', sceneUrl: 'https://github.com/user-attachments/assets/03557315-3a10-4bfd-887a-e4f982e0e61d', thumbnail: 'https://github.com/user-attachments/assets/03557315-3a10-4bfd-887a-e4f982e0e61d', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-22', name: 'Pixel Room 22', sceneUrl: 'https://github.com/user-attachments/assets/7884a2ec-5cb2-4ed0-ae38-91071b8c2357', thumbnail: 'https://github.com/user-attachments/assets/7884a2ec-5cb2-4ed0-ae38-91071b8c2357', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-23', name: 'Pixel Room 23', sceneUrl: 'https://github.com/user-attachments/assets/29d95133-e595-483e-b354-4eca0332f27a', thumbnail: 'https://github.com/user-attachments/assets/29d95133-e595-483e-b354-4eca0332f27a', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-24', name: 'Pixel Room 24', sceneUrl: 'https://github.com/user-attachments/assets/5ae67440-3cd6-4183-b803-693dc42c71ec', thumbnail: 'https://github.com/user-attachments/assets/5ae67440-3cd6-4183-b803-693dc42c71ec', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-25', name: 'Pixel Room 25', sceneUrl: 'https://github.com/user-attachments/assets/021eb644-df00-4f32-af39-53187c953d71', thumbnail: 'https://github.com/user-attachments/assets/021eb644-df00-4f32-af39-53187c953d71', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-26', name: 'Pixel Room 26', sceneUrl: 'https://github.com/user-attachments/assets/a7541284-fde4-4acb-9ac2-f95ba078cd60', thumbnail: 'https://github.com/user-attachments/assets/a7541284-fde4-4acb-9ac2-f95ba078cd60', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-27', name: 'Midnight Owl', sceneUrl: 'https://github.com/user-attachments/assets/a7605427-fa69-416f-85ec-955ea51490c1', thumbnail: 'https://github.com/user-attachments/assets/a7605427-fa69-416f-85ec-955ea51490c1', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-28', name: 'River Rail Bridge', sceneUrl: 'https://github.com/user-attachments/assets/81246bf0-4911-430b-b71e-55a5d0c8b739', thumbnail: 'https://github.com/user-attachments/assets/81246bf0-4911-430b-b71e-55a5d0c8b739', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-29', name: 'Pixel Room 29', sceneUrl: 'https://github.com/user-attachments/assets/1cf2b733-d498-4228-8a8d-d7f3e9a3bacd', thumbnail: 'https://github.com/user-attachments/assets/1cf2b733-d498-4228-8a8d-d7f3e9a3bacd', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-30', name: 'Pixel Room 30', sceneUrl: 'https://github.com/user-attachments/assets/b78eb541-830d-483e-aa67-d2153e9ea25f', thumbnail: 'https://github.com/user-attachments/assets/b78eb541-830d-483e-aa67-d2153e9ea25f', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-31', name: 'Pixel Room 31', sceneUrl: 'https://github.com/user-attachments/assets/8468d735-f960-4e94-9908-15e784481fd1', thumbnail: 'https://github.com/user-attachments/assets/8468d735-f960-4e94-9908-15e784481fd1', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-32', name: 'Pixel Room 32', sceneUrl: 'https://github.com/user-attachments/assets/225d5096-294a-452d-849e-78053485ee6b', thumbnail: 'https://github.com/user-attachments/assets/225d5096-294a-452d-849e-78053485ee6b', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-33', name: 'Pixel Room 33', sceneUrl: 'https://github.com/user-attachments/assets/62241bd7-4afc-42d4-b4ba-6f6c23a22cc7', thumbnail: 'https://github.com/user-attachments/assets/62241bd7-4afc-42d4-b4ba-6f6c23a22cc7', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-34', name: 'Pixel Room 34', sceneUrl: 'https://github.com/user-attachments/assets/4aab6266-857e-4228-b35f-87d3a0715873', thumbnail: 'https://github.com/user-attachments/assets/4aab6266-857e-4228-b35f-87d3a0715873', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-35', name: 'Blade Runner 2049', sceneUrl: 'https://github.com/user-attachments/assets/e3b5e1fe-0b4c-47d6-b21f-1fe4d2023556', thumbnail: 'https://github.com/user-attachments/assets/e3b5e1fe-0b4c-47d6-b21f-1fe4d2023556', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-36', name: 'Pixel Room 36', sceneUrl: 'https://github.com/user-attachments/assets/cc2ef335-8ecb-4510-8962-adc03ac2821b', thumbnail: 'https://github.com/user-attachments/assets/cc2ef335-8ecb-4510-8962-adc03ac2821b', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-37', name: 'Pixel Room 37', sceneUrl: 'https://github.com/user-attachments/assets/2cdc8ffd-e421-4a90-af50-36467aaa6bad', thumbnail: 'https://github.com/user-attachments/assets/2cdc8ffd-e421-4a90-af50-36467aaa6bad', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
  { _id: 'gif-40', name: 'Pixel Room 40', sceneUrl: 'https://github.com/user-attachments/assets/4d90ab2e-a862-4020-8fcb-bb9d3981310a', thumbnail: 'https://github.com/user-attachments/assets/4d90ab2e-a862-4020-8fcb-bb9d3981310a', category: 'pixel', type: 'GIF', isPremium: false, viewCount: 0, favoriteCount: 0 },
];

export function SceneSelector({
  isOpen,
  onClose,
  onSelectScene,
  currentScene,
  currentFilter,
  onSelectFilter,
  pixelRendering = 'crisp-edges',
  onPixelRenderingChange,
}: SceneSelectorProps) {
  const { toggleFavoriteScene, isFavoriteScene, state: appState } = useApp();
  const glassMode = appState.settings.glassMode;
  const [activeTab, setActiveTab] = useState<'static' | 'live' | 'pixel'>('static');
  /* Dragging Logic */
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const scenes = activeTab === 'static'
    ? scenesData.filter(s => s.type === 'IMAGE')
    : activeTab === 'pixel'
      ? scenesData.filter(s => s.type === 'GIF')
      : scenesData.filter(s => s.type === 'VIDEO');

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return;

      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;

      // Direct DOM update for performance
      panelRef.current.style.left = `${newX}px`;
      panelRef.current.style.top = `${newY}px`;
      panelRef.current.style.transform = 'none';

      dragStartPos.current = { x: newX, y: newY };
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (dragStartPos.current) {
        setPos(dragStartPos.current);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!panelRef.current) return;

    // Prevent dragging if clicking on a button or interactive element
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button') || target.closest('[role="slider"]')) return;

    const rect = panelRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    // Initialize drag start pos
    dragStartPos.current = { x: rect.left, y: rect.top };

    setIsDragging(true);
  };

  return (
    <div
      ref={panelRef}
      className={cn(
        'glass-card fixed z-45 flex flex-col rounded-3xl overflow-hidden',
        'h-[70vh] max-h-[34rem] w-[19rem]',
        isDragging ? 'shadow-[0_20px_50px_rgba(0,0,0,0.5)] cursor-grabbing' : 'shadow-2xl',
        !isDragging && 'transition-opacity duration-300',
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      )}
      style={
        pos
          ? { left: pos.x, top: pos.y, transform: 'none' }
          : { left: 'calc(5% + 4.5rem)', top: '50%', transform: 'translateY(-50%)' }
      }
    >
      {/* macOS Title Bar */}
      <div
        className="flex items-center px-4 py-3 border-b border-white/10 shrink-0 relative bg-white/[0.02] cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-1.5 absolute left-4 z-10">
          <button onClick={onClose} onMouseDown={(e) => e.stopPropagation()} className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff5f56]/80 transition-colors shadow-sm" />
          <button onClick={onClose} onMouseDown={(e) => e.stopPropagation()} className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#ffbd2e]/80 transition-colors shadow-sm" />
          <button onMouseDown={(e) => e.stopPropagation()} className="w-3 h-3 rounded-full bg-[#27c93f] hover:bg-[#27c93f]/80 transition-colors shadow-sm" />
        </div>
        <div className="w-full text-center pointer-events-none select-none">
          <h2 className="text-white/90 text-[13px] font-semibold tracking-wide">Scenes</h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 p-4 flex-1 overflow-hidden">

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 p-1 bg-black/40 rounded-2xl border border-white/5 relative z-10 mt-1">
          <button
            onClick={() => setActiveTab('static')}
            className={cn(
              'px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300',
              activeTab === 'static'
                ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            )}
          >
            Static
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={cn(
              'px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300',
              activeTab === 'live'
                ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            )}
          >
            Live
          </button>
          <button
            onClick={() => setActiveTab('pixel')}
            className={cn(
              'px-3 py-2.5 text-[13px] font-semibold rounded-xl transition-all duration-300',
              activeTab === 'pixel'
                ? 'bg-violet-500/20 text-violet-300 shadow-sm ring-1 ring-violet-500/30'
                : 'text-white/40 hover:text-violet-300 hover:bg-white/5'
            )}
          >
            Pixel
          </button>
        </div>

        {/* Filter Presets */}
        <div className="flex bg-black/40 rounded-xl border border-white/5 relative z-10 w-full overflow-hidden mt-2 p-1 gap-1">
          {FILTER_PRESETS.map((filter) => (
            <button
              key={filter.name}
              onClick={() => onSelectFilter(filter.value)}
              className={cn(
                "flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300",
                currentFilter === filter.value
                  ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              {filter.name}
            </button>
          ))}
          {/* Pixel rendering toggle — only in pixel tab */}
          {activeTab === 'pixel' && (
            <button
              onClick={() => onPixelRenderingChange?.(pixelRendering === 'pixelated' ? 'crisp-edges' : 'pixelated')}
              className={cn(
                "flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300",
                pixelRendering === 'pixelated'
                  ? "bg-violet-500/20 text-violet-300 shadow-sm ring-1 ring-violet-500/30"
                  : "text-white/40 hover:text-violet-300 hover:bg-white/5"
              )}
              title="Toggle crisp pixel rendering"
            >
              Sharp
            </button>
          )}
        </div>



        {/* Scene List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] relative z-10 mt-2">
          {scenes.length > 0 ? (
            scenes.map((scene) => (
              <button
                key={scene._id}
                onClick={() => onSelectScene?.(scene)}
                className={cn(
                  'group relative w-full aspect-video rounded-xl overflow-hidden transition-all duration-300',
                  'border',
                  currentScene === scene.sceneUrl
                    ? 'border-primary shadow-[0_0_20px_rgba(52,211,153,0.2)] ring-1 ring-primary/50'
                    : 'border-white/10 hover:border-white/30 hover:shadow-lg hover:scale-[1.01]'
                )}
              >
                {scene.type === 'GIF' ? (
                  <img
                    src={scene.thumbnail}
                    alt={scene.name}
                    className={cn(
                      'absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out',
                      'group-hover:scale-105'
                    )}
                    style={{ imageRendering: pixelRendering }}
                  />
                ) : (
                  <Image
                    src={scene.thumbnail}
                    alt={scene.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 300px"
                    className={cn(
                      'object-cover transition-transform duration-700 ease-out',
                      'group-hover:scale-110'
                    )}
                  />
                )}
                <div className={cn(
                  'absolute inset-0 transition-opacity duration-300',
                  currentScene === scene.sceneUrl
                    ? 'bg-black/10'
                    : 'bg-black/20 group-hover:bg-black/10'
                )} />

                {/* Tag for Premium/Video */}
                <div className="absolute top-2 right-2 flex gap-2">
                  {scene.isPremium && (
                    <span className="px-1.5 py-0.5 bg-amber-500/80 backdrop-blur-md rounded text-[10px] font-bold text-black uppercase">
                      Pro
                    </span>
                  )}
                </div>

                {/* Favorite Button */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); toggleFavoriteScene(scene._id); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); toggleFavoriteScene(scene._id); } }}
                  className="absolute top-2 left-2 p-1.5 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100 z-10"
                >
                  <Heart size={14} className={cn("transition-colors", isFavoriteScene(scene._id) ? "fill-red-400 text-red-400" : "text-white/60")} />
                </div>

                {/* Content Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      'block text-sm font-bold tracking-wide transition-colors text-left',
                      currentScene === scene.sceneUrl ? 'text-primary' : 'text-white'
                    )}>
                      {scene.name}
                    </span>
                    {currentScene === scene.sceneUrl && (
                      <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse" />
                    )}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-white/30 gap-3 border border-dashed border-white/10 rounded-2xl bg-white/5 mx-1">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                {/* Fallback Icon */}
                <div className="w-5 h-5 border-2 border-white/20 border-dashed rounded-full animate-spin-slow" />
              </div>
              <span className="text-xs font-medium uppercase tracking-wider">No scenes found</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
