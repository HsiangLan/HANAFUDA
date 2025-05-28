
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Wand2 } from 'lucide-react';
import { generateLessonSummary, type LessonSummaryInput, type LessonSummaryOutput, type FlowResponse } from '@/ai/flows/lesson-summary-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '../ui/scroll-area';

interface LessonAiSummaryModalProps {
  lessonId: string;
  lessonTitle: string;
  triggerButton?: React.ReactNode; // Optional custom trigger
}

export function LessonAiSummaryModal({ lessonId, lessonTitle, triggerButton }: LessonAiSummaryModalProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setError(null);
    setSummary(null);

    try {
      const response: FlowResponse<LessonSummaryOutput> = await generateLessonSummary({ lessonId });
      if (response.status === 'success' && response.data) {
        setSummary(response.data.summary);
      } else {
        setError(response.error?.message || '無法獲取 AI 摘要。');
      }
    } catch (e: any) {
      console.error("Failed to generate summary:", e);
      setError(e.message || '生成摘要時發生意外錯誤。');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset state when dialog is closed
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSummary(null);
      setError(null);
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline">
            <Wand2 className="mr-2 h-4 w-4" /> AI 課程摘要
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-primary flex items-center">
            <Wand2 className="mr-2 h-5 w-5" /> AI 課程摘要：{lessonTitle}
          </DialogTitle>
          <DialogDescription>
            讓 AI 為您總結本課程的主要學習重點。
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4 space-y-4">
          {!summary && !isLoading && !error && (
            <div className="text-center py-4">
              <Button onClick={handleGenerateSummary} disabled={isLoading} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  '開始生成摘要'
                )}
              </Button>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-6">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
              <p className="text-muted-foreground">AI 正在努力為您生成摘要...</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>摘要生成失敗</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {summary && !isLoading && (
            <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-muted/20">
               <h3 className="text-lg font-semibold text-secondary mb-2">課程重點摘要：</h3>
               {summary.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-2 text-foreground leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="sm:justify-between items-center">
          {summary && !isLoading && (
             <Button onClick={handleGenerateSummary} variant="outline" disabled={isLoading}>
             {isLoading ? (
               <>
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 重新生成中...
               </>
             ) : (
               '重新生成摘要'
             )}
           </Button>
          )}
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              關閉
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
