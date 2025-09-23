import type { TimelineEvent } from '@/types/timeline'

export const demoTimelineEvents: TimelineEvent[] = [
  {
    id: 'demo-2024-midnight-runway',
    type: 'look',
    timestamp: '2024-11-12T20:30:00.000Z',
    title: '夜光序曲 · Neon Runway',
    subtitle: '雨幕与反射之间的开场造型',
    description:
      '在旧码头搭建镜面跑道，结合雨幕与冷暖双光，呈现「Midnight Reflections」主题首发造型。音乐与灯光在 120 BPM 同步，让模特与镜面倒影产生延迟的节奏感。',
    location: '上海 · 北外滩 17 号仓',
    personas: [
      {
        id: 'crew-night',
        name: 'Night Crew',
        role: '夜拍制作组',
        accentColor: '#6EA3FF',
      },
      {
        id: 'stylist-aya',
        name: 'Aya Lin',
        role: '造型指导',
        accentColor: '#F2C94C',
      },
    ],
    tags: [
      { id: 'tag-neon', name: '霓虹', color: '#9B6BFF' },
      { id: 'tag-rain', name: '雨幕', color: '#6EA3FF' },
    ],
    photos: [
      {
        id: 'demo-midnight-hero',
        src: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
        alt: '雨夜霓虹跑道上的模特',
        aspectRatio: '3/4',
      },
      {
        id: 'demo-midnight-motion',
        src: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=1200&q=80',
        alt: '水面倒影与灯光交织的表演',
        aspectRatio: '16/9',
      },
    ],
    primaryPhoto: {
      id: 'demo-midnight-hero',
      src: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1280&q=80',
      alt: '雨夜霓虹跑道上的模特',
      aspectRatio: '3/4',
    },
    highlightColor: '#6EA3FF',
    metrics: [
      { label: '造型', value: '12 LOOKS' },
      { label: '节奏', value: '120 BPM' },
    ],
    links: [
      { label: '进入主题页', href: '/themes/midnight-reflections', kind: 'theme' },
      { label: '光箱查看', href: '/lightbox?photo=demo-midnight-hero', kind: 'lightbox' },
    ],
    timelineLabel: '2024 · 夜幕',
  },
  {
    id: 'demo-2025-gilded-greenhouse',
    type: 'story',
    timestamp: '2025-03-08T07:15:00.000Z',
    title: '晨光中的金箔光束实验',
    subtitle: 'Gilded Bloom 看台首日拍摄',
    description:
      '与装置艺术家合作，在温室花房中搭建半透明光束阵列。通过慢门与手持光束器，捕捉花瓣与金箔呼吸的节奏。',
    location: '杭州 · 西溪艺术温室',
    personas: [
      {
        id: 'artist-yoko',
        name: 'Yoko Hirano',
        role: '装置艺术家',
        accentColor: '#FFAF7A',
      },
    ],
    tags: [
      { id: 'tag-golden-hour', name: '晨光', color: '#FFAF7A' },
      { id: 'tag-flower', name: '花卉', color: '#FFE8C2' },
    ],
    photos: [
      {
        id: 'demo-gilded-light',
        src: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80',
        alt: '晨光穿过纱幕照亮模特',
      },
      {
        id: 'demo-gilded-detail',
        src: 'https://images.unsplash.com/photo-1542293787938-4d2226c3d5dc?auto=format&fit=crop&w=1400&q=80',
        alt: '金箔花束与织物细节',
      },
    ],
    primaryPhoto: {
      id: 'demo-gilded-light',
      src: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1280&q=80',
      alt: '晨光穿过纱幕照亮模特',
    },
    highlightColor: '#FFAF7A',
    metrics: [
      { label: '光束密度', value: '18 条' },
      { label: '曝光', value: '1/30 · f2.8' },
    ],
    links: [
      { label: '预览 Lookbook', href: '/lightbox/story?theme=gilded-bloom', kind: 'lookbook' },
      { label: '查看主题', href: '/themes/gilded-bloom', kind: 'theme' },
    ],
    timelineLabel: '2025 · 清晨',
  },
  {
    id: 'demo-2023-exhibition',
    type: 'exhibition',
    timestamp: '2023-10-01T10:00:00.000Z',
    title: '「光谱档案」联合展览开幕',
    subtitle: '与当代艺术馆合作的多媒体展陈',
    description:
      '精选 24 组作品与动态光束装置同步展示，设置互动式 Lightbox，观众可根据标签选择不同情绪线路。',
    location: '北京 · 当代艺术馆 2F',
    personas: [
      {
        id: 'curator-chen',
        name: 'Chen Yu',
        role: '策展人',
        accentColor: '#9B6BFF',
      },
    ],
    tags: [
      { id: 'tag-exhibition', name: '展览', color: '#9B6BFF' },
      { id: 'tag-interactive', name: '互动', color: '#6EA3FF' },
    ],
    photos: [
      {
        id: 'demo-exhibition-room',
        src: 'https://images.unsplash.com/photo-1505666287802-931dc83948e0?auto=format&fit=crop&w=1400&q=80',
        alt: '展览空间中的光束装置',
        aspectRatio: '16/9',
      },
    ],
    primaryPhoto: {
      id: 'demo-exhibition-room',
      src: 'https://images.unsplash.com/photo-1505666287802-931dc83948e0?auto=format&fit=crop&w=1280&q=80',
      alt: '展览空间中的光束装置',
      aspectRatio: '16/9',
    },
    highlightColor: '#9B6BFF',
    metrics: [
      { label: '参观人数', value: '12K+' },
      { label: '互动线路', value: '6 条' },
    ],
    links: [
      { label: '展览回顾', href: '/stories/spectrum-archive', kind: 'external', target: '_blank' },
    ],
    timelineLabel: '2023 · 展览',
  },
]
