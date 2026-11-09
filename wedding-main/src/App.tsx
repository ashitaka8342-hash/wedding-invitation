'use client';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  MapPin, 
  Utensils, 
  Camera, 
  Search, 
  X, 
  ChevronRight, 
  Clock,
  Wine,
  Star,
  Coffee,
  Gift,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

// --- Types ---

interface Event {
  id: string;
  time: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface Guest {
  name: string;
  kana?: string;
}

interface Table {
  id: number;
  label: string;
  x: number;
  y: number;
  guests: Guest[];
}

interface MenuItem {
  category: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

// --- Utilities ---

const normalizeText = (text: string) => {
  return text
    .replace(/[\u30a1-\u30f6]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0x60)) // Katakana to Hiragana
    .replace(/[\s\u3000]/g, '') // Remove all spaces
    .toLowerCase();
};

const toMinutes = (timeStr: string) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// --- Static Data ---

const SCHEDULE: Event[] = [
  { id: '1', time: '13:50', title: 'Reception', description: '受付開始', icon: <Calendar className="w-4 h-4" /> },
  { id: '2', time: '14:20', title: 'Ceremony', description: '挙式', icon: <Star className="w-4 h-4" /> },
  { id: '3', time: '15:20', title: 'Grand Entrance', description: '披露宴開宴・新郎新婦入場', icon: <Star className="w-4 h-4" /> },
  { id: '4', time: '17:50', title: 'Grand Finale', description: 'お披楽喜', icon: <Clock className="w-4 h-4" /> },
];

const MENU: MenuItem[] = [
  { 
    category: 'Hors-d’œuvre', 
    title: '五感で愉しむ\nいろどりガトー仕立て\n爽やかなオレンジとはちみつのソース', 
    description: 'A colorful gateau-style appetizer to enjoy with all five senses, served with refreshing orange and honey sauce.',
    icon: <Star className="w-5 h-5" />
  },
  { 
    category: 'Soupe', 
    title: '特製コンソメスープ\nブリュノワーズと金粉', 
    description: 'Special consommé soup with brunoise vegetables and gold leaf.',
    icon: <Utensils className="w-5 h-5" />
  },
  { 
    category: 'Poisson', 
    title: '天使の海老 ムース仕立て\n帆立貝のスモーク添え', 
    description: 'Angel shrimp mousse served with smoked scallops.',
    icon: <Utensils className="w-5 h-5" />
  },
  { 
    category: 'Viande', 
    title: '牛フィレ肉のロースト\n粒マスタードのアクセント', 
    description: 'Roasted beef fillet accented with whole grain mustard.',
    icon: <Utensils className="w-5 h-5" />
  },
  { 
    category: 'Dessert', 
    title: 'フランス発祥の洋菓子\n<span class="text-sm sm:text-base">〜クレーム・シブースト・キャラメリゼ〜</span>', 
    description: 'A classic French pastry: Crème Chiboust with caramelized top.',
    icon: <Star className="w-5 h-5" />
  },
  { 
    category: 'Boulangerie', 
    title: 'パン3種', 
    description: 'Three types of freshly baked bread.',
    icon: <Utensils className="w-5 h-5" />
  },
  { 
    category: 'Café', 
    title: 'コーヒー', 
    description: 'Freshly brewed coffee.',
    icon: <Coffee className="w-5 h-5" />
  },
];

// --- Seating Data Management ---

const TABLE_LAYOUT = [
  // Row 1 (3 tables)
  { id: 1, label: 'A', x: 70, y: 70 },
  { id: 2, label: 'B', x: 175, y: 70 },
  { id: 3, label: 'C', x: 280, y: 70 },
  // Row 2 (3 tables)
  { id: 4, label: 'D', x: 70, y: 150 },
  { id: 5, label: 'E', x: 175, y: 150 },
  { id: 6, label: 'F', x: 280, y: 150 },
  // Row 3 (2 tables)
  { id: 7, label: 'G', x: 120, y: 230 },
  { id: 8, label: 'H', x: 230, y: 230 },
  // Row 4 (3 tables)
  { id: 9, label: 'I', x: 70, y: 310 },
  { id: 10, label: 'J', x: 175, y: 310 },
  { id: 11, label: 'K', x: 280, y: 310 },
  // Row 5 (3 tables)
  { id: 12, label: 'L', x: 70, y: 390 },
  { id: 13, label: 'M', x: 175, y: 390 },
  { id: 14, label: 'N', x: 280, y: 390 },
];

// Guest List (Edit this part for real data)
const GUEST_DATA: Record<number, Guest[]> = {
  1: [
    { name: '佐藤 健一', kana: 'さとう けんいち' },
    { name: '鈴木 美咲', kana: 'すずき みさき' },
    { name: '高橋 裕二', kana: 'たかはし ゆうじ' },
    { name: '田中 莉子', kana: 'たなか りこ' },
    { name: '伊藤 誠', kana: 'いとう まこと' },
    { name: '渡辺 陽子', kana: 'わたなべ ようこ' },
  ],
  2: [
    { name: '山本 拓海', kana: 'やまもと たくみ' },
    { name: '中村 結衣', kana: 'なかむら ゆい' },
    { name: '小林 剛', kana: 'こばやし つよし' },
    { name: '加藤 遥', kana: 'かとう はるか' },
    { name: '吉田 俊介', kana: 'よしだ しゅんすけ' },
    { name: '山田 舞', kana: 'やまだ まい' },
  ],
  3: [
    { name: '佐々木 大輔', kana: 'ささき だいすけ' },
    { name: '山口 詩織', kana: 'やまぐち しおり' },
    { name: '松本 浩平', kana: 'まつもと こうへい' },
    { name: '井上 真帆', kana: 'いのうえ まほ' },
    { name: '木村 健太', kana: 'きむら けん太' },
    { name: '林 恵美', kana: 'はやし えみ' },
  ],
  4: [
    { name: '斎藤 直樹', kana: 'さいとう なおき' },
    { name: '清水 杏奈', kana: 'しみず あんな' },
    { name: '山崎 竜也', kana: 'やまざき たつや' },
    { name: '森 奈々', kana: 'もり なな' },
    { name: '阿部 智也', kana: 'あべ ともや' },
    { name: '池田 瑠璃', kana: 'いけだ るり' },
  ],
  5: [
    { name: '橋本 航太', kana: 'はしもと こうた' },
    { name: '山下 美月', kana: 'やました みづき' },
    { name: '石川 圭祐', kana: 'いしかわ けいすけ' },
    { name: '中島 彩香', kana: 'なかじま あやか' },
    { name: '前田 慶一', kana: 'まえだ けいいち' },
    { name: '藤田 瑞希', kana: 'ふじた みずき' },
  ],
  6: [
    { name: '小川 裕太', kana: 'おがわ ゆうた' },
    { name: '後藤 くるみ', kana: 'ごとう くるみ' },
    { name: '岡田 亮平', kana: 'おかだ りょうへい' },
    { name: '長谷川 萌', kana: 'はせがわ もえ' },
    { name: '村上 慎吾', kana: 'むらかみ しんご' },
    { name: '近藤 佳奈', kana: 'こんどう かな' },
  ],
  7: [
    { name: '石井 貴大', kana: 'いしい たかひろ' },
    { name: '斉藤 里奈', kana: 'さいとう りな' },
    { name: '坂本 翼', kana: 'さかもと つばさ' },
    { name: '遠藤 智世', kana: 'えんどう ともよ' },
    { name: '青木 勇太', kana: 'あおき ゆうた' },
    { name: '藤井 千尋', kana: 'ふじい ちひろ' },
  ],
  8: [
    { name: '西村 雅也', kana: 'にしむら まさや' },
    { name: '福田 愛美', kana: 'ふくだ まなみ' },
    { name: '太田 拓也', kana: 'おおた たくや' },
    { name: '三浦 さくら', kana: 'みうら さくら' },
    { name: '藤原 悠人', kana: 'ふじわら ゆうと' },
    { name: '岡本 詩織', kana: 'おかもと しおり' },
  ],
  9: [
    { name: '松田 晃', kana: 'まつだ あきら' },
    { name: '中川 莉奈', kana: 'なかがわ りな' },
    { name: '中野 健吾', kana: 'なかの けんご' },
    { name: '原田 琴音', kana: 'はらだ ことね' },
    { name: '小野 裕介', kana: 'おの ゆうすけ' },
    { name: '田村 美穂', kana: 'たむら みほ' },
  ],
  10: [
    { name: '竹内 大輝', kana: 'たけうち だいき' },
    { name: '金子 陽菜', kana: 'かねこ はるな' },
    { name: '和田 拓真', kana: 'わだ たくま' },
    { name: '中山 栞', kana: 'なかやま しおり' },
    { name: '石田 隼人', kana: 'いしだ はやと' },
    { name: '上田 芽衣', kana: 'うえだ めい' },
  ],
  11: [
    { name: '森田 翔太', kana: 'もりた しょうた' },
    { name: '小島 楓', kana: 'こじま かえで' },
    { name: '柴田 隆', kana: 'しばた たかし' },
    { name: '原 紗良', kana: 'はら さら' },
    { name: '宮崎 亮', kana: 'みやざき りょう' },
  ],
  12: [
    { name: '酒井 友梨', kana: 'さかい ゆり' },
    { name: '工藤 達也', kana: 'くどう たつや' },
    { name: '横山 亜美', kana: 'よこやま あみ' },
    { name: '宮本 貴之', kana: 'みやもと たかゆき' },
    { name: '内田 結月', kana: 'うちだ ゆづき' },
  ],
  13: [
    { name: '高木 俊', kana: 'たかぎ しゅん' },
    { name: '安藤 穂乃果', kana: 'あんどう ほのか' },
    { name: '島田 翔', kana: 'しまだ しょう' },
    { name: '谷口 玲奈', kana: 'たにぐち れな' },
    { name: '大野 圭太', kana: 'おおの けいた' },
  ],
  14: [
    { name: '高田 真由', kana: 'たかだ まゆ' },
    { name: '丸山 智之', kana: 'まるやま ともゆき' },
    { name: '今井 結菜', kana: 'いまい ゆいな' },
    { name: '河野 義久', kana: 'こうの よしひさ' },
    { name: '小山 凛香', kana: 'こやま りんか' },
  ],
};

const TABLES: Table[] = TABLE_LAYOUT.map(layout => ({
  ...layout,
  guests: GUEST_DATA[layout.id] || []
}));

// --- Constants ---

const PREMIUM_TRANSITION = {
  duration: 0.5,
  ease: [0.22, 1, 0.36, 1]
};

// --- Components ---

const SectionTitle = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="mb-12 text-center">
    <motion.span 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={PREMIUM_TRANSITION}
      className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium mb-2 block"
    >
      {subtitle}
    </motion.span>
    <motion.h2 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ ...PREMIUM_TRANSITION, delay: 0.1 }}
      className="text-2xl sm:text-4xl font-serif text-champagne/90 tracking-[0.03em]"
    >
      {title}
    </motion.h2>
    <motion.div 
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ ...PREMIUM_TRANSITION, delay: 0.2 }}
      className="h-px w-12 bg-gold/50 mx-auto mt-6"
    />
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'map' | 'menu' | 'photos'>('schedule');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [clickedTableId, setClickedTableId] = useState<number | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showWelcome, setShowWelcome] = useState(false);
  
  const scheduleRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Check if welcome has been seen
  useEffect(() => {
    const seen = localStorage.getItem('wedding_welcome_seen');
    if (!seen) {
      setShowWelcome(true);
    }
  }, []);

  const handleCloseWelcome = () => {
    localStorage.setItem('wedding_welcome_seen', 'true');
    setShowWelcome(false);
  };

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Determine active event
  const activeEventId = useMemo(() => {
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    let active = SCHEDULE[0].id;
    for (const event of SCHEDULE) {
      if (currentMinutes >= toMinutes(event.time)) {
        active = event.id;
      } else {
        break;
      }
    }
    return active;
  }, [currentTime]);

  // Scroll to active event on load
  useEffect(() => {
    if (activeTab === 'schedule') {
      const element = document.getElementById(`event-${activeEventId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeTab, activeEventId]);

  const filteredTables = useMemo(() => {
    if (!searchQuery) return [];
    const normalizedQuery = normalizeText(searchQuery);
    return TABLES.filter(t => 
      t.guests.some(g => 
        normalizeText(g.name).includes(normalizedQuery) || 
        (g.kana && normalizeText(g.kana).includes(normalizedQuery))
      )
    );
  }, [searchQuery]);

  const highlightedTableIds = useMemo(() => new Set(filteredTables.map(t => t.id)), [filteredTables]);

  const matchedGuests = useMemo(() => {
    if (!searchQuery) return [];
    const normalizedQuery = normalizeText(searchQuery);
    return TABLES.flatMap(t =>
      t.guests
        .filter(g => 
          normalizeText(g.name).includes(normalizedQuery) ||
          (g.kana && normalizeText(g.kana).includes(normalizedQuery))
        )
        .map(g => ({ ...g, tableLabel: t.label, tableId: t.id }))
    );
  }, [searchQuery]);

  return (
    <div className="min-h-screen pb-24 selection:bg-gold/30">
      {/* --- Welcome Modal --- */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center px-6"
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-night/90 backdrop-blur-md"
              onClick={handleCloseWelcome}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={PREMIUM_TRANSITION}
              className="relative w-full max-w-lg glass rounded-[2rem] p-6 sm:p-10 md:p-16 text-center border-gold/20 shadow-2xl overflow-hidden"
            >
              {/* Decorative Elements */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Star className="w-8 h-8 text-gold mx-auto mb-8 opacity-50" />
                <span className="text-[10px] uppercase tracking-[0.5em] text-gold mb-6 block font-medium">
                  Welcome to our Wedding
                </span>
                
                <div className="space-y-6 mb-12">
                  <p className="text-champagne/85 text-lg md:text-xl font-serif leading-relaxed tracking-[0.03em]">
                    本日はご多用の中 ご列席いただき<br/>
                    誠にありがとうございます
                  </p>
                  <p className="text-champagne/60 text-sm font-serif italic leading-relaxed tracking-[0.03em]">
                    皆様と過ごすこのひとときが<br/>
                    素晴らしい思い出となりますように
                  </p>
                  <p className="text-champagne/40 text-xs font-serif leading-relaxed tracking-[0.03em]">
                    心ばかりのおもてなしではございますが<br/>
                    どうぞごゆっくりお楽しみください
                  </p>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <div className="h-px w-12 bg-gold/30 mb-4" />
                  <div className="text-gold font-serif tracking-[0.3em] text-base sm:text-xl md:text-2xl mb-10 flex items-center justify-center gap-4">
                    <span>YASUTAKA</span>
                    <span>AMI</span>
                  </div>
                </div>

                <motion.button
                  onClick={handleCloseWelcome}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="relative inline-flex items-center justify-center px-16 sm:px-24 py-5 sm:py-7 rounded-full overflow-hidden transition-all duration-700 shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
                >
                  <div className="absolute inset-0 bg-gold opacity-10 transition-opacity" />
                  <div className="absolute inset-0 border border-gold/30 rounded-full" />
                  <span className="relative text-gold text-lg sm:text-xl md:text-2xl tracking-[0.6em] font-serif font-medium">ご入場</span>
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Header --- */}
      <header className="pt-20 pb-12 px-6 text-center relative overflow-hidden">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 -z-10"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.08)_0%,transparent_70%)]" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...PREMIUM_TRANSITION, duration: 1 }}
        >
          <span className="text-[10px] uppercase tracking-[0.5em] bronze-text-gradient mb-4 block font-medium">
            Wedding Celebration
          </span>
          <div className="flex flex-col items-center mb-6 uppercase tracking-[0.2em]">
            <span className="text-3xl sm:text-5xl md:text-7xl font-serif gold-text-gradient tracking-[0.03em]">YASUTAKA</span>
            <span className="text-3xl sm:text-5xl md:text-7xl font-serif gold-text-gradient tracking-[0.03em]">AMI</span>
          </div>
          <p className="text-bronze font-serif italic text-lg tracking-widest">
            2027.03.21
          </p>
        </motion.div>
      </header>

      {/* --- Main Content --- */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pb-6 min-h-screen">
        <AnimatePresence mode="wait">
          {activeTab === 'schedule' && (
            <motion.section
              key="schedule"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={PREMIUM_TRANSITION}
              className="py-8"
            >
              <SectionTitle title="Schedule" subtitle="タイムライン" />
              <div className="relative space-y-12 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
                {SCHEDULE.map((event, index) => {
                  const isActive = event.id === activeEventId;
                  
                  return (
                    <motion.div
                      key={event.id}
                      id={`event-${event.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ 
                        ...PREMIUM_TRANSITION,
                        delay: index * 0.05
                      }}
                      className={`relative flex items-start w-full transition-all duration-700 ${isActive ? '' : 'opacity-40 grayscale'}`}
                    >
                      {/* Timeline Icon */}
                      <div className={`absolute left-4 -translate-x-1/2 top-0 w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all duration-700 ${isActive ? 'bg-gold gold-glow text-night ring-4 ring-gold/20' : 'bg-white/5 text-off-white/40 border border-white/10'}`}>
                        {event.icon}
                      </div>

                      {/* Horizontal Connector Line */}
                      <div className={`absolute left-8 top-4 w-8 h-px transition-all duration-700 ${isActive ? 'bg-gold/40' : 'bg-white/10'}`} />

                      {/* Content Box */}
                      <div className="w-full pl-20">
                        <div className="relative z-20">
                          <span className={`font-mono text-sm tracking-widest block mb-1 transition-all duration-700 ${isActive ? 'text-gold' : 'text-off-white/40'}`}>
                            {event.time}
                          </span>
                          <h3 className={`text-xl font-serif mb-1 leading-tight transition-all duration-700 tracking-[0.03em] ${isActive ? 'text-champagne/90' : 'text-champagne/60'}`}>
                            {event.title}
                          </h3>
                          <p className="text-sm text-off-white/40 tracking-wide leading-relaxed transition-all duration-700 whitespace-pre-line">
                            {event.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-16 p-6 border border-gold/30 rounded-2xl bg-gold/5 text-center"
              >
                <h3 className="text-xl font-serif mb-3 text-gold">Hands-Free Gift</h3>
                <p className="text-sm text-off-white/60 tracking-wide leading-relaxed whitespace-pre-line">
                  引き出物（後日配送）<br/>
                  身軽に一日を楽しんでいただけるよう、<br/>
                  お品物は後日ご自宅へお届けします。<br/>
                  本日は「余韻」だけを大切に<br/>
                  お持ち帰りください。
                </p>
              </motion.div>
            </motion.section>
          )}

          {activeTab === 'map' && (
            <motion.section
              key="map"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={PREMIUM_TRANSITION}
              className="py-8"
            >
              <SectionTitle title="Seating" subtitle="席次表" />
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-6 border border-terracotta/40 rounded-2xl bg-gradient-to-br from-teal/20 to-terracotta/5 text-center shadow-[0_0_30px_rgba(179,90,51,0.1)] relative overflow-hidden"
              >
                <h4 className="text-xl font-serif mb-3 text-gold tracking-[0.1em]">Free Seating</h4>
                <p className="text-sm text-champagne/90 leading-relaxed">
                  <span className="underline decoration-gold/50 underline-offset-4">指定テーブル内は</span><span className="text-gold font-bold">「自由席」</span>です。<br/>
                  形式にとらわれず、心地よいお席で<br/>
                  会話と出会いをお楽しみください。
                </p>
              </motion.div>

              {/* Search Bar */}
              <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-off-white/30" />
                <input 
                  type="text"
                  placeholder="お名前で検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className="w-full bg-white/10 border border-amber/30 rounded-full py-4 pl-12 pr-6 text-base focus:outline-none focus:border-amber/60 placeholder:text-champagne/30"
                />
                {searchQuery && (
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-off-white/30" />
                  </motion.button>
                )}
              </div>

              {searchQuery && matchedGuests.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 space-y-2"
                >
                  {matchedGuests.map((g, i) => (
                    <motion.button
                      key={`${g.name}-${i}`}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => {
                        setClickedTableId(g.tableId);
                        setSearchQuery(''); 
                        
                        // Use timeout to wait for search results to disappear and layout to stabilize
                        setTimeout(() => {
                          if (mapContainerRef.current) {
                            mapContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }, 100);
                      }}
                      className="w-full flex items-center justify-between p-4 glass rounded-xl text-base"
                    >
                      <div className="flex flex-col items-start">
                        <span className="text-[11px] text-gold/70 uppercase tracking-widest">{g.kana}</span>
                        <span className="text-champagne font-medium text-lg">{g.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-champagne/50 text-sm">Table</span>
                        <span className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center text-gold font-serif text-lg">
                          {g.tableLabel}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              )}

              {searchQuery && filteredTables.length === 0 && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-off-white/40 mb-8 text-sm"
                >
                  お名前が見つかりませんでした。スタッフへお声がけください。
                </motion.p>
              )}

              {/* Map Container */}
              <div ref={mapContainerRef} className="relative aspect-[4/5] glass rounded-3xl overflow-hidden">
                <div className="w-full h-full">
                  <svg viewBox="0 0 400 500" className="w-full h-full">
                    {/* Background Grid/Stars */}
                    <defs>
                      <radialGradient id="tableGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(255, 191, 0, 0.25)" />
                        <stop offset="70%" stopColor="rgba(255, 191, 0, 0.05)" />
                        <stop offset="100%" stopColor="transparent" />
                      </radialGradient>
                      <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFF6D5" />
                        <stop offset="40%" stopColor="#D4AF37" />
                        <stop offset="70%" stopColor="#B8962E" />
                        <stop offset="100%" stopColor="#FFF6D5" />
                      </linearGradient>
                      <radialGradient id="ceramicGradient" cx="30%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#D9D2C5" />
                        <stop offset="100%" stopColor="#BDB5A7" />
                      </radialGradient>
                      <radialGradient id="amberGradient" cx="30%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#FFBF00" />
                        <stop offset="100%" stopColor="#B35A33" />
                      </radialGradient>
                      <filter id="shadow">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.5"/>
                      </filter>
                    </defs>

                    {/* Venue Layout Elements */}
                    {/* Main Table (Right Center) */}
                    <rect x="365" y="150" width="24" height="200" rx="12" fill="rgba(212, 175, 55, 0.25)" stroke="#D4AF37" strokeWidth="1.5" />
                    <text x="377" y="250" textAnchor="middle" dominantBaseline="middle" className="text-[12px] fill-bronze font-serif font-bold tracking-[0.1em] [writing-mode:vertical-rl] [text-orientation:upright]">MAIN TABLE</text>

                    {/* Gates (Right Side Top & Bottom) */}
                    <rect x="385" y="40" width="15" height="60" rx="2" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                    <text x="392.5" y="70" textAnchor="middle" dominantBaseline="middle" className="text-[11px] fill-off-white/50 font-serif font-bold [writing-mode:vertical-rl] [text-orientation:upright]">GATE</text>
                    
                    <rect x="385" y="400" width="15" height="60" rx="2" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                    <text x="392.5" y="430" textAnchor="middle" dominantBaseline="middle" className="text-[11px] fill-off-white/50 font-serif font-bold [writing-mode:vertical-rl] [text-orientation:upright]">GATE</text>

                    {/* Bar Counter (Left Center) */}
                    <rect x="0" y="150" width="24" height="200" rx="4" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="2,2" />
                    <text x="12" y="250" textAnchor="middle" dominantBaseline="middle" className="text-[12px] fill-off-white/60 font-serif font-bold tracking-[0.1em] [writing-mode:vertical-rl] [text-orientation:upright]">BAR COUNTER</text>

                    {TABLES.map((table) => {
                      const isHighlighted = highlightedTableIds.has(table.id) || clickedTableId === table.id;
                      const isSelected = selectedTable?.id === table.id;
                      const normalizedQuery = searchQuery ? normalizeText(searchQuery) : '';
                      const isMatchedBySearch = normalizedQuery && table.guests.some(g => 
                        normalizeText(g.name).includes(normalizedQuery) || 
                        (g.kana && normalizeText(g.kana).includes(normalizedQuery))
                      );
                      
                      return (
                        <motion.g
                          key={table.id}
                          onClick={() => {
                            setSelectedTable(table);
                            setClickedTableId(null);
                          }}
                          className="cursor-pointer"
                          filter="drop-shadow(0 0 6px rgba(212,175,55,0.15))"
                          animate={{
                            scale: clickedTableId === table.id ? 1.08 : 1,
                          }}
                          transition={PREMIUM_TRANSITION}
                        >
                          {/* Breathing Light Effect */}
                          <motion.circle
                            cx={table.x}
                            cy={table.y}
                            r={28}
                            fill="none"
                            strokeWidth={1.5}
                            animate={{
                              opacity: [0.3, 0.7, 0.3],
                              scale: [1, 1.03, 1],
                              stroke: clickedTableId === table.id ? "rgba(255,255,255,0.9)" : "rgba(212,175,55,0.6)"
                            }}
                            transition={{
                              opacity: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
                              scale: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
                              stroke: PREMIUM_TRANSITION
                            }}
                          />

                          {/* Glow Layer */}
                          <motion.circle
                            cx={table.x}
                            cy={table.y}
                            r={32}
                            fill="url(#tableGradient)"
                            animate={{
                              opacity: isSelected ? 0.6 : 0
                            }}
                            transition={PREMIUM_TRANSITION}
                          />

                          {/* Outer Ring (Jewel Border) */}
                          <motion.circle
                            cx={table.x}
                            cy={table.y}
                            r={28}
                            fill="none"
                            stroke="url(#goldBorder)"
                            strokeWidth={1.5}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: isSelected || isMatchedBySearch ? 1 : 0.3 }}
                            transition={PREMIUM_TRANSITION}
                          />

                          {(isHighlighted || isMatchedBySearch) && (
                            <motion.circle
                              cx={table.x}
                              cy={table.y}
                              r={35}
                              fill="url(#tableGradient)"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={PREMIUM_TRANSITION}
                            />
                          )}
                          <motion.circle
                            cx={table.x}
                            cy={table.y}
                            r={24}
                            filter="url(#shadow)"
                            initial={false}
                            animate={{
                              fill: isSelected || clickedTableId === table.id ? '#FFBF00' : '#D9D2C5',
                              stroke: isMatchedBySearch ? '#FFBF00' : 'rgba(212, 175, 55, 0.3)',
                              strokeWidth: isMatchedBySearch ? 2 : 1
                            }}
                            transition={PREMIUM_TRANSITION}
                          />
                          <text
                            x={table.x}
                            y={table.y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className={`text-[18px] font-serif font-bold pointer-events-none transition-colors duration-500 ${isSelected || clickedTableId === table.id ? 'fill-night' : 'fill-night/80'}`}
                          >
                            {table.label}
                          </text>
                        </motion.g>
                      );
                    })}
                  </svg>
                </div>
                <div className="absolute bottom-6 left-0 right-0 pointer-events-none">
                  <p className="text-center text-[10px] text-champagne/40 font-serif tracking-widest">
                    テーブルをタップすると、名簿がポップアップします。
                  </p>
                </div>
              </div>

              {/* Table Details Card */}
              <AnimatePresence>
                {selectedTable && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="fixed inset-x-6 bottom-32 z-[150] glass rounded-3xl p-6 shadow-2xl"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber to-terracotta rounded-full flex items-center justify-center text-night font-serif text-2xl shadow-lg">
                          {selectedTable.label}
                        </div>
                        <h4 className="text-2xl font-serif">Table</h4>
                      </div>
                      <motion.button 
                        onClick={() => setSelectedTable(null)} 
                        whileTap={{ scale: 0.9 }}
                        className="p-2 rounded-full"
                      >
                        <X className="w-5 h-5 text-off-white/40" />
                      </motion.button>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      {selectedTable.guests.map((guest, i) => (
                        <div key={i} className="flex flex-col">
                          <span className="text-[11px] text-gold/70 uppercase tracking-widest">{guest.kana}</span>
                          <span className="text-champagne font-medium text-lg">{guest.name}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          )}

          {activeTab === 'menu' && (
            <motion.section
              key="menu"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={PREMIUM_TRANSITION}
              className="py-8"
            >
              <SectionTitle title="Menu" subtitle="お料理" />

              {/* Drinks Section */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-16 p-8 glass rounded-3xl text-center"
              >
                <h4 className="text-xl font-serif mb-4">Free Drink</h4>
                <p className="text-sm text-champagne/60 leading-relaxed">
                  ビール / ワイン (赤・白) / ウィスキー<br/>
                  日本酒 / 焼酎 / カクテル各種<br/>
                  ソフトドリンク各種
                </p>
              </motion.div>

              <div className="space-y-4">
                {MENU.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: (i % 3) * 0.05, ...PREMIUM_TRANSITION }}
                    className="text-center"
                  >
                    <span className="text-[10px] uppercase tracking-[0.4em] text-gold/60 mb-1 block">
                      {item.category}
                    </span>
                    <h3 
                      className="text-lg sm:text-xl font-serif mb-2 text-champagne/90 tracking-[0.03em] whitespace-pre-line leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: item.title }}
                    />
                    <p className="text-sm text-champagne/30 italic font-serif max-w-xs mx-auto leading-relaxed">
                      {item.description}
                    </p>
                    {i < MENU.length - 1 && (
                      <div className="w-px h-4 bg-gradient-to-b from-gold/20 to-transparent mx-auto mt-4" />
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
          {activeTab === 'photos' && (
            <motion.section
              key="photos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={PREMIUM_TRANSITION}
              className="py-8"
            >
              <SectionTitle title="Photo Hub" subtitle="写真共有" />
              
              <div className="space-y-8">
                <p className="text-center text-off-white/60 font-serif italic leading-relaxed">
                  本日の大切な思い出を、<br/>
                  ぜひ皆様でシェアしてください。<br/>
                  <span className="underline decoration-gold/40 underline-offset-4">下のボタンから共有アルバムへ移動できます。</span>
                </p>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8"
                >
                  <motion.a 
                    href="https://photos.app.goo.gl/4C1K3chYcjSvjkFi7" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="relative block w-full p-px rounded-2xl overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-gold via-gold-light to-gold animate-gradient-x" />
                    <div className="relative bg-night rounded-[15px] py-8 px-8 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center text-gold mb-6">
                        <Camera className="w-8 h-8" />
                      </div>
                      <span className="text-xs text-gold uppercase tracking-[0.3em] block mb-2">Google Photos</span>
                      <span className="text-2xl font-serif text-off-white/90 mb-4 tracking-[0.03em]">思い出をシェアする</span>
                      <div className="flex items-center gap-2 text-gold/60 text-sm">
                        <span>Happiness to share</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </motion.a>
                </motion.div>

                <div className="glass rounded-3xl p-8 text-center">
                  <Star className="w-5 h-5 text-gold mx-auto mb-4" />
                  <h4 className="text-lg font-serif mb-2 text-off-white">How to Share</h4>
                  <p className="text-sm text-off-white/40 leading-relaxed">
                    1. 上のボタンをタップしてアルバムを開く<br/>
                    2. 「共有」または「＋」ボタンから<br/>
                    写真を追加<br/>
                    3. 皆様で素敵な思い出を共有しましょう<br/>
                    <span className="text-gold/60 mt-2 block">※LINEで送ってくださっても構いません</span>
                  </p>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* --- Bottom Navigation --- */}
      <nav className={`fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md z-[100] transition-all duration-500 ${isInputFocused ? 'opacity-0 pointer-events-none translate-y-10' : 'opacity-100'}`}>
        <div className="glass rounded-full p-2 flex items-center justify-between shadow-2xl border-white/10 bg-night/40 backdrop-blur-2xl">
          <NavButton 
            active={activeTab === 'schedule'} 
            onClick={() => setActiveTab('schedule')}
            icon={<Calendar className="w-5 h-5" />}
            label="Schedule"
          />
          <NavButton 
            active={activeTab === 'map'} 
            onClick={() => setActiveTab('map')}
            icon={<MapPin className="w-5 h-5" />}
            label="Seat Map"
          />
          <NavButton 
            active={activeTab === 'menu'} 
            onClick={() => setActiveTab('menu')}
            icon={<Utensils className="w-5 h-5" />}
            label="Menu"
          />
          <NavButton 
            active={activeTab === 'photos'} 
            onClick={() => setActiveTab('photos')}
            icon={<Camera className="w-5 h-5" />}
            label="Photos"
          />
        </div>
      </nav>

      {/* --- Background Stars --- */}
      <div className="fixed inset-0 -z-20 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: Math.random() }}
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ 
              duration: 2 + Math.random() * 3, 
              repeat: Infinity,
              delay: Math.random() * 5
            }}
            className="absolute w-px h-px bg-white rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className={`relative flex-1 flex flex-col items-center justify-center py-2 rounded-full transition-all duration-500 ${active ? 'text-gold' : 'text-champagne/40'}`}
    >
      {active && (
        <motion.div
          layoutId="nav-bg"
          className="absolute inset-0 bg-gradient-to-br from-gold/20 to-bronze/10 rounded-full border border-gold/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]"
          transition={PREMIUM_TRANSITION}
        />
      )}
      <div className={`relative z-10 mb-1 transition-colors duration-500 ${active ? 'text-bronze' : 'text-gold/40'}`}>
        {icon}
      </div>
      <span className={`relative z-10 text-[9px] uppercase tracking-widest font-serif font-medium transition-colors duration-500 ${active ? 'text-bronze' : ''}`}>
        {label}
      </span>
    </motion.button>
  );
}
