import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// mock-data.md v2 frontmatter. strictObject: 모르는 키(특히 source_ref)가 있으면 빌드 실패.
const posts = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/posts' }),
  schema: z.strictObject({
    title: z.string().min(1),
    date: z.coerce.date(),
    day: z.number().int().positive(),
    week: z.number().int().positive(),
    summary: z.string(),
    tags: z.array(z.string()),
    category: z.string(),
    series: z.string(),
    ai_generated: z.boolean(),
  }),
});

export const collections = { posts };
