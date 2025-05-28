
'use client';

import type { LessonContentBlock } from '@/lib/data/lessons';
// import Image from 'next/image'; // Image component removed
import { Card, CardContent } from '@/components/ui/card';

interface LessonContentDisplayProps {
  block: LessonContentBlock;
}

export function LessonContentDisplay({ block }: LessonContentDisplayProps) {
  switch (block.type) {
    case 'heading':
      return <h2 className="mt-6 mb-3 text-2xl font-semibold text-primary border-b-2 border-primary/30 pb-2">{block.value as string}</h2>;
    case 'subheading':
      return <h3 className="mt-4 mb-2 text-xl font-semibold text-secondary">{block.value as string}</h3>;
    case 'text':
      return <p className="mb-4 text-foreground leading-relaxed">{block.value as string}</p>;
    case 'image':
      // Image block is no longer rendered
      return null; 
      // Old image rendering code:
      // return (
      //   <div className="my-6 relative w-full aspect-[16/9] overflow-hidden rounded-lg shadow-md">
      //     <Image 
      //       src={block.value as string} 
      //       alt={block.aiHint ? `花札圖例：${block.aiHint}` : "課程圖片"} 
      //       fill
      //       style={{ objectFit: "contain" }}
      //       className="bg-muted"
      //       sizes=" (max-width: 768px) 100vw, 50vw"
      //       data-ai-hint={block.aiHint || "hanafuda illustration"}
      //     />
      //   </div>
      // );
    case 'video':
      return (
        <div className="my-6 aspect-video overflow-hidden rounded-lg shadow-md">
          <iframe
            width="100%"
            height="100%"
            src={block.value as string}
            title="Lesson video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="border-0"
          ></iframe>
        </div>
      );
    case 'list':
      return (
        <ul className="mb-4 list-disc pl-6 space-y-1 text-foreground">
          {(block.value as string[]).map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      );
    case 'ordered-list':
      return (
        <ol className="mb-4 list-decimal pl-6 space-y-1 text-foreground">
          {(block.value as string[]).map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ol>
      );
    default:
      return null;
  }
}
