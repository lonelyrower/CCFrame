import type { LookbookTemplate } from '@/types/lookbook'

export const lookbookTemplates: LookbookTemplate[] = [
  {
    id: 'poster-midnight-neon',
    kind: 'poster',
    name: 'Midnight Neon Poster',
    description: '单页 A2 视觉海报，突出主角造型与核心色板，适合快速分享最新主题。',
    aspectRatio: '3:4',
    pageCount: 1,
    formats: ['pdf', 'png'],
    defaultFormat: 'pdf',
    previewImage: 'https://cdn.cctribe.cc/demo/lookbook/poster-midnight.jpg',
  },
  {
    id: 'brochure-gilded-bloom',
    kind: 'brochure',
    name: 'Gilded Bloom 双页手册',
    description: '双页 Lookbook，左页讲述花房故事，右页展示关键造型，适合线下活动派发。',
    aspectRatio: '2:1',
    pageCount: 2,
    formats: ['pdf'],
    defaultFormat: 'pdf',
    previewImage: 'https://cdn.cctribe.cc/demo/lookbook/brochure-gilded.jpg',
  },
  {
    id: 'social-motion-trail',
    kind: 'social',
    name: 'Motion Trail 分享卡片',
    description: '1:1 社交媒体动图模板，突出慢门轨迹与造型亮点，支持导出 PNG 进行二次编辑。',
    aspectRatio: '1:1',
    pageCount: 1,
    formats: ['png'],
    defaultFormat: 'png',
    previewImage: 'https://cdn.cctribe.cc/demo/lookbook/social-motion.png',
  },
]

export function getLookbookTemplateById(templateId: string): LookbookTemplate | undefined {
  return lookbookTemplates.find((template) => template.id === templateId)
}