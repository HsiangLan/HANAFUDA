
import {genkit, type GenkitErrorCode, type GenkitError} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
// import nextPlugin from '@genkit-ai/next'; // Temporarily commented out due to previous issues
import { z } from 'zod';

// Initialize Genkit with the Google AI plugin
export const ai = genkit({
  plugins: [
    googleAI(),
    // nextPlugin(), // Temporarily commented out
  ],
  // It's good practice to enable these for better insight during development
  enableTracing: process.env.NODE_ENV === 'development',
  // Flow state is not typically needed for production unless you have specific use cases
  // enableFlowState: true, 
});

// Helper function to check if an error is a GenkitError
export function isGenkitError(error: any): error is GenkitError {
  return error && typeof error.isGenkitError === 'boolean' && error.isGenkitError;
}

// Helper type for consistent API responses from flows
export type FlowStatus = 'success' | 'error';

export interface FlowResponse<T> {
  status: FlowStatus;
  data?: T;
  error?: {
    message: string;
    code?: GenkitErrorCode | string; // GenkitErrorCode or a custom string code
    details?: any;
  };
}
