
'use server';
/**
 * @fileOverview An AI flow to generate a summary for a given lesson.
 *
 * - generateLessonSummary - A function that handles the lesson summarization process.
 * - LessonSummaryInput - The input type for the generateLessonSummary function.
 * - LessonSummaryOutput - The return type for the generateLessonSummary function.
 */

import { ai, type FlowResponse } from '@/ai/genkit';
import { z } from 'zod';
import { getLessonById, type LessonContentBlock } from '@/lib/data/lessons';

const LessonSummaryInputSchema = z.object({
  lessonId: z.string().min(1, { message: '課程 ID 不得為空。' }),
});
export type LessonSummaryInput = z.infer<typeof LessonSummaryInputSchema>;

const LessonSummaryOutputSchema = z.object({
  summary: z.string(),
});
export type LessonSummaryOutput = z.infer<typeof LessonSummaryOutputSchema>;

const lessonSummaryPrompt = ai.definePrompt({
  name: 'lessonSummaryPrompt',
  model: 'googleai/gemini-1.5-flash-latest', // 指定使用的模型
  input: { schema: z.object({ lessonContent: z.string(), lessonTitle: z.string() }) },
  output: { schema: LessonSummaryOutputSchema },
  prompt: `您是一位樂於助人的 AI 助教，專門為學習花札（日本花牌）的學生提供協助。
請根據以下提供的課程標題和內容，為學生生成一份簡明扼要的重點摘要。
摘要應涵蓋課程的主要學習點，幫助學生快速回顧。

課程標題：{{{lessonTitle}}}

課程內容：
{{{lessonContent}}}

請生成摘要：`,
});

const lessonSummaryFlow = ai.defineFlow(
  {
    name: 'lessonSummaryFlow',
    inputSchema: LessonSummaryInputSchema,
    outputSchema: LessonSummaryOutputSchema,
  },
  async (input) => {
    const lesson = getLessonById(input.lessonId);

    if (!lesson) {
      // Consider throwing a specific error or returning a structured error object
      // For now, we'll make the summary indicate the lesson wasn't found.
      return { summary: '抱歉，找不到對應的課程內容來生成摘要。' };
    }

    // Extract text content from lesson blocks
    let fullLessonText = "";
    lesson.contentBlocks.forEach(block => {
      if (block.type === 'heading') {
        fullLessonText += `\n## ${block.value}\n`;
      } else if (block.type === 'subheading') {
        fullLessonText += `\n### ${block.value}\n`;
      } else if (block.type === 'text') {
        fullLessonText += `${block.value}\n`;
      } else if (block.type === 'list' || block.type === 'ordered-list') {
        if (Array.isArray(block.value)) {
          block.value.forEach(item => {
            fullLessonText += `- ${item}\n`;
          });
        }
      }
    });

    if (!fullLessonText.trim()) {
        return { summary: '抱歉，此課程內容似乎沒有足夠的文字來生成摘要。'};
    }

    const { output } = await lessonSummaryPrompt({ lessonContent: fullLessonText, lessonTitle: lesson.title });
    
    return output || { summary: '抱歉，目前無法生成課程摘要。請稍後再試。' };
  }
);

export async function generateLessonSummary(
  input: LessonSummaryInput
): Promise<FlowResponse<LessonSummaryOutput>> {
  try {
    const validatedInput = LessonSummaryInputSchema.parse(input);
    const result = await lessonSummaryFlow(validatedInput);
    return { status: 'success', data: result };
  } catch (error: any) {
    console.error("Error in generateLessonSummary flow:", error);
    if (error instanceof z.ZodError) {
      return {
        status: 'error',
        error: {
          message: '輸入資料驗證失敗。',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
      };
    }
    // Handle other potential errors (e.g., Genkit flow error, network issues)
    return {
      status: 'error',
      error: {
        message: error.message || '生成課程摘要時發生未知錯誤。',
        code: error.name || 'FLOW_EXECUTION_ERROR',
      },
    };
  }
}
