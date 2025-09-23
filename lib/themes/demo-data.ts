import type { ThemeCollection } from '@/types/themes'

export const demoThemeCollections: ThemeCollection[] = [
  {
    id: 'theme-midnight-reflections',
    slug: 'midnight-reflections',
    title: 'Midnight Reflections',
    summary: '以深蓝与金属光泽描绘夜色下的城市与人物关系，记录霓虹与雨幕交叠的瞬间。',
    tags: ['夜色', '金属质感', '城市'],
    palette: {
      primary: '#6EA3FF',
      secondary: '#F2C94C',
      background: '#040610',
      highlight: '#9B6BFF',
    },
    hero: {
      kicker: 'Theme 01',
      title: '夜幕下的闪光记忆',
      subtitle: 'Midnight Reflections',
      description:
        '灯影与雨滴形成的光晕将人物与街道包裹。我们挑选 12 套夜间造型，结合镜面倒影与低频节奏，呈现夜色的金属诗意。',
      background: {
        type: 'video',
        src: 'https://cdn.cctribe.cc/demo/themes/midnight-reflections/hero-loop.mp4',
        poster: 'https://cdn.cctribe.cc/demo/themes/midnight-reflections/hero-poster.jpg',
        alt: '夜色城市路面上的模特背影与霓虹反射',
        overlayColor: 'rgba(10, 12, 24, 0.55)',
      },
      metrics: [
        { label: '造型', value: '12 Looks' },
        { label: '拍摄日期', value: '2024-12' },
        { label: '城市', value: 'Shanghai' },
      ],
      actions: [
        {
          label: '加入收藏',
          href: '/photos?collection=midnight-reflections',
          accentColor: '#F2C94C',
        },
        {
          label: '播放 Lookbook',
          href: '/lightbox/story?theme=midnight-reflections',
          target: '_blank',
        },
      ],
    },
    soundtrack: {
      title: 'Neon Pulse',
      artist: 'Aya Lin',
      src: 'https://cdn.cctribe.cc/demo/audio/neon-pulse.mp3',
      durationSeconds: 168,
      coverImage: 'https://cdn.cctribe.cc/demo/themes/midnight-reflections/soundtrack.jpg',
    },
    chapters: [
      {
        id: 'chapter-arrival',
        title: '霓虹初遇',
        subtitle: '湿漉街头的第一束光',
        kicker: 'Chapter 01',
        variant: 'spotlight',
        body: [
          '镜头贴近潮湿路面，金属质感的风衣在街灯下折射出蓝紫色光芒。超广角镜头放大了地面的倒影，人物与路灯形成浅焦对位。',
          '我们使用手持光棒补光，维持肤色质感，同时让雨滴的高光更加突出。',
        ],
        media: [
          {
            id: 'arrival-primary',
            type: 'image',
            src: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80',
            alt: '雨夜城市中穿着金属风雨衣的模特',
            aspectRatio: '3/4',
          },
        ],
        metrics: [
          { label: '镜头', value: '24mm' },
          { label: '光圈', value: 'f/1.8' },
        ],
        actions: [
          {
            label: '查看同色系造型',
            href: '/photos?palette=midnight-gold',
          },
        ],
      },
      {
        id: 'chapter-echo',
        title: '反射回声',
        subtitle: '镜面走廊中的节奏分割',
        variant: 'gallery',
        body: [
          '通过镜面装置制造多重影像，让模特的动作形成节奏感。我们将音乐节拍与快门同步，捕捉步伐之间的连贯动态。',
        ],
        media: [
          {
            id: 'echo-a',
            type: 'image',
            src: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d4?auto=format&fit=crop&w=1200&q=80',
            alt: '镜面房间中的模特与霓虹光',
          },
          {
            id: 'echo-b',
            type: 'image',
            src: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
            alt: '多重曝光的蓝色霓虹影像',
          },
          {
            id: 'echo-c',
            type: 'video',
            src: 'https://cdn.cctribe.cc/demo/themes/midnight-reflections/echo-loop.mp4',
            poster: 'https://cdn.cctribe.cc/demo/themes/midnight-reflections/echo-poster.jpg',
            alt: '模特在镜面前转身的循环视频',
            loop: true,
            autoplay: true,
          },
        ],
        actions: [
          {
            label: '进入 Lightbox',
            href: '/lightbox?photo=echo-a',
          },
        ],
      },
      {
        id: 'chapter-quote',
        title: '摄影师访谈',
        variant: 'quote',
        quote: {
          text: '雨夜的霓虹其实很安静，我们做的是把低频节奏可视化，让观者看到音乐在空间里的流动。',
          author: 'Kira Zhou',
          role: '创意摄影师',
        },
        media: [
          {
            id: 'quote-portrait',
            type: 'image',
            src: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
            alt: '摄影师在灯光前的肖像',
          },
        ],
        actions: [
          {
            label: '阅读幕后故事',
            href: '/stories/midnight-reflections/interview',
          },
        ],
      },
      {
        id: 'chapter-timeline',
        title: '夜色纵横',
        variant: 'timeline-snapshot',
        body: [
          '从 2022 年的「金属年轮」系列开始，我们持续在夜间尝试光影实验。此次主题整合了过往三次夜拍计划的经验，并引入舞蹈编导协作。',
        ],
        timeline: {
          year: '2022-2024',
          description: '三次夜拍创作计划，全景记录夜色语汇演变。',
          href: '/timeline?persona=night-series',
        },
        media: [
          {
            id: 'timeline-collage',
            type: 'image',
            src: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1400&q=80',
            alt: '多张夜拍作品拼贴',
          },
        ],
        actions: [
          {
            label: '查看时间线',
            href: '/timeline?collection=midnight-reflections',
          },
        ],
      },
    ],
    relatedCollections: [
      {
        slug: 'chromatic-dawn',
        title: 'Chromatic Dawn',
        summary: '清晨迷雾中的粉蓝与暖金交汇，轻盈而锐利。',
        coverImage: 'https://cdn.cctribe.cc/demo/themes/chromatic-dawn/cover.jpg',
        accentColor: '#FFB8A1',
      },
    ],
    seo: {
      description: 'Midnight Reflections 主题以霓虹、雨幕与节奏光影打造 12 套夜间造型，展现都市夜色的细腻质感。',
      keywords: ['夜景摄影', '霓虹', 'Lookbook'],
      shareImage: 'https://cdn.cctribe.cc/demo/themes/midnight-reflections/share.jpg',
    },
    updatedAt: '2025-09-20T12:00:00.000Z',
  },
  {
    id: 'theme-gilded-bloom',
    slug: 'gilded-bloom',
    title: 'Gilded Bloom',
    summary: '晨光与金箔呼吸之间的柔和光影，将花卉与织物层次交织成温暖的篇章。',
    tags: ['晨光', '肌理', '自然'],
    palette: {
      primary: '#FFAF7A',
      secondary: '#FFE8C2',
      background: '#1E140A',
      highlight: '#FFDB92',
    },
    hero: {
      kicker: 'Theme 02',
      title: '金箔花影的呼吸',
      subtitle: 'Gilded Bloom',
      description:
        '在晨光下搭建半透明花房，通过镜面金箔与柔焦滤镜捕捉光束折射。我们以慢门记录花瓣律动，让造型与自然共振。',
      background: {
        type: 'image',
        src: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1600&q=80',
        alt: '晨光穿过花房的暖色调画面',
        overlayColor: 'rgba(40, 24, 10, 0.55)',
      },
      metrics: [
        { label: '造型', value: '9 Looks' },
        { label: '场景', value: '温室花房' },
        { label: '光感', value: 'Golden Hour' },
      ],
      actions: [
        {
          label: '预览 Lookbook',
          href: '/lightbox/story?theme=gilded-bloom',
        },
        {
          label: '加入对比',
          href: '/photos?compare=gilded-bloom',
        },
      ],
    },
    chapters: [
      {
        id: 'chapter-light',
        title: '光束雕塑',
        subtitle: '晨雾中的光束切面',
        kicker: 'Chapter 01',
        variant: 'spotlight',
        body: [
          '镜前布置半透明纱幕，借助干冰制造柔和雾气，使光束呈现雕塑般的形状。模特手部动作与光束相互呼应，形成动态线条。',
        ],
        media: [
          {
            id: 'light-primary',
            type: 'image',
            src: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80',
            alt: '晨光穿过纱幕照亮模特侧颜',
          },
        ],
        metrics: [
          { label: '快门', value: '1/30' },
          { label: '滤镜', value: 'Pro-Mist 1/4' },
        ],
      },
      {
        id: 'chapter-palette',
        title: '花序调色板',
        variant: 'gallery',
        body: [
          '以金属箔片与花卉结合，把自然肌理与服装材质并置。我们选取三种色温，分别对应晨光、日光与人造补光，构建立体的色彩序列。',
        ],
        media: [
          {
            id: 'palette-a',
            type: 'image',
            src: 'https://images.unsplash.com/photo-1542293787938-4d2226c3d5dc?auto=format&fit=crop&w=1200&q=80',
            alt: '覆有金箔的花束特写',
          },
          {
            id: 'palette-b',
            type: 'image',
            src: 'https://images.unsplash.com/photo-1495873361153-35f1f7e3e3ad?auto=format&fit=crop&w=1200&q=80',
            alt: '暖色调布景中的模特倚靠在花卉旁',
          },
          {
            id: 'palette-c',
            type: 'image',
            src: 'https://images.unsplash.com/photo-1527153907022-465ee4752fdc?auto=format&fit=crop&w=1200&q=80',
            alt: '金箔与丝绸材质的细节',
          },
        ],
      },
      {
        id: 'chapter-whisper',
        title: '花房絮语',
        variant: 'quote',
        quote: {
          text: '我们尝试把花瓣呼吸的节奏转化成音乐，再让模特跟着节奏起伏。慢门和三脚架的配合，让每一次吸气都能留下轨迹。',
          author: 'Yoko Hirano',
          role: '现场导演',
        },
        media: [
          {
            id: 'whisper-audio',
            type: 'audio',
            src: 'https://cdn.cctribe.cc/demo/themes/gilded-bloom/whisper-ambience.mp3',
            alt: '花房氛围声音',
          },
        ],
      },
      {
        id: 'chapter-snapshot',
        title: '温暖延伸',
        variant: 'timeline-snapshot',
        body: [
          '「Gilded Bloom」延续了我们在《晨光档案》中建立的光感语言，并为即将到来的合作展预热。章节尾声引向新的花卉造型实验。',
        ],
        timeline: {
          year: '2023-2025',
          description: '「晨光档案」系列延伸项目，与自然装置艺术家联合完成。',
          href: '/timeline?collection=gilded-bloom',
        },
        media: [
          {
            id: 'snapshot-collage',
            type: 'image',
            src: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=1400&q=80',
            alt: '花卉造型与金箔纹理的拼贴',
          },
        ],
      },
    ],
    seo: {
      description: 'Gilded Bloom 主题以晨光、金箔与花卉结构打造 9 套温暖造型，呈现自然与时尚的共鸣。',
      keywords: ['Lookbook', 'Golden Hour', '花卉造型'],
      shareImage: 'https://cdn.cctribe.cc/demo/themes/gilded-bloom/share.jpg',
    },
    createdAt: '2025-08-14T09:00:00.000Z',
    updatedAt: '2025-09-18T17:30:00.000Z',
  },
]
