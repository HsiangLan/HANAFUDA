
import { config } from 'dotenv';
config();

// AI flow for lesson summarization
import '@/ai/flows/lesson-summary-flow';
// AI flow for Koi-Koi opponent
import '@/ai/flows/koi-koi-ai-opponent-flow';


// Other AI flows can be imported here if needed in the future
// e.g. import '@/ai/flows/hand-analyzer-flow';
// e.g. import '@/ai/flows/game-review-flow';
