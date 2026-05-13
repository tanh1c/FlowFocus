'use client';

import { useState, useEffect, useRef } from 'react';
import { Info, Settings2, RotateCcw, ChevronLeft, Globe, Shuffle, Coins, Heart, Utensils, Gift, PackageOpen, Apple, Sparkles, X, Backpack, ClipboardCheck } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

// ─── Pet Definitions ─────────────────────────────────────────────────────────
// skins: all available skin names found in /public/pets/<type>/
interface PetConfig {
    skins: string[];
    size: number;
    speed: number;
    actions: string[];
    iconSize?: number;
    bottomShift?: number;
    skinScales?: Record<string, number>;
}

const PET_DEFS = {
    cat: { skins: ['cat'], size: 70, speed: 1.1, actions: ['idle', 'walk', 'run'], iconSize: 62, bottomShift: 0.26 },
    dog: { skins: ['akita', 'black', 'brown', 'red', 'white'], size: 44, speed: 0.8, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball', 'lie'] },
    fox: { skins: ['red', 'white'], size: 44, speed: 1.2, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball', 'lie'] },
    panda: { skins: ['black', 'brown'], size: 48, speed: 0.5, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball', 'lie'] },
    crab: { skins: ['red'], size: 40, speed: 0.6, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball'] },
    clippy: { skins: ['black', 'brown', 'green', 'yellow'], size: 40, speed: 1.0, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball'] },
    cockatiel: { skins: ['brown', 'gray'], size: 40, speed: 1.5, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball'] },
    chicken: { skins: ['white'], size: 40, speed: 1.0, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball'] },
    deno: { skins: ['green'], size: 40, speed: 1.1, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball'] },
    horse: { skins: ['black', 'brown', 'magical', 'paint_beige', 'paint_black', 'paint_brown', 'socks_beige', 'socks_black', 'socks_brown', 'warrior', 'white'], size: 50, speed: 1.6, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball', 'stand'] },
    mod: { skins: ['purple'], size: 40, speed: 1.0, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball'] },
    morph: { skins: ['purple'], size: 40, speed: 0.9, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball'] },
    rat: { skins: ['brown', 'gray', 'white'], size: 40, speed: 1.3, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball'] },
    rocky: { skins: ['gray'], size: 40, speed: 0.7, actions: ['idle', 'walk', 'run', 'swipe'] },
    'rubber-duck': { skins: ['yellow'], size: 40, speed: 0.8, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball'] },
    skeleton: { skins: ['blue', 'brown', 'green', 'orange', 'pink', 'purple', 'red', 'warrior', 'white', 'yellow'], size: 40, speed: 1.0, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball', 'stand'] },
    snail: { skins: ['brown'], size: 36, speed: 0.2, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball'] },
    snake: { skins: ['green'], size: 40, speed: 0.6, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball'] },
    totoro: { skins: ['gray'], size: 56, speed: 0.5, actions: ['idle', 'walk', 'lie'] },
    turtle: { skins: ['green', 'orange'], size: 44, speed: 0.3, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball', 'lie'] },
    zappy: { skins: ['yellow'], size: 40, speed: 1.4, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball'] },
    tanjiro: { skins: ['tanjiro'], size: 52, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 42 },
    nezuko: { skins: ['midouzi'], size: 52, speed: 1.15, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 42 },
    shinobu: { skins: ['shinobu'], size: 52, speed: 1.25, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 42 },
    akaza: { skins: ['akaza'], size: 54, speed: 1.3, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 44 },
    ayaka: { skins: ['ayaka'], size: 52, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 42 },
    'furina-genshin': { skins: ['furina-genshin'], size: 52, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 42 },
    furina: { skins: ['furina'], size: 52, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 42 },
    'hilichurl-qiuqiuren': { skins: ['hilichurl-qiuqiuren'], size: 52, speed: 1.15, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 42 },
    'hu-tao': { skins: ['hu-tao'], size: 52, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 42 },
    'hu-tao-pet': { skins: ['hu-tao-pet'], size: 52, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 42 },
    hutao: { skins: ['hutao'], size: 52, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 42 },
    keqing: { skins: ['keqing'], size: 52, speed: 1.25, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 42 },
    klee: { skins: ['klee'], size: 50, speed: 1.15, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    lumine: { skins: ['lumine'], size: 52, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 42 },
    nahida: { skins: ['nahida'], size: 50, speed: 1.15, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    paimon: { skins: ['paimon'], size: 48, speed: 1.25, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'rich-paimon': { skins: ['rich-paimon'], size: 48, speed: 1.25, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'sandrone-marionette': { skins: ['sandrone-marionette'], size: 52, speed: 1.15, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 42 },
    'shogun-dango': { skins: ['shogun-dango'], size: 52, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 42 },
    'witch-klee': { skins: ['witch-klee'], size: 50, speed: 1.15, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    yoimiya: { skins: ['yoimiya'], size: 52, speed: 1.25, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 42 },
    'arona-v1': { skins: ['arona-v1'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'atsuko-maid': { skins: ['atsuko-maid'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    frieren: { skins: ['frieren'], size: 52, speed: 1.15, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 42 },
    makima: { skins: ['makima'], size: 52, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 42 },
    'makima-the-control-devil': { skins: ['makima-the-control-devil'], size: 52, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 42 },
    'miko-serika': { skins: ['miko-serika'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    plana: { skins: ['plana'], size: 50, speed: 1.15, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    powerpet: { skins: ['powerpet'], size: 52, speed: 1.25, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 42 },
    reze: { skins: ['reze'], size: 52, speed: 1.25, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 42 },
    shiroko: { skins: ['shiroko'], size: 50, speed: 1.25, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    yuuka: { skins: ['yuuka'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'blood-oath-asuna': { skins: ['blood-oath-asuna'], size: 52, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 42 },
    'broom-witch': { skins: ['broom-witch'], size: 52, speed: 1.15, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 42 },
    chopper: { skins: ['chopper'], size: 48, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'chu-totoro': { skins: ['chu-totoro'], size: 50, speed: 1.15, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    deku: { skins: ['deku'], size: 52, speed: 1.25, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 42 },
    gaara: { skins: ['gaara'], size: 52, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 42 },
    'gojo-satoru': { skins: ['gojo-satoru'], size: 54, speed: 1.25, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 44 },
    himiko: { skins: ['himiko'], size: 52, speed: 1.25, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 42 },
    itachi: { skins: ['itachi'], size: 52, speed: 1.25, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 42 },
    'kid-goku-classic-actions': { skins: ['kid-goku-classic-actions'], size: 50, speed: 1.3, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    kirito: { skins: ['kirito'], size: 52, speed: 1.25, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 42 },
    'luffy-dressrosa-gear5': { skins: ['luffy-dressrosa-gear5'], size: 52, speed: 1.3, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 42 },
    'luffy-gear-5': { skins: ['luffy-gear-5'], size: 52, speed: 1.3, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 42 },
    merry: { skins: ['merry'], size: 50, speed: 1.15, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    nimbus: { skins: ['nimbus'], size: 50, speed: 1.25, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'ninja-naru': { skins: ['ninja-naru'], size: 52, speed: 1.3, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 42 },
    sukuna: { skins: ['sukuna'], size: 54, speed: 1.3, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 44 },
    'tiny-luffy': { skins: ['tiny-luffy'], size: 50, speed: 1.25, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'undine-asuna': { skins: ['undine-asuna'], size: 52, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 42 },
    'yuji-itadori': { skins: ['yuji-itadori'], size: 52, speed: 1.3, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 42 },
    'yuuki-asuna': { skins: ['yuuki-asuna'], size: 52, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 42 },
    aladin: { skins: ['aladin'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'albedo-real-comic': { skins: ['albedo-real-comic'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'alien-x-pet': { skins: ['alien-x-pet'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    anya: { skins: ['anya'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    apupepe: { skins: ['apupepe'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'artoria-classic': { skins: ['artoria-classic'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    asterix: { skins: ['asterix'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    azuma: { skins: ['azuma'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'barbatos-rex': { skins: ['barbatos-rex'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'builder-pepe': { skins: ['builder-pepe'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    chef: { skins: ['chef'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    chispa: { skins: ['chispa'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    clarry: { skins: ['clarry'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'claw-d': { skins: ['claw-d'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    conan: { skins: ['conan'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'crazy-frog': { skins: ['crazy-frog'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'crimson-angel': { skins: ['crimson-angel'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'custom-pet-18397bfb': { skins: ['custom-pet-18397bfb'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    dario: { skins: ['dario'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'dark-stewie': { skins: ['dark-stewie'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    diana: { skins: ['diana'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'dictator-mbappe': { skins: ['dictator-mbappe'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    dobby: { skins: ['dobby'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'dudu-bubu': { skins: ['dudu-bubu'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    endminguga: { skins: ['endminguga'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    epstein: { skins: ['epstein'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    eren: { skins: ['eren'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    feixue: { skins: ['feixue'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'freedom-mecha': { skins: ['freedom-mecha'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    fu: { skins: ['fu'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    gopher: { skins: ['gopher'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'grogu-jedi': { skins: ['grogu-jedi'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'grogu-kid': { skins: ['grogu-kid'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    gutsy: { skins: ['gutsy'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    hanabi: { skins: ['hanabi'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'home-lander': { skins: ['home-lander'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    hornet: { skins: ['hornet'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'jack-the-drunk': { skins: ['jack-the-drunk'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'jin-woo': { skins: ['jin-woo'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    jiyi: { skins: ['jiyi'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'kdb-city': { skins: ['kdb-city'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'kia-mhalifa': { skins: ['kia-mhalifa'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    kingcr: { skins: ['kingcr'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    kirby: { skins: ['kirby'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    kratos: { skins: ['kratos'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    labubu: { skins: ['labubu'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'liuying-swimsuit': { skins: ['liuying-swimsuit'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'mini-devil': { skins: ['mini-devil'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'mini-sama': { skins: ['mini-sama'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'miss-minute': { skins: ['miss-minute'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'money-crab': { skins: ['money-crab'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'moon-duo': { skins: ['moon-duo'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'mr-bean': { skins: ['mr-bean'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    muskie: { skins: ['muskie'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'nezha-kid': { skins: ['nezha-kid'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    noa: { skins: ['noa'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'palantir-patrick': { skins: ['palantir-patrick'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    patch: { skins: ['patch'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'pet-reference-robot': { skins: ['pet-reference-robot'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'r2-vader': { skins: ['r2-vader'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    rick: { skins: ['rick'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'savage-codex-hacker': { skins: ['savage-codex-hacker'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    senku: { skins: ['senku'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'shou-er-jiang': { skins: ['shou-er-jiang'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'sonic-v2': { skins: ['sonic-v2'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    sparklet: { skins: ['sparklet'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'spyfam-yor': { skins: ['spyfam-yor'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    starjotaro: { skins: ['starjotaro'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'sullyoon-meov': { skins: ['sullyoon-meov'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'sun-wukong': { skins: ['sun-wukong'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    teemo: { skins: ['teemo'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'the-knight': { skins: ['the-knight'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    trump: { skins: ['trump'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    tuxterm: { skins: ['tuxterm'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    ultramarine: { skins: ['ultramarine'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    umaru: { skins: ['umaru'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    usagi: { skins: ['usagi'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    violet: { skins: ['violet'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    'wojak-pet': { skins: ['wojak-pet'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    xiaoba: { skins: ['xiaoba'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    xxxtentacion: { skins: ['xxxtentacion'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
    zhenxun: { skins: ['zhenxun'], size: 50, speed: 1.2, actions: ['idle', 'run', 'waiting', 'waving', 'jumping', 'review', 'failed'], iconSize: 40 },
};

// Runtime lookup helper that returns the full PetConfig shape (with optional
// fields) so TypeScript doesn't narrow them away after indexing.
const getPetConfig = (type: string): PetConfig =>
    (PET_DEFS as Record<string, PetConfig>)[type];

type PetType = keyof typeof PET_DEFS | 'codachi';
type PetPanelTab = 'care' | 'inventory' | 'library';
type InventoryTab = 'inventory' | 'chest' | 'feed';

const randomSkin = (type: Exclude<PetType, 'codachi'>) => {
    const skins = PET_DEFS[type as keyof typeof PET_DEFS].skins;
    return skins[Math.floor(Math.random() * skins.length)];
};

const DEMON_SLAYER_TYPES = ['tanjiro', 'nezuko', 'shinobu', 'akaza'];
const GENSHIN_TYPES = [
    'ayaka', 'furina-genshin', 'furina', 'hilichurl-qiuqiuren', 'hu-tao', 'hu-tao-pet', 'hutao', 'keqing', 'klee',
    'lumine', 'nahida', 'paimon', 'rich-paimon', 'sandrone-marionette', 'shogun-dango', 'witch-klee', 'yoimiya',
];
const ANIME_GIRL_TYPES = [
    'arona-v1', 'atsuko-maid', 'frieren', 'makima', 'makima-the-control-devil', 'miko-serika',
    'plana', 'powerpet', 'reze', 'shiroko', 'yuuka',
];
const ANIME_CHAR_TYPES = [
    'blood-oath-asuna', 'broom-witch', 'chopper', 'chu-totoro', 'deku', 'gaara', 'gojo-satoru',
    'himiko', 'itachi', 'kid-goku-classic-actions', 'kirito', 'luffy-dressrosa-gear5', 'luffy-gear-5',
    'merry', 'nimbus', 'ninja-naru', 'sukuna', 'tiny-luffy', 'undine-asuna', 'yuji-itadori', 'yuuki-asuna',
];
const RANDOM_TYPES = [
    'aladin', 'albedo-real-comic', 'alien-x-pet', 'anya', 'apupepe', 'artoria-classic',
    'asterix', 'azuma', 'barbatos-rex', 'builder-pepe', 'chef', 'chispa',
    'clarry', 'claw-d', 'conan', 'crazy-frog', 'crimson-angel', 'custom-pet-18397bfb',
    'dario', 'dark-stewie', 'diana', 'dictator-mbappe', 'dobby', 'dudu-bubu',
    'endminguga', 'epstein', 'eren', 'feixue', 'freedom-mecha', 'fu',
    'gopher', 'grogu-jedi', 'grogu-kid', 'gutsy', 'hanabi', 'home-lander',
    'hornet', 'jack-the-drunk', 'jin-woo', 'jiyi', 'kdb-city', 'kia-mhalifa',
    'kingcr', 'kirby', 'kratos', 'labubu', 'liuying-swimsuit', 'mini-devil',
    'mini-sama', 'miss-minute', 'money-crab', 'moon-duo', 'mr-bean', 'muskie',
    'nezha-kid', 'noa', 'palantir-patrick', 'patch', 'pet-reference-robot', 'r2-vader',
    'rick', 'savage-codex-hacker', 'senku', 'shou-er-jiang', 'sonic-v2', 'sparklet',
    'spyfam-yor', 'starjotaro', 'sullyoon-meov', 'sun-wukong', 'teemo', 'the-knight',
    'trump', 'tuxterm', 'ultramarine', 'umaru', 'usagi', 'violet',
    'wojak-pet', 'xiaoba', 'xxxtentacion', 'zhenxun',
];
const GENSHIN_ASSET_MAP: Record<string, { folder: string; prefix: string }> = {
    ayaka: { folder: 'ayaka-gifs', prefix: 'ayaka' },
    'furina-genshin': { folder: 'furina-genshin-gifs', prefix: 'furina-genshin' },
    furina: { folder: 'furina-gifs', prefix: 'furina' },
    'hilichurl-qiuqiuren': { folder: 'hilichurl-qiuqiuren-gifs', prefix: 'hilichurl-qiuqiuren' },
    'hu-tao': { folder: 'hu-tao-gifs', prefix: 'hu-tao' },
    'hu-tao-pet': { folder: 'hu-tao-pet-gifs', prefix: 'hu-tao-pet' },
    hutao: { folder: 'hutao-gifs', prefix: 'hutao' },
    keqing: { folder: 'keqing-gifs', prefix: 'keqing' },
    klee: { folder: 'klee-gifs', prefix: 'klee' },
    lumine: { folder: 'lumine-gifs', prefix: 'lumine' },
    nahida: { folder: 'nahida-gifs', prefix: 'nahida' },
    paimon: { folder: 'paimon-gifs', prefix: 'paimon' },
    'rich-paimon': { folder: 'rich-paimon-gifs', prefix: 'rich-paimon' },
    'sandrone-marionette': { folder: 'sandrone-marionette-gifs', prefix: 'sandrone-marionette' },
    'shogun-dango': { folder: 'shogun-dango-gifs', prefix: 'shogun-dango' },
    'witch-klee': { folder: 'witch-klee-gifs', prefix: 'witch-klee' },
    yoimiya: { folder: 'yoimiya-gifs', prefix: 'yoimiya' },
};
const ANIME_GIRL_ASSET_MAP: Record<string, { folder: string; prefix: string }> = {
    'arona-v1': { folder: 'arona-v1-gifs', prefix: 'arona-v1' },
    'atsuko-maid': { folder: 'atsuko-maid-gifs', prefix: 'atsuko-maid' },
    frieren: { folder: 'frieren-gifs', prefix: 'frieren' },
    makima: { folder: 'makima-gifs', prefix: 'makima' },
    'makima-the-control-devil': { folder: 'makima-the-control-devil-gifs', prefix: 'makima-the-control-devil' },
    'miko-serika': { folder: 'miko-serika-gifs', prefix: 'miko-serika' },
    plana: { folder: 'plana-gifs', prefix: 'plana' },
    powerpet: { folder: 'powerpet-gifs', prefix: 'powerpet' },
    reze: { folder: 'reze-gifs', prefix: 'reze' },
    shiroko: { folder: 'shiroko-gifs', prefix: 'shiroko' },
    yuuka: { folder: 'yuuka-gifs', prefix: 'yuuka' },
};
const ANIME_CHAR_ASSET_MAP: Record<string, { folder: string; prefix: string }> = {
    'blood-oath-asuna': { folder: 'blood-oath-asuna-gifs', prefix: 'blood-oath-asuna' },
    'broom-witch': { folder: 'broom-witch-gifs', prefix: 'broom-witch' },
    chopper: { folder: 'chopper-gifs', prefix: 'chopper' },
    'chu-totoro': { folder: 'chu-totoro-gifs', prefix: 'chu-totoro' },
    deku: { folder: 'deku-gifs', prefix: 'deku' },
    gaara: { folder: 'gaara-gifs', prefix: 'gaara' },
    'gojo-satoru': { folder: 'gojo-satoru-gifs', prefix: 'gojo-satoru' },
    himiko: { folder: 'himiko-gifs', prefix: 'himiko' },
    itachi: { folder: 'itachi-gifs', prefix: 'itachi' },
    'kid-goku-classic-actions': { folder: 'kid-goku-classic-actions-gifs', prefix: 'kid-goku-classic-actions' },
    kirito: { folder: 'kirito-gifs', prefix: 'kirito' },
    'luffy-dressrosa-gear5': { folder: 'luffy-dressrosa-gear5-gifs', prefix: 'luffy-dressrosa-gear5' },
    'luffy-gear-5': { folder: 'luffy-gear-5-gifs', prefix: 'luffy-gear-5' },
    merry: { folder: 'merry-gifs', prefix: 'merry' },
    nimbus: { folder: 'nimbus-gifs', prefix: 'nimbus' },
    'ninja-naru': { folder: 'ninja-naru-gifs', prefix: 'ninja-naru' },
    sukuna: { folder: 'sukuna-gifs', prefix: 'sukuna' },
    'tiny-luffy': { folder: 'tiny-luffy-gifs', prefix: 'tiny-luffy' },
    'undine-asuna': { folder: 'undine-asuna-gifs', prefix: 'undine-asuna' },
    'yuji-itadori': { folder: 'yuji-itadori-gifs', prefix: 'yuji-itadori' },
    'yuuki-asuna': { folder: 'yuuki-asuna-gifs', prefix: 'yuuki-asuna' },
};
const RANDOM_ASSET_MAP: Record<string, { folder: string; prefix: string }> = {
    aladin: { folder: 'aladin-gifs', prefix: 'aladin' },
    'albedo-real-comic': { folder: 'albedo-real-comic-gifs', prefix: 'albedo-real-comic' },
    'alien-x-pet': { folder: 'alien-x-pet-gifs', prefix: 'alien-x-pet' },
    anya: { folder: 'anya-gifs', prefix: 'anya' },
    apupepe: { folder: 'apupepe-gifs', prefix: 'apupepe' },
    'artoria-classic': { folder: 'artoria-classic-gifs', prefix: 'artoria-classic' },
    asterix: { folder: 'asterix-gifs', prefix: 'asterix' },
    azuma: { folder: 'azuma-gifs', prefix: 'azuma' },
    'barbatos-rex': { folder: 'barbatos-rex-gifs', prefix: 'barbatos-rex' },
    'builder-pepe': { folder: 'builder-pepe-gifs', prefix: 'builder-pepe' },
    chef: { folder: 'chef-gifs', prefix: 'chef' },
    chispa: { folder: 'chispa-gifs', prefix: 'chispa' },
    clarry: { folder: 'clarry-gifs', prefix: 'clarry' },
    'claw-d': { folder: 'claw-d-gifs', prefix: 'claw-d' },
    conan: { folder: 'conan-gifs', prefix: 'conan' },
    'crazy-frog': { folder: 'crazy-frog-gifs', prefix: 'crazy-frog' },
    'crimson-angel': { folder: 'crimson-angel-gifs', prefix: 'crimson-angel' },
    'custom-pet-18397bfb': { folder: 'custom-pet-18397bfb-gifs', prefix: 'custom-pet-18397bfb' },
    dario: { folder: 'dario-gifs', prefix: 'dario' },
    'dark-stewie': { folder: 'dark-stewie-gifs', prefix: 'dark-stewie' },
    diana: { folder: 'diana-gifs', prefix: 'diana' },
    'dictator-mbappe': { folder: 'dictator-mbappe-gifs', prefix: 'dictator-mbappe' },
    dobby: { folder: 'dobby-gifs', prefix: 'dobby' },
    'dudu-bubu': { folder: 'dudu-bubu-gifs', prefix: 'dudu-bubu' },
    endminguga: { folder: 'endminguga-gifs', prefix: 'endminguga' },
    epstein: { folder: 'epstein-gifs', prefix: 'epstein' },
    eren: { folder: 'eren-gifs', prefix: 'eren' },
    feixue: { folder: 'feixue-gifs', prefix: 'feixue' },
    'freedom-mecha': { folder: 'freedom-mecha-gifs', prefix: 'freedom-mecha' },
    fu: { folder: 'fu-gifs', prefix: 'fu' },
    gopher: { folder: 'gopher-gifs', prefix: 'gopher' },
    'grogu-jedi': { folder: 'grogu-jedi-gifs', prefix: 'grogu-jedi' },
    'grogu-kid': { folder: 'grogu-kid-gifs', prefix: 'grogu-kid' },
    gutsy: { folder: 'gutsy-gifs', prefix: 'gutsy' },
    hanabi: { folder: 'hanabi-gifs', prefix: 'hanabi' },
    'home-lander': { folder: 'home-lander-gifs', prefix: 'home-lander' },
    hornet: { folder: 'hornet-gifs', prefix: 'hornet' },
    'jack-the-drunk': { folder: 'jack-the-drunk-gifs', prefix: 'jack-the-drunk' },
    'jin-woo': { folder: 'jin-woo-gifs', prefix: 'jin-woo' },
    jiyi: { folder: 'jiyi-gifs', prefix: 'jiyi' },
    'kdb-city': { folder: 'kdb-city-gifs', prefix: 'kdb-city' },
    'kia-mhalifa': { folder: 'kia-mhalifa-gifs', prefix: 'kia-mhalifa' },
    kingcr: { folder: 'kingcr-gifs', prefix: 'kingcr' },
    kirby: { folder: 'kirby-gifs', prefix: 'kirby' },
    kratos: { folder: 'kratos-gifs', prefix: 'kratos' },
    labubu: { folder: 'labubu-gifs', prefix: 'labubu' },
    'liuying-swimsuit': { folder: 'liuying-swimsuit-gifs', prefix: 'liuying-swimsuit' },
    'mini-devil': { folder: 'mini-devil-gifs', prefix: 'mini-devil' },
    'mini-sama': { folder: 'mini-sama-gifs', prefix: 'mini-sama' },
    'miss-minute': { folder: 'miss-minute-gifs', prefix: 'miss-minute' },
    'money-crab': { folder: 'money-crab-gifs', prefix: 'money-crab' },
    'moon-duo': { folder: 'moon-duo-gifs', prefix: 'moon-duo' },
    'mr-bean': { folder: 'mr-bean-gifs', prefix: 'mr-bean' },
    muskie: { folder: 'muskie-gifs', prefix: 'muskie' },
    'nezha-kid': { folder: 'nezha-kid-gifs', prefix: 'nezha-kid' },
    noa: { folder: 'noa-gifs', prefix: 'noa' },
    'palantir-patrick': { folder: 'palantir-patrick-gifs', prefix: 'palantir-patrick' },
    patch: { folder: 'patch-gifs', prefix: 'patch' },
    'pet-reference-robot': { folder: 'pet-reference-robot-gifs', prefix: 'pet-reference-robot' },
    'r2-vader': { folder: 'r2-vader-gifs', prefix: 'r2-vader' },
    rick: { folder: 'rick-gifs', prefix: 'rick' },
    'savage-codex-hacker': { folder: 'savage-codex-hacker-gifs', prefix: 'savage-codex-hacker' },
    senku: { folder: 'senku-gifs', prefix: 'senku' },
    'shou-er-jiang': { folder: 'shou-er-jiang-gifs', prefix: 'shou-er-jiang' },
    'sonic-v2': { folder: 'sonic-v2-gifs', prefix: 'sonic-v2' },
    sparklet: { folder: 'sparklet-gifs', prefix: 'sparklet' },
    'spyfam-yor': { folder: 'spyfam-yor-gifs', prefix: 'spyfam-yor' },
    starjotaro: { folder: 'starjotaro-gifs', prefix: 'starjotaro' },
    'sullyoon-meov': { folder: 'sullyoon-meov-gifs', prefix: 'sullyoon-meov' },
    'sun-wukong': { folder: 'sun-wukong-gifs', prefix: 'sun-wukong' },
    teemo: { folder: 'teemo-gifs', prefix: 'teemo' },
    'the-knight': { folder: 'the-knight-gifs', prefix: 'the-knight' },
    trump: { folder: 'trump-gifs', prefix: 'trump' },
    tuxterm: { folder: 'tuxterm-gifs', prefix: 'tuxterm' },
    ultramarine: { folder: 'ultramarine-gifs', prefix: 'ultramarine' },
    umaru: { folder: 'umaru-gifs', prefix: 'umaru' },
    usagi: { folder: 'usagi-gifs', prefix: 'usagi' },
    violet: { folder: 'violet-gifs', prefix: 'violet' },
    'wojak-pet': { folder: 'wojak-pet-gifs', prefix: 'wojak-pet' },
    xiaoba: { folder: 'xiaoba-gifs', prefix: 'xiaoba' },
    xxxtentacion: { folder: 'xxxtentacion-gifs', prefix: 'xxxtentacion' },
    zhenxun: { folder: 'zhenxun-gifs', prefix: 'zhenxun' },
};
const PET_CATEGORIES: { label: string; types: Exclude<PetType, 'codachi'>[] }[] = [
    {
        label: 'Focus Pets',
        types: Object.keys(PET_DEFS).filter(type => !DEMON_SLAYER_TYPES.includes(type) && !GENSHIN_TYPES.includes(type) && !ANIME_GIRL_TYPES.includes(type) && !ANIME_CHAR_TYPES.includes(type) && !RANDOM_TYPES.includes(type)) as Exclude<PetType, 'codachi'>[],
    },
    {
        label: 'Demon Slayer',
        types: DEMON_SLAYER_TYPES as Exclude<PetType, 'codachi'>[],
    },
    {
        label: 'Genshin',
        types: GENSHIN_TYPES as Exclude<PetType, 'codachi'>[],
    },
    {
        label: 'AnimeGirl',
        types: ANIME_GIRL_TYPES as Exclude<PetType, 'codachi'>[],
    },
    {
        label: 'AnimeChar',
        types: ANIME_CHAR_TYPES as Exclude<PetType, 'codachi'>[],
    },
    {
        label: 'Random',
        types: RANDOM_TYPES as Exclude<PetType, 'codachi'>[],
    },
];

const getPetUrl = (type: PetType, state: string, skin?: string, direction?: 1 | -1) => {
    if (type === 'codachi') return '';
    const def = PET_DEFS[type as keyof typeof PET_DEFS];
    const s = skin || def.skins[0];

    if (DEMON_SLAYER_TYPES.includes(type)) {
        const supportedActions = ['idle', 'waiting', 'waving', 'jumping', 'review', 'failed'];
        if (state === 'walk' || state === 'run') {
            const action = direction ? `running-${direction === 1 ? 'right' : 'left'}` : 'running';
            return `/pets/demon_slayer/${type}/${s}-${action}.gif`;
        }
        const action = supportedActions.includes(state) ? state : 'idle';
        return `/pets/demon_slayer/${type}/${s}-${action}.gif`;
    }

    const genshinAsset = GENSHIN_ASSET_MAP[type];
    if (genshinAsset) {
        const supportedActions = ['idle', 'waiting', 'waving', 'jumping', 'review', 'failed'];
        if (state === 'walk' || state === 'run') {
            const action = direction ? `running-${direction === 1 ? 'right' : 'left'}` : 'running';
            return `/pets/genshin/${genshinAsset.folder}/${genshinAsset.prefix}-${action}.gif`;
        }
        const action = supportedActions.includes(state) ? state : 'idle';
        return `/pets/genshin/${genshinAsset.folder}/${genshinAsset.prefix}-${action}.gif`;
    }

    const animeGirlAsset = ANIME_GIRL_ASSET_MAP[type];
    if (animeGirlAsset) {
        const supportedActions = ['idle', 'waiting', 'waving', 'jumping', 'review', 'failed'];
        if (state === 'walk' || state === 'run') {
            const action = direction ? `running-${direction === 1 ? 'right' : 'left'}` : 'running';
            return `/pets/anime_girl/${animeGirlAsset.folder}/${animeGirlAsset.prefix}-${action}.gif`;
        }
        const action = supportedActions.includes(state) ? state : 'idle';
        return `/pets/anime_girl/${animeGirlAsset.folder}/${animeGirlAsset.prefix}-${action}.gif`;
    }

    const animeCharAsset = ANIME_CHAR_ASSET_MAP[type];
    if (animeCharAsset) {
        const supportedActions = ['idle', 'waiting', 'waving', 'jumping', 'review', 'failed'];
        if (state === 'walk' || state === 'run') {
            const action = direction ? `running-${direction === 1 ? 'right' : 'left'}` : 'running';
            return `/pets/anime_char/${animeCharAsset.folder}/${animeCharAsset.prefix}-${action}.gif`;
        }
        const action = supportedActions.includes(state) ? state : 'idle';
        return `/pets/anime_char/${animeCharAsset.folder}/${animeCharAsset.prefix}-${action}.gif`;
    }

    const randomAsset = RANDOM_ASSET_MAP[type];
    if (randomAsset) {
        const supportedActions = ['idle', 'waiting', 'waving', 'jumping', 'review', 'failed'];
        if (state === 'walk' || state === 'run') {
            const action = direction ? `running-${direction === 1 ? 'right' : 'left'}` : 'running';
            return `/pets/random/${randomAsset.folder}/${randomAsset.prefix}-${action}.gif`;
        }
        const action = supportedActions.includes(state) ? state : 'idle';
        return `/pets/random/${randomAsset.folder}/${randomAsset.prefix}-${action}.gif`;
    }

    // cat: cat_<action>.gif
    if (type === 'cat') return `/pets/cat/cat_${state}.gif`;
    return `/pets/${type}/${s}_${state}_8fps.gif`;
};

// ─── State Interface ──────────────────────────────────────────────────────────
interface PetState {
    id: string;
    type: PetType;
    skin: string;        // resolved skin name
    x: number;
    direction: 1 | -1;
    monsterIdx?: number;
    eggIdx?: number;
}

// ─── Skin label prettifier ────────────────────────────────────────────────────
const labelSkin = (s: string) => s.replace(/_/g, ' ');

// ─── SinglePet Component ──────────────────────────────────────────────────────
function SinglePet({ pet, onRemove, scale, speed }: {
    pet: PetState,
    onRemove: (id: string) => void,
    scale: number,
    speed: number
}) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [direction, setDirection] = useState(pet.direction);
    const [state, setState] = useState<string>('idle');
    const [saying, setSaying] = useState<string | null>(null);
    const isCodachi = pet.type === 'codachi';
    const petConfig: PetConfig = isCodachi
        ? { size: 48, speed: 0.5, actions: ['idle', 'walk'], skins: [] }
        : (getPetConfig(pet.type) ?? { size: 44, speed: 1.0, actions: ['idle', 'walk'], skins: [] });
    const [codachiStage, setCodachiStage] = useState(0);
    const [effect, setEffect] = useState<string | null>(null);

    // Codachi Evolution Engine
    useEffect(() => {
        if (!isCodachi || codachiStage >= 3) return;
        const evolve = () => {
            setEffect(codachiStage === 0 ? 'dust1' : 'buff1');
            setTimeout(() => {
                setEffect(null);
                setCodachiStage(prev => prev + 1);
            }, 1000);
        };
        const times = [10000, 20000, 30000];
        const timer = setTimeout(evolve, times[codachiStage] / speed);
        return () => clearTimeout(timer);
    }, [isCodachi, codachiStage, speed]);

    const actualBaseSize = isCodachi ? (56 + codachiStage * 12) : petConfig.size;
    const actualSize = actualBaseSize * scale;
    const actualBaseSpeed = isCodachi ? (codachiStage === 0 ? 0 : 0.4 + codachiStage * 0.2) : petConfig.speed;
    const groundAdjust = isCodachi ? 0 : ((petConfig.bottomShift || 0) * actualSize);

    let petUrl = '';
    if (isCodachi) {
        petUrl = codachiStage === 0
            ? `/pets/codachi/egg${pet.eggIdx}.gif`
            : `/pets/codachi/m${pet.monsterIdx}d${codachiStage}.gif`;
    } else {
        petUrl = getPetUrl(pet.type, state, pet.skin, direction);
    }
    const usesDirectionalRunningAsset = (DEMON_SLAYER_TYPES.includes(pet.type) || !!GENSHIN_ASSET_MAP[pet.type] || !!ANIME_GIRL_ASSET_MAP[pet.type] || !!ANIME_CHAR_ASSET_MAP[pet.type] || !!RANDOM_ASSET_MAP[pet.type]) && (state === 'walk' || state === 'run');

    // Dragging
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRel = useRef<{ x: number, y: number } | null>(null);
    const xRef = useRef(pet.x);
    const yOffsetRef = useRef(0);
    const fallVelocityRef = useRef(0);
    const fallRafRef = useRef<number | null>(null);

    // Refs for values used inside the long-lived animation loop. Using refs
    // (instead of effect deps) means toggling scale/speed/actions in the
    // settings panel won't tear down and rebuild the rAF loop each time.
    const speedRef = useRef(speed);
    const scaleRef = useRef(scale);
    const actualBaseSpeedRef = useRef(actualBaseSpeed);
    const actualSizeRef = useRef(actualSize);
    const actionsRef = useRef(petConfig.actions);
    const isCodachiRef = useRef(isCodachi);
    const codachiStageRef = useRef(codachiStage);
    useEffect(() => { speedRef.current = speed; }, [speed]);
    useEffect(() => { scaleRef.current = scale; }, [scale]);
    useEffect(() => { actualBaseSpeedRef.current = actualBaseSpeed; }, [actualBaseSpeed]);
    useEffect(() => { actualSizeRef.current = actualSize; }, [actualSize]);
    useEffect(() => { actionsRef.current = petConfig.actions; }, [petConfig.actions]);
    useEffect(() => { isCodachiRef.current = isCodachi; }, [isCodachi]);
    useEffect(() => { codachiStageRef.current = codachiStage; }, [codachiStage]);

    const applyX = (nextX: number) => {
        const maxX = Math.max(0, window.innerWidth - actualSizeRef.current);
        const clampedX = Math.min(Math.max(0, nextX), maxX);
        xRef.current = clampedX;
        if (wrapperRef.current) wrapperRef.current.style.left = `${clampedX}px`;
        return clampedX;
    };

    const applyYOffset = (nextYOffset: number) => {
        const clampedYOffset = Math.max(0, nextYOffset);
        yOffsetRef.current = clampedYOffset;
        if (wrapperRef.current) {
            wrapperRef.current.style.bottom = `${80 + clampedYOffset - groundAdjust}px`;
        }
        return clampedYOffset;
    };

    const cancelFall = () => {
        if (fallRafRef.current === null) return;
        cancelAnimationFrame(fallRafRef.current);
        fallRafRef.current = null;
    };

    const startFall = () => {
        cancelFall();
        if (yOffsetRef.current <= 0) return;

        fallVelocityRef.current = 0;
        let lastTime = performance.now();
        const step = (time: number) => {
            const dt = Math.min(time - lastTime, 32);
            lastTime = time;
            fallVelocityRef.current += 0.0025 * dt;
            const nextYOffset = applyYOffset(yOffsetRef.current - fallVelocityRef.current * dt);
            if (nextYOffset > 0) {
                fallRafRef.current = requestAnimationFrame(step);
            } else {
                fallRafRef.current = null;
                fallVelocityRef.current = 0;
            }
        };

        fallRafRef.current = requestAnimationFrame(step);
    };

    const startFallRef = useRef(startFall);
    useEffect(() => { startFallRef.current = startFall; });

    useEffect(() => {
        applyYOffset(yOffsetRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groundAdjust]);

    useEffect(() => () => cancelFall(), []);

    // Movement + AI loop. Runs while grounded and not dragging.
    // Crucially: depends ONLY on (isDragging, codachiStage) so that
    // normal motion isn't restarted every time yOffset or settings change.
    useEffect(() => {
        if (isDragging) return;

        let lastTime = performance.now();
        let animFrame = 0;
        let currentDir: 1 | -1 = direction;
        let currentState = state;
        // Track every timeout we schedule so they're all cancelled on unmount
        // or when the effect re-runs. Previous version only cleared the first
        // one, leaking the recursive `changeState` chain.
        const timers = new Set<ReturnType<typeof setTimeout>>();
        const safeSetTimeout = (fn: () => void, ms: number) => {
            const id = setTimeout(() => {
                timers.delete(id);
                fn();
            }, ms);
            timers.add(id);
            return id;
        };

        // Movement loop
        const animate = (time: number) => {
            const dt = time - lastTime;
            lastTime = time;
            // Skip movement while falling - fall effect owns yOffset.
            if (yOffsetRef.current <= 0 && (currentState === 'walk' || currentState === 'run')) {
                const speedMult = currentState === 'run' ? 1.5 : 1;
                const nextX =
                    xRef.current +
                    currentDir * (dt / 10) * (actualBaseSpeedRef.current * speedRef.current) * speedMult;

                let newX = nextX;
                let bounced = false;
                if (newX <= 0) { newX = 0; currentDir = 1; bounced = true; }
                else if (newX >= window.innerWidth - actualSizeRef.current) {
                    newX = window.innerWidth - actualSizeRef.current;
                    currentDir = -1;
                    bounced = true;
                }
                applyX(newX);
                if (bounced) setDirection(currentDir);
            }
            animFrame = requestAnimationFrame(animate);
        };
        animFrame = requestAnimationFrame(animate);

        // AI loop
        const changeState = () => {
            const actions = actionsRef.current;
            const r = Math.random();
            let nextState = 'idle';
            if (isCodachiRef.current && codachiStageRef.current === 0) {
                nextState = 'idle';
            } else if (r > 0.8 && actions.includes('run')) {
                nextState = 'run';
                currentDir = (currentState === 'walk' || currentState === 'run') && Math.random() > 0.2 ? currentDir : (Math.random() > 0.5 ? 1 : -1);
            } else if (r > 0.5) {
                nextState = 'walk';
                currentDir = (currentState === 'walk' || currentState === 'run') && Math.random() > 0.2 ? currentDir : (Math.random() > 0.5 ? 1 : -1);
            } else if (r > 0.35 && actions.includes('swipe')) {
                nextState = 'swipe';
            } else if (r > 0.3 && actions.includes('waving')) {
                nextState = 'waving';
            } else if (r > 0.25 && actions.includes('jumping')) {
                nextState = 'jumping';
            } else if (r > 0.2 && actions.includes('waiting')) {
                nextState = 'waiting';
            } else if (r > 0.15 && actions.includes('review')) {
                nextState = 'review';
            } else if (r > 0.1 && actions.includes('failed')) {
                nextState = 'failed';
            } else if (r > 0.25 && actions.includes('lie')) {
                nextState = 'lie';
            } else if (r > 0.15 && actions.includes('stand')) {
                nextState = 'stand';
            } else if (r > 0.05 && actions.includes('with_ball')) {
                nextState = 'with_ball';
            }
            currentState = nextState;
            setState(currentState);
            setDirection(currentDir);
            if (Math.random() > 0.8 && (currentState === 'idle' || currentState === 'waiting' || currentState === 'lie')) {
                setSaying(currentState === 'lie'
                    ? 'Zzz...'
                    : (isCodachiRef.current && codachiStageRef.current === 0 ? '...' : '!'));
                safeSetTimeout(() => setSaying(null), 3000);
            }
            safeSetTimeout(changeState, 2000 + Math.random() * 5000);
        };
        safeSetTimeout(changeState, Math.random() * 2000);

        return () => {
            cancelAnimationFrame(animFrame);
            timers.forEach(id => clearTimeout(id));
            timers.clear();
        };
        // `direction` / `state` are intentionally read once as seeds.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDragging, codachiStage]);

    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (isDragging && dragStartRel.current) {
                const newX = e.clientX - dragStartRel.current.x;
                applyX(newX);
                const bottomY = window.innerHeight - 80;
                const newYOffset = Math.max(0, bottomY - e.clientY - dragStartRel.current.y);
                applyYOffset(newYOffset);
            }
        };
        const handleGlobalMouseUp = () => {
            if (!isDragging) return;
            setIsDragging(false);
            startFallRef.current();
        };
        if (isDragging) {
            window.addEventListener('mousemove', handleGlobalMouseMove);
            window.addEventListener('mouseup', handleGlobalMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
        // Position helpers are ref-owned and intentionally read from this drag subscription.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDragging]);

    // Short-lived `setSaying(null)` timers spawned from user interactions need
    // to be cleared on unmount to avoid "set state after unmount" warnings.
    const sayingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => () => {
        if (sayingTimerRef.current) clearTimeout(sayingTimerRef.current);
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        setState(petConfig.actions.includes('waving') ? 'waving' : petConfig.actions.includes('swipe') ? 'swipe' : 'idle');
        setSaying('!');
        if (sayingTimerRef.current) clearTimeout(sayingTimerRef.current);
        sayingTimerRef.current = setTimeout(() => setSaying(null), 1000);
        cancelFall();
        setIsDragging(true);
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        dragStartRel.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    return (
        <div
            ref={wrapperRef}
            className="absolute z-20 pointer-events-auto"
            style={{ left: pet.x, bottom: 80 - groundAdjust }}
            title="Double click to dismiss, drag to move"
            onDoubleClick={() => onRemove(pet.id)}
            onMouseDown={handleMouseDown}
        >
            {saying && (
                <div className="absolute -top-6 left-1/2 bg-white/10 backdrop-blur-md rounded-lg px-2 py-0.5 text-[10px] text-white font-medium whitespace-nowrap shadow-sm border border-white/20 pointer-events-none" style={{ transform: 'translateX(-50%)' }}>
                    {saying}
                </div>
            )}
            {effect && (
                <img
                    src={`/pets/codachi/${effect}.gif`}
                    className="absolute inset-x-0 bottom-0 pointer-events-none z-10 mx-auto"
                    style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.8))' }}
                />
            )}
            <img
                src={petUrl}
                style={{
                    width: actualSize, height: actualSize,
                    imageRendering: 'pixelated',
                    filter: isDragging ? 'drop-shadow(0 10px 10px rgba(0,0,0,0.5))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                    transform: usesDirectionalRunningAsset ? undefined : `scaleX(${direction})`
                }}
                className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
                draggable={false}
            />
        </div>
    );
}

// ─── Main FocusPets Panel ─────────────────────────────────────────────────────
export function FocusPets() {
    const { state, feedPet, interactPet, openChest, useFood: feedInventoryFood, clearRewardEvents, equipPet, equipPetSkin, claimDailyQuest, clearLevelUpEvents, clearChestOpeningEvents } = useApp();
    // Start with a server-safe empty list. Initial pets are spawned in a
    // mount effect so we can read `window.innerWidth` without tripping
    // React 19's hydration checker.
    const [pets, setPets] = useState<PetState[]>([]);
    const [spawnMenuOpen, setSpawnMenuOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showQuestModal, setShowQuestModal] = useState(false);
    const [profilePetId, setProfilePetId] = useState<string | null>(null);
    const [panelTab, setPanelTab] = useState<PetPanelTab>('care');
    const [inventoryTab, setInventoryTab] = useState<InventoryTab>('inventory');

    useEffect(() => {
        window.dispatchEvent(new CustomEvent('pets-menu-state', { detail: spawnMenuOpen }));
    }, [spawnMenuOpen]);

    useEffect(() => {
        const toggleHandler = () => setSpawnMenuOpen(p => !p);
        const closeHandler = () => setSpawnMenuOpen(false);
        window.addEventListener('toggle-focus-pets', toggleHandler);
        window.addEventListener('close-focus-pets', closeHandler);
        return () => {
            window.removeEventListener('toggle-focus-pets', toggleHandler);
            window.removeEventListener('close-focus-pets', closeHandler);
        };
    }, []);

    // Skin picker state: which pet type is being color-picked
    const [skinPickType, setSkinPickType] = useState<Exclude<PetType, 'codachi'> | null>(null);
    const activeOwnedPet = state.ownedPets.find(pet => pet.id === state.activePetId) ?? state.ownedPets[0];
    const profilePet = state.ownedPets.find(pet => pet.id === profilePetId) ?? null;
    const latestChestOpening = state.chestOpeningEvents[0];
    const activePetLevelFloor = activeOwnedPet ? Math.floor(activeOwnedPet.xp / 1000) * 1000 : 0;
    const activePetLevelCeil = activePetLevelFloor + 1000;
    const activePetProgress = activeOwnedPet ? Math.min(100, ((activeOwnedPet.xp - activePetLevelFloor) / (activePetLevelCeil - activePetLevelFloor)) * 100) : 0;
    const activePetHunger = activeOwnedPet?.hunger ?? state.petStatus.hunger;
    const activePetHappiness = activeOwnedPet?.happiness ?? state.petStatus.happiness;
    const latestLevelUp = state.levelUpEvents[0];
    const formatQuestReward = (reward: { coins?: number; commonChests?: number; rareChests?: number; basicSnack?: number; focusBerry?: number; petXp?: number }) => [
        reward.coins ? `+${reward.coins} coins` : '',
        reward.commonChests ? `+${reward.commonChests} common chest` : '',
        reward.rareChests ? `+${reward.rareChests} rare chest` : '',
        reward.basicSnack ? `+${reward.basicSnack} snack` : '',
        reward.focusBerry ? `+${reward.focusBerry} berry` : '',
        reward.petXp ? `+${reward.petXp} pet XP` : '',
    ].filter(Boolean).join(' · ');

    // Settings (size/speed per profile)
    // Start with defaults. Per-pet settings stored in localStorage are loaded
    // in a mount effect (client-only) to keep SSR and hydration in sync.
    const [petSettings, setPetSettings] = useState<Record<string, { scale: number, speed: number }>>({
        global: { scale: 1, speed: 1 },
    });
    const [selectedProfile, setSelectedProfile] = useState<string>('global');

    useEffect(() => {
        const saved = localStorage.getItem('beeziee_pet_settings');
        if (saved) {
            try {
                // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only hydration.
                setPetSettings(JSON.parse(saved));
            } catch { /* corrupt data */ }
        }
    }, []);

    const updateSetting = (key: 'scale' | 'speed', val: number) => {
        setPetSettings(prev => {
            const next = { ...prev };
            if (!next[selectedProfile]) next[selectedProfile] = { scale: 1, speed: 1 };
            next[selectedProfile][key] = val;
            localStorage.setItem('beeziee_pet_settings', JSON.stringify(next));
            return next;
        });
    };

    const resetSettings = () => {
        setPetSettings(prev => {
            const next = { ...prev };
            if (selectedProfile === 'global') next.global = { scale: 1, speed: 1 };
            else delete next[selectedProfile];
            localStorage.setItem('beeziee_pet_settings', JSON.stringify(next));
            return next;
        });
    };

    const currentSettings = petSettings[selectedProfile] || { scale: 1, speed: 1 };

    useEffect(() => {
        if (!activeOwnedPet) {
            setPets([]);
            return;
        }

        const petType = activeOwnedPet.type as PetType;
        if (petType === 'codachi' || !(petType in PET_DEFS)) return;

        const w = window.innerWidth;
        setPets([
            {
                id: `active-${activeOwnedPet.id}`,
                type: petType,
                skin: activeOwnedPet.skin || PET_DEFS[petType as keyof typeof PET_DEFS].skins[0],
                x: w / 2,
                direction: 1,
            },
        ]);
    }, [activeOwnedPet]);

    const handleRemove = (id: string) => setPets(prev => prev.filter(p => p.id !== id));

    const spawnPet = (type: PetType, specificSkin?: string) => {
        const w = typeof window !== 'undefined' ? window.innerWidth : 1000;
        const newPet: PetState = {
            id: Date.now().toString() + Math.random(),
            type,
            skin: type === 'codachi' ? '' : (specificSkin || randomSkin(type as Exclude<PetType, 'codachi'>)),
            x: w / 2 + (Math.random() * 200 - 100),
            direction: Math.random() > 0.5 ? 1 : -1,
        };
        if (type === 'codachi') {
            newPet.monsterIdx = Math.floor(Math.random() * 6) + 1;
            newPet.eggIdx = Math.floor(Math.random() * 3) + 1;
        }
        setPets(prev => [...prev, newPet]);
        setSpawnMenuOpen(false);
        setSkinPickType(null);
    };

    const petTypes = Object.keys(PET_DEFS) as Exclude<PetType, 'codachi'>[];

    return (
        <>
            {/* Pet canvas */}
            <div className="fixed inset-0 pointer-events-none z-[19]">
                {pets.filter(pet => pet.type === 'codachi' || (pet.type in PET_DEFS)).map(pet => {
                    const petScale = (petSettings.global?.scale || 1) * (petSettings[pet.type]?.scale || 1);
                    const petSpeed = (petSettings.global?.speed || 1) * (petSettings[pet.type]?.speed || 1);
                    return <SinglePet key={pet.id} pet={pet} onRemove={handleRemove} scale={petScale} speed={petSpeed} />;
                })}
            </div>

            {/* Spawn / Control Panel (bottom-right) */}
            <div className="fixed bottom-[86px] right-6 z-[60] flex flex-col items-end gap-2 pointer-events-none">
                {spawnMenuOpen && (
                    <div className="bg-black/65 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 w-[360px] pointer-events-auto origin-bottom-right animate-in fade-in zoom-in-95 duration-200">

                        {/* Header */}
                        <div className="flex justify-between items-center px-1">
                            <h4 className="text-xs text-white/90 uppercase tracking-widest font-bold flex items-center gap-1.5">
                                {(showSettings || skinPickType) && (
                                    <button onClick={() => { setShowSettings(false); setSkinPickType(null); }} className="hover:text-white transition-colors" title="Back">
                                        <ChevronLeft size={14} className="-ml-1" />
                                    </button>
                                )}
                                {showSettings ? 'Settings' : skinPickType ? `${skinPickType} · Color` : 'Pets'}
                            </h4>
                            <div className="flex items-center gap-2 text-white/40">
                                {!showSettings && !skinPickType && (
                                    <>
                                        <button onClick={() => setShowQuestModal(true)} className="hover:text-white transition-colors" title="Daily Quests">
                                            <ClipboardCheck size={14} />
                                        </button>
                                        <button onClick={() => setShowSettings(true)} className="hover:text-white transition-colors" title="Settings">
                                            <Settings2 size={14} />
                                        </button>
                                    </>
                                )}
                                <div className="group/info relative flex items-center">
                                    <Info size={14} className="hover:text-white transition-colors cursor-help" />
                                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl text-[10px] text-white/70 opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-50">
                                        Pets & Assets by <b>tonybaloney/vscode-pets</b> and contributors.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Settings Panel ──────────────────────────────── */}
                        {showSettings && (
                            <div className="flex flex-col gap-3">
                                {/* Profile icon row */}
                                <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                                    <button onClick={() => setSelectedProfile('global')} className={`w-10 h-10 shrink-0 rounded-xl border transition-all flex items-center justify-center ${selectedProfile === 'global' ? 'bg-white/20 border-white/40' : 'bg-white/5 border-white/5 hover:bg-white/10'}`} title="Global">
                                        <Globe size={18} className="text-white/80" />
                                    </button>
                                    {petTypes.map(type => (
                                        <button key={type} onClick={() => setSelectedProfile(type)} className={`w-10 h-10 shrink-0 rounded-xl border transition-all flex items-center justify-center group/pb ${selectedProfile === type ? 'bg-white/20 border-white/40' : 'bg-white/5 border-white/5 hover:bg-white/10'}`} title={`${type} Profile`}>
                                            <img src={getPetUrl(type, 'idle')} className="w-6 h-6 object-contain group-hover/pb:scale-110 transition-transform" style={{ imageRendering: 'pixelated' }} />
                                        </button>
                                    ))}
                                </div>

                                <div className="flex flex-col gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest truncate">
                                            {selectedProfile === 'global' ? 'Global' : selectedProfile}
                                        </span>
                                        <button onClick={resetSettings} className="text-[10px] text-white/40 hover:text-white flex items-center gap-1 transition-colors shrink-0">
                                            <RotateCcw size={10} /> Reset
                                        </button>
                                    </div>
                                    {(['scale', 'speed'] as const).map(key => (
                                        <div key={key} className="flex flex-col gap-1.5 mt-1">
                                            <div className="flex justify-between text-[11px] text-white/70 font-medium">
                                                <span>{key === 'scale' ? 'Size' : 'Speed'} Multiplier</span>
                                                <span className="text-white/40">{currentSettings[key].toFixed(1)}x</span>
                                            </div>
                                            <input
                                                type="range" min={key === 'scale' ? '0.5' : '0'} max="3" step="0.1"
                                                value={currentSettings[key]}
                                                onChange={e => updateSetting(key, parseFloat(e.target.value))}
                                                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Skin Picker Panel ───────────────────────────── */}
                        {!showSettings && skinPickType && (
                            <div className="flex flex-col gap-2">
                                <p className="text-[10px] text-white/50 px-1">Click a color to spawn. <span className="text-white/30">Click <Shuffle size={9} className="inline" /> for random.</span></p>
                                <div className="grid grid-cols-5 gap-2">
                                    {/* Random button */}
                                    <button
                                        onClick={() => spawnPet(skinPickType)}
                                        className="col-span-1 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                                        title="Random skin"
                                    >
                                        <Shuffle size={14} className="text-white/70" />
                                    </button>
                                    {PET_DEFS[skinPickType].skins.map(skin => {
                                        const skinScale = getPetConfig(skinPickType).skinScales?.[skin] ?? 1;
                                        return (
                                            <button
                                                key={skin}
                                                onClick={() => spawnPet(skinPickType, skin)}
                                                className="h-10 rounded-xl border border-white/10 hover:border-white/40 transition-all hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-0.5 overflow-hidden group/sk px-1"
                                                title={labelSkin(skin)}
                                            >
                                                <img
                                                    src={getPetUrl(skinPickType, 'idle', skin)}
                                                    className="w-6 h-6 object-contain transition-transform group-hover/sk:brightness-110"
                                                    style={{ imageRendering: 'pixelated', transform: `scale(${skinScale})` }}
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                                {/* Skin labels */}
                                <div className="flex flex-wrap gap-1 mt-1 px-0.5">
                                    {PET_DEFS[skinPickType].skins.map(skin => (
                                        <span key={skin} className="text-[9px] text-white/40 bg-white/5 rounded px-1 py-0.5">{labelSkin(skin)}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!showSettings && !skinPickType && (
                            <>
                                <div className="grid grid-cols-3 gap-1 rounded-xl bg-black/35 p-1">
                                    {([
                                        { id: 'care' as const, label: 'Care', icon: Heart },
                                        { id: 'inventory' as const, label: 'Inventory', icon: Backpack },
                                        { id: 'library' as const, label: 'Library', icon: PackageOpen },
                                    ]).map(tab => {
                                        const Icon = tab.icon;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setPanelTab(tab.id)}
                                                className={cn(
                                                    "flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-black uppercase tracking-wide transition-colors",
                                                    panelTab === tab.id ? "bg-white/12 text-white shadow-sm" : "text-white/35 hover:bg-white/5 hover:text-white/65"
                                                )}
                                            >
                                                <Icon size={11} /> {tab.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {panelTab === 'care' && (
                                    <div className="flex flex-col gap-2.5 p-3 bg-black/40 border border-white/10 rounded-xl shadow-inner relative overflow-hidden">
                                        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                                        <div className="flex items-center justify-between z-10">
                                            <div className="flex min-w-0 flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="truncate text-xs font-black uppercase tracking-widest text-white/85">{activeOwnedPet?.type ?? 'Pet'}</span>
                                                    <span className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-black text-emerald-300">Lv {activeOwnedPet?.level ?? 1}</span>
                                                    <span className="flex items-center gap-1 rounded-md border border-yellow-400/20 bg-yellow-400/10 px-1.5 py-0.5 text-[9px] font-bold text-yellow-400">
                                                        <Coins size={10} /> {Math.floor(state.coins ?? 0)}
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-36 overflow-hidden rounded-full border border-white/5 bg-black/50">
                                                    <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-500" style={{ width: `${activePetProgress}%` }} />
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={feedPet}
                                                    disabled={(state.coins ?? 0) < 10}
                                                    className="text-[10px] px-2.5 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 hover:border-orange-500/50 text-orange-400 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg flex items-center gap-1.5 transition-all font-bold tracking-wide shadow-sm"
                                                >
                                                    <Utensils size={10} /> Feed (10)
                                                </button>
                                                <button
                                                    onClick={interactPet}
                                                    className="text-[10px] px-2.5 py-1.5 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 hover:border-pink-500/50 text-pink-400 rounded-lg flex items-center gap-1.5 transition-all font-bold tracking-wide shadow-sm active:scale-95"
                                                >
                                                    <Heart size={10} className="fill-pink-400/50" /> Play
                                                </button>
                                            </div>
                                        </div>

                                        {state.rewardEvents.length > 0 && (
                                            <div className="relative z-10 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-2">
                                                <div className="flex items-center justify-between gap-2 text-[10px] text-white/65">
                                                    <span className="flex items-center gap-1 font-black uppercase tracking-widest text-emerald-300">
                                                        <Sparkles size={10} /> {state.rewardEvents[0].label}
                                                    </span>
                                                    <button onClick={clearRewardEvents} className="shrink-0 text-white/35 hover:text-white/70">
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                                <p className="mt-1 truncate text-[10px] text-white/70">{state.rewardEvents[0].detail}</p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4 z-10">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex justify-between items-center text-[9px] text-white/50 uppercase font-black tracking-widest">
                                                    <span>Fullness</span> <span className={activePetHunger < 30 ? 'text-red-400 animate-pulse' : 'text-orange-300'}>{Math.floor(activePetHunger)}%</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                                    <div
                                                        className={cn("h-full transition-all duration-500", activePetHunger < 30 ? "bg-red-500" : "bg-gradient-to-r from-orange-500 to-amber-400")}
                                                        style={{ width: `${activePetHunger}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex justify-between items-center text-[9px] text-white/50 uppercase font-black tracking-widest">
                                                    <span>Happiness</span> <span className={activePetHappiness < 30 ? 'text-blue-400' : 'text-pink-300'}>{Math.floor(activePetHappiness)}%</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                                    <div
                                                        className={cn("h-full transition-all duration-500", activePetHappiness < 30 ? "bg-blue-500" : "bg-gradient-to-r from-pink-500 to-rose-400")}
                                                        style={{ width: `${activePetHappiness}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {panelTab === 'inventory' && (
                                    <div className="z-10 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                                        <div className="mb-2 grid grid-cols-3 gap-1 rounded-lg bg-black/30 p-1">
                                            {([
                                                { id: 'inventory' as const, label: 'Inventory', icon: Backpack },
                                                { id: 'chest' as const, label: 'Chest', icon: PackageOpen },
                                                { id: 'feed' as const, label: 'Feed', icon: Apple },
                                            ]).map(tab => {
                                                const Icon = tab.icon;
                                                return (
                                                    <button
                                                        key={tab.id}
                                                        onClick={() => setInventoryTab(tab.id)}
                                                        className={cn(
                                                            "flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[9px] font-black uppercase tracking-wide transition-colors",
                                                            inventoryTab === tab.id ? "bg-white/12 text-white" : "text-white/35 hover:bg-white/5 hover:text-white/60"
                                                        )}
                                                    >
                                                        <Icon size={10} /> {tab.label}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {inventoryTab === 'inventory' && (
                                            <div className="grid grid-cols-4 gap-2">
                                                <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-center">
                                                    <PackageOpen size={13} className="mx-auto mb-1 text-emerald-300" />
                                                    <p className="text-[8px] font-bold uppercase text-white/40">Common</p>
                                                    <p className="text-xs font-black text-white">{state.inventory.chests.common ?? 0}</p>
                                                </div>
                                                <div className="rounded-lg border border-yellow-400/20 bg-yellow-400/10 p-2 text-center">
                                                    <Gift size={13} className="mx-auto mb-1 text-yellow-300" />
                                                    <p className="text-[8px] font-bold uppercase text-yellow-200/60">Rare</p>
                                                    <p className="text-xs font-black text-yellow-100">{state.inventory.chests.rare ?? 0}</p>
                                                </div>
                                                <div className="rounded-lg border border-orange-400/20 bg-orange-400/10 p-2 text-center">
                                                    <Apple size={13} className="mx-auto mb-1 text-orange-300" />
                                                    <p className="text-[8px] font-bold uppercase text-orange-200/60">Snack</p>
                                                    <p className="text-xs font-black text-orange-100">{state.inventory.food.basicSnack ?? 0}</p>
                                                </div>
                                                <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-2 text-center">
                                                    <Sparkles size={13} className="mx-auto mb-1 text-emerald-300" />
                                                    <p className="text-[8px] font-bold uppercase text-emerald-200/60">Berry</p>
                                                    <p className="text-xs font-black text-emerald-100">{state.inventory.food.focusBerry ?? 0}</p>
                                                </div>
                                            </div>
                                        )}

                                        {inventoryTab === 'chest' && (
                                            <div className="grid grid-cols-2 gap-2">
                                                <button onClick={() => openChest('common')} disabled={(state.inventory.chests.common ?? 0) <= 0} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35">
                                                    <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-white/70"><PackageOpen size={12} className="text-emerald-300" /> Common</span>
                                                    <span className="text-xs font-black text-white">{state.inventory.chests.common ?? 0}</span>
                                                </button>
                                                <button onClick={() => openChest('rare')} disabled={(state.inventory.chests.rare ?? 0) <= 0} className="flex items-center justify-between rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-3 py-2 text-left transition-colors hover:bg-yellow-400/15 disabled:cursor-not-allowed disabled:opacity-35">
                                                    <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-yellow-300"><Gift size={12} /> Rare</span>
                                                    <span className="text-xs font-black text-yellow-200">{state.inventory.chests.rare ?? 0}</span>
                                                </button>
                                            </div>
                                        )}

                                        {inventoryTab === 'feed' && (
                                            <div className="grid grid-cols-2 gap-2">
                                                <button onClick={() => feedInventoryFood('basicSnack')} disabled={(state.inventory.food.basicSnack ?? 0) <= 0} className="flex items-center justify-between rounded-xl border border-orange-400/20 bg-orange-400/10 px-3 py-2 transition-colors hover:bg-orange-400/15 disabled:cursor-not-allowed disabled:opacity-35">
                                                    <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-orange-300"><Apple size={12} /> Snack</span>
                                                    <span className="text-xs font-black text-orange-100">{state.inventory.food.basicSnack ?? 0}</span>
                                                </button>
                                                <button onClick={() => feedInventoryFood('focusBerry')} disabled={(state.inventory.food.focusBerry ?? 0) <= 0} className="flex items-center justify-between rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 transition-colors hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-35">
                                                    <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-emerald-300"><Sparkles size={12} /> Berry</span>
                                                    <span className="text-xs font-black text-emerald-100">{state.inventory.food.focusBerry ?? 0}</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {panelTab === 'library' && (
                                    <div className="flex max-h-[360px] flex-col gap-3 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10">
                                        {PET_CATEGORIES.map(category => (
                                            <div key={category.label} className="flex flex-col gap-2">
                                                <div className="flex items-center justify-between px-0.5">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/45">{category.label}</span>
                                                    <span className="text-[9px] font-bold text-white/25">{category.types.filter(type => state.ownedPets.some(pet => pet.type === type)).length}/{category.types.length}</span>
                                                </div>
                                                <div className="grid grid-cols-5 gap-3">
                                                    {category.types.map(type => {
                                                        const ownedPet = state.ownedPets.find(pet => pet.type === type);
                                                        const isActive = ownedPet?.id === state.activePetId;
                                                        const isOwned = Boolean(ownedPet);
                                                        const levelFloor = ownedPet ? Math.floor(ownedPet.xp / 1000) * 1000 : 0;
                                                        const levelProgress = ownedPet ? Math.min(100, ((ownedPet.xp - levelFloor) / 1000) * 100) : 0;
                                                        return (
                                                            <div key={type} className="relative group/cell flex flex-col items-center gap-1">
                                                                <button
                                                                    onClick={() => ownedPet && setProfilePetId(ownedPet.id)}
                                                                    disabled={!ownedPet}
                                                                    className={cn(
                                                                        "relative w-full h-12 rounded-xl border transition-all flex items-center justify-center group/petbtn",
                                                                        isActive && "bg-emerald-400/15 border-emerald-400/35 ring-1 ring-emerald-400/20",
                                                                        isOwned && !isActive && "bg-white/5 hover:bg-white/12 border-white/8 hover:border-white/25 hover:scale-105 active:scale-95",
                                                                        !isOwned && "cursor-not-allowed bg-white/[0.02] border-white/5 opacity-35"
                                                                    )}
                                                                    title={isOwned ? `View ${type} profile` : `${type} locked`}
                                                                >
                                                                    <img
                                                                        src={getPetUrl(type, 'idle', ownedPet?.skin)}
                                                                        style={{ width: getPetConfig(type).iconSize ?? 32, height: getPetConfig(type).iconSize ?? 32, imageRendering: 'pixelated' }}
                                                                        className={cn("object-contain drop-shadow transition-transform", isOwned && "group-hover/petbtn:scale-110", !isOwned && "grayscale")}
                                                                    />
                                                                    {!isOwned && <span className="absolute right-1 top-1 text-[9px] text-white/40">🔒</span>}
                                                                </button>
                                                                <span className={cn("text-[8px] truncate w-full text-center leading-none", isActive ? "text-emerald-300" : isOwned ? "text-white/55" : "text-white/25")}>{type}</span>
                                                                <span className={cn("text-[7px] uppercase tracking-wide", isActive ? "text-emerald-300" : isOwned ? "text-white/30" : "text-white/20")}>{isActive ? `Active · Lv ${ownedPet?.level ?? 1}` : isOwned ? `Lv ${ownedPet?.level ?? 1}` : 'Locked'}</span>
                                                                {isOwned && (
                                                                    <div className="h-1 w-full overflow-hidden rounded-full bg-black/40">
                                                                        <div className="h-full bg-emerald-300/70" style={{ width: `${levelProgress}%` }} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}

                                        <p className="text-[9px] text-white/30 text-center">Open chests to unlock pets · click owned pets to equip</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

            </div>

            {showQuestModal && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm pointer-events-auto">
                    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/80 p-5 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-white">Daily Quests</h3>
                                <p className="mt-1 text-[10px] uppercase tracking-wide text-white/35">Resets daily</p>
                            </div>
                            <button onClick={() => setShowQuestModal(false)} className="rounded-full p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-3">
                            {state.dailyQuests.map(quest => {
                                const complete = quest.progress >= quest.target;
                                const progress = Math.min(100, (quest.progress / quest.target) * 100);
                                return (
                                    <div key={quest.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-white/85">{quest.label}</p>
                                                <p className="mt-1 text-[10px] text-white/40">{Math.floor(quest.progress)} / {quest.target} · {formatQuestReward(quest.reward)}</p>
                                            </div>
                                            <button
                                                onClick={() => claimDailyQuest(quest.id)}
                                                disabled={!complete || quest.claimed}
                                                className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide text-emerald-300 transition-colors hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-white/25"
                                            >
                                                {quest.claimed ? 'Claimed' : complete ? 'Claim' : 'Locked'}
                                            </button>
                                        </div>
                                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/50">
                                            <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-500" style={{ width: `${progress}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {profilePet && (
                <div className="fixed inset-0 z-[88] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm pointer-events-auto">
                    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/85 p-5 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-white">{profilePet.type} Profile</h3>
                                <p className="mt-1 text-[10px] uppercase tracking-wide text-white/35">{profilePet.id === state.activePetId ? 'Active pet' : 'Owned pet'}</p>
                            </div>
                            <button onClick={() => setProfilePetId(null)} className="rounded-full p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/35">
                                <img src={getPetUrl(profilePet.type as PetType, 'idle', profilePet.skin)} className="h-14 w-14 object-contain" style={{ imageRendering: 'pixelated' }} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="mb-2 flex items-center gap-2">
                                    <span className="text-xs font-black uppercase tracking-widest text-white/85">Lv {profilePet.level}</span>
                                    <span className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-black uppercase text-emerald-300">{profilePet.id === state.activePetId ? 'Active' : 'Owned'}</span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-black/50">
                                    <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-300" style={{ width: `${Math.min(100, ((profilePet.xp - Math.floor(profilePet.xp / 1000) * 1000) / 1000) * 100)}%` }} />
                                </div>
                                <p className="mt-1 text-[10px] text-white/35">{profilePet.xp} XP</p>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-orange-400/20 bg-orange-400/10 p-3">
                                <p className="text-[9px] font-black uppercase tracking-widest text-orange-300">Fullness</p>
                                <p className="mt-1 text-lg font-black text-orange-100">{Math.floor(profilePet.hunger)}%</p>
                            </div>
                            <div className="rounded-xl border border-pink-400/20 bg-pink-400/10 p-3">
                                <p className="text-[9px] font-black uppercase tracking-widest text-pink-300">Happiness</p>
                                <p className="mt-1 text-lg font-black text-pink-100">{Math.floor(profilePet.happiness)}%</p>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2">
                            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-2 text-center"><p className="text-[8px] uppercase text-emerald-200/60">Focus</p><p className="text-xs font-black text-emerald-100">{profilePet.stats.focus}</p></div>
                            <div className="rounded-xl border border-blue-400/20 bg-blue-400/10 p-2 text-center"><p className="text-[8px] uppercase text-blue-200/60">Consistency</p><p className="text-xs font-black text-blue-100">{profilePet.stats.consistency}</p></div>
                            <div className="rounded-xl border border-purple-400/20 bg-purple-400/10 p-2 text-center"><p className="text-[8px] uppercase text-purple-200/60">Endurance</p><p className="text-xs font-black text-purple-100">{profilePet.stats.endurance}</p></div>
                        </div>

                        {(PET_DEFS[profilePet.type as keyof typeof PET_DEFS]?.skins.length ?? 0) > 1 && (
                            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                                <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-white/45">Skins</p>
                                <div className="grid grid-cols-5 gap-2">
                                    {PET_DEFS[profilePet.type as keyof typeof PET_DEFS].skins.map(skin => {
                                        const unlocked = profilePet.ownedSkins.includes(skin);
                                        const active = profilePet.skin === skin;
                                        return (
                                            <button
                                                key={skin}
                                                onClick={() => unlocked && equipPetSkin(profilePet.id, skin)}
                                                disabled={!unlocked}
                                                title={unlocked ? `Equip ${skin}` : `${skin} locked`}
                                                className={cn(
                                                    "relative flex h-11 items-center justify-center rounded-xl border transition-all",
                                                    active && "border-emerald-400/40 bg-emerald-400/15 ring-1 ring-emerald-400/20",
                                                    unlocked && !active && "border-white/10 bg-white/5 hover:bg-white/10",
                                                    !unlocked && "cursor-not-allowed border-white/5 bg-white/[0.02] opacity-35"
                                                )}
                                            >
                                                <img src={getPetUrl(profilePet.type as PetType, 'idle', skin)} className={cn("h-7 w-7 object-contain", !unlocked && "grayscale")} style={{ imageRendering: 'pixelated' }} />
                                                {!unlocked && <span className="absolute right-1 top-0.5 text-[8px] font-black text-white/45">LOCK</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <p className="mt-3 text-center text-[10px] uppercase tracking-wide text-white/30">Source: {profilePet.source} · {profilePet.unlockedAt ? new Date(profilePet.unlockedAt).toLocaleDateString() : 'Starter'}</p>

                        <div className="mt-5 flex gap-2">
                            {profilePet.id !== state.activePetId && (
                                <button onClick={() => equipPet(profilePet.id)} className="flex-1 rounded-xl border border-emerald-400/25 bg-emerald-400/15 px-4 py-2 text-xs font-black uppercase tracking-widest text-emerald-300 transition-colors hover:bg-emerald-400/25">
                                    Equip
                                </button>
                            )}
                            <button onClick={() => setProfilePetId(null)} className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-widest text-white/60 transition-colors hover:bg-white/10 hover:text-white">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {latestChestOpening && (
                <div className="fixed inset-0 z-[92] flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm pointer-events-auto">
                    <div className="w-full max-w-sm rounded-3xl border border-yellow-400/25 bg-black/85 p-6 text-center shadow-2xl">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-yellow-400/25 bg-yellow-400/10 text-yellow-300">
                            <Gift size={28} />
                        </div>
                        <h3 className="text-base font-black uppercase tracking-widest text-white">{latestChestOpening.type === 'rare' ? 'Rare' : 'Common'} Chest Opened</h3>
                        <div className="mt-5 grid gap-2 text-left">
                            <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-3 py-2 text-xs font-bold text-yellow-100">+{latestChestOpening.coinReward} coins</div>
                            <div className="rounded-xl border border-orange-400/20 bg-orange-400/10 px-3 py-2 text-xs font-bold text-orange-100">+{latestChestOpening.basicSnackReward} snack</div>
                            {latestChestOpening.focusBerryReward > 0 && <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-100">+{latestChestOpening.focusBerryReward} berry</div>}
                            {latestChestOpening.unlockedPetType && <div className="rounded-xl border border-purple-400/20 bg-purple-400/10 px-3 py-2 text-xs font-bold text-purple-100">{latestChestOpening.unlockedPetType} unlocked</div>}
                            {latestChestOpening.unlockedSkinPetType && latestChestOpening.unlockedSkin && <div className="rounded-xl border border-blue-400/20 bg-blue-400/10 px-3 py-2 text-xs font-bold text-blue-100">{latestChestOpening.unlockedSkinPetType} skin unlocked: {latestChestOpening.unlockedSkin}</div>}
                        </div>
                        <button onClick={clearChestOpeningEvents} className="mt-5 rounded-xl border border-yellow-400/25 bg-yellow-400/15 px-5 py-2 text-xs font-black uppercase tracking-widest text-yellow-300 transition-colors hover:bg-yellow-400/25">
                            Collect
                        </button>
                    </div>
                </div>
            )}

            {latestLevelUp && (
                <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm pointer-events-auto">
                    <div className="w-full max-w-sm rounded-3xl border border-emerald-400/25 bg-black/85 p-6 text-center shadow-2xl">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-400/10 text-emerald-300">
                            <Sparkles size={24} />
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-widest text-white">Level Up!</h3>
                        <p className="mt-2 text-sm text-white/65">{latestLevelUp.petType} reached level {latestLevelUp.level}</p>
                        <button onClick={clearLevelUpEvents} className="mt-5 rounded-xl border border-emerald-400/25 bg-emerald-400/15 px-5 py-2 text-xs font-black uppercase tracking-widest text-emerald-300 transition-colors hover:bg-emerald-400/25">
                            Nice
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
