
'use server';
/**
 * @fileOverview An AI flow to act as a Koi-Koi opponent.
 *
 * - koiKoiAiOpponentFlow - A function that determines the AI's next move.
 * - AiKoiKoiInput - The input type for the AI flow.
 * - AiKoiKoiOutput - The return type for the AI flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Simplified card representation for AI processing
const AiCardSimplifiedSchema = z.object({
  name: z.string().describe("The full name of the card, e.g., '松上鶴' or '松雜牌1'."),
  monthValue: z.number().describe("The month value of the card (1-12)."),
  cardType: z.string().describe("The type of the card (e.g., 'hikari', 'tane', 'tanzaku-red-poem', 'kasu')."),
});
export type AiCardSimplified = z.infer<typeof AiCardSimplifiedSchema>;

const AiYakuInfoSchema = z.object({
  name: z.string().describe("The name of the Yaku formed."),
  points: z.number().describe("The point value of this Yaku before any multipliers."),
});
export type AiYakuInfo = z.infer<typeof AiYakuInfoSchema>;

const AiKoiKoiInputSchema = z.object({
  aiHand: z.array(AiCardSimplifiedSchema).describe("The AI's current hand cards."),
  fieldCards: z.array(AiCardSimplifiedSchema).describe("The cards currently on the field."),
  aiCapturedCards: z.array(AiCardSimplifiedSchema).describe("Cards already captured by the AI."),
  playerCapturedCards: z.array(AiCardSimplifiedSchema).describe("Cards captured by the player."),
  currentDeckSize: z.number().describe("Number of cards remaining in the draw pile."),
  playerScore: z.number().describe("The player's current total score for the game. The AI's goal is to reduce this to 0 or below."),
  aiScore: z.number().optional().describe("The AI's conceptual current total score for the game (used for strategic reasoning if available, but not the primary game-ending condition)."),
  currentRoundMultiplier: z.number().describe("The current Koi-Koi multiplier for this round (starts at 1)."),
  playerCalledKoiKoi: z.boolean().describe("True if the player has called Koi-Koi in the current scoring sequence."),
  aiCurrentYaku: z.array(AiYakuInfoSchema).optional().describe("Yaku currently formed by the AI this turn and their base points. This helps in Koi-Koi decision."),
  playerCurrentYaku: z.array(AiYakuInfoSchema).optional().describe("Yaku currently formed by the player and their base points. This helps in Koi-Koi decision."),
});
export type AiKoiKoiInput = z.infer<typeof AiKoiKoiInputSchema>;

const AiKoiKoiOutputSchema = z.object({
  playCardFromHand: z.object({
    cardName: z.string().describe("The name of the card the AI chooses to play from its hand."),
    matchWithFieldCardName: z.string().optional().describe("If the hand card matches a field card, the name of the field card to match with. If no match, or if playing the 4th card to capture all of a month, this **must** be omitted."),
  }).optional().describe("The AI's decision for playing a card from its hand. Omit if AI has no hand cards."),
  drawCardAction: z.object({
    matchWithFieldCardName: z.string().optional().describe("If the drawn card matches a field card, the name of the field card to match with. If no match, or if capturing all 4 of a month with the drawn card, this **must** be omitted (AI places drawn card on field or captures all 4)."),
  }).optional().describe("The AI's decision for the card drawn from the deck. Omit if deck is empty."),
  callKoiKoi: z.boolean().optional().describe("If the AI forms a Yaku, this field indicates its decision. true for Koi-Koi, false for Shobu (end round and score). Omit if no Yaku formed or decision not applicable."),
  aiThoughtProcess: z.string().describe("A brief explanation of the AI's choices or strategy for this turn. This field is **mandatory**."),
});
export type AiKoiKoiOutput = z.infer<typeof AiKoiKoiOutputSchema>;

const opponentPrompt = ai.definePrompt({
  name: 'koiKoiOpponentPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: { schema: AiKoiKoiInputSchema },
  output: { schema: AiKoiKoiOutputSchema },
  prompt: `You are an AI playing the Japanese card game Hanafuda Koi-Koi.
Your goal is to make strategic moves to form scoring combinations (Yaku) and win the round, ultimately reducing the player's score to 0 or below.

Current Game State:
AI Hand: {{json aiHand}}
Field Cards: {{json fieldCards}}
AI Captured Pile: {{json aiCapturedCards}}
Player Captured Pile: {{json playerCapturedCards}}
Deck Size: {{{currentDeckSize}}}
Player Score: {{{playerScore}}}
{{#if aiScore}}AI's Conceptual Score (for strategy): {{{aiScore}}}{{/if}}
Current Koi-Koi Multiplier: {{{currentRoundMultiplier}}}
Player has called Koi-Koi this scoring turn: {{{playerCalledKoiKoi}}}
{{#if aiCurrentYaku}}
AI's Currently Formed Yaku this turn (base points): {{json aiCurrentYaku}}
{{/if}}
{{#if playerCurrentYaku}}
Player's Currently Formed Yaku (base points): {{json playerCurrentYaku}}
{{/if}}

Your Task: Decide your move for this turn.
1.  **Play a card from your hand**:
    *   Examine your AI Hand and the Field Cards.
    *   Choose one card from your hand to play. Prioritize moves that:
        a. Complete a high-value Yaku for yourself.
        b. Prevent the player from completing a Yaku (based on their Player Captured Pile and Player's Currently Formed Yaku).
        c. Capture a high-value card (Hikari, Tane).
    *   **Capture Rule**: If this hand card matches the month (monthValue) of any card(s) on the field:
        *   **Take All Four**: If there are three cards of the same month on the field, and your hand card is the fourth card of that month, you capture all four. In this case, \`matchWithFieldCardName\` **must** be omitted. This is usually a high-priority move.
        *   **Normal Match**: Otherwise, if your hand card matches the month of a field card, you should try to capture it. Specify the 'matchWithFieldCardName'. If there are multiple field cards of the same month, choose the one that best fits your strategy (see prioritization above).
    *   If your hand card does not match any field card by month, you must still play it to the field. In this case, 'matchWithFieldCardName' **must** be omitted.
    *   If your hand is empty, omit 'playCardFromHand'.
    *   Set the 'playCardFromHand.cardName' and optionally 'playCardFromHand.matchWithFieldCardName'.

2.  **Action for the drawn card (after playing from hand, a card will be drawn from the deck by the game logic)**:
    *   Assume a card will be drawn from the deck (if currentDeckSize > 0).
    *   Decide what to do with this hypothetical drawn card, following similar strategic priorities as playing from hand (completing your Yaku, denying player, capturing value).
    *   **Capture Rule for Drawn Card**:
        *   **Take All Four**: If the drawn card could complete a set of four of the same month (i.e., there are already three on the field of that month *after* your hand play), you capture all four. In this case, \`matchWithFieldCardName\` for \`drawCardAction\` **must** be omitted. This is usually high-priority.
        *   **Normal Match**: Otherwise, if the drawn card could match any card currently on the Field Cards (or on the field *after* your hand play), specify the 'drawCardAction.matchWithFieldCardName' of the field card you would target.
    *   If no match is likely or possible for a drawn card, or if the deck is empty, 'matchWithFieldCardName' for 'drawCardAction' **must** be omitted.
    *   If deck is empty (currentDeckSize is 0), omit 'drawCardAction'.

3.  **Koi-Koi Decision (Call Koi-Koi?)**:
    *   After your hand play and the subsequent deck draw play, if you have formed one or more Yaku (scoring combinations, check AI's Currently Formed Yaku):
        *   Decide whether to call "Koi-Koi" (continue the round to score more, response field 'callKoiKoi': true) or "Shobu" (end the round and take current points, response field 'callKoiKoi': false).
        *   Consider the Player's Score, your AI's Currently Formed Yaku (and their total base points), potential for higher Yaku for yourself, the risk of the player scoring (examine Player Captured Pile and Player's Currently Formed Yaku, and their potential to form high-value Yaku), the current round multiplier, and the number of cards left in the deck.
        *   If the Player's Score is low, or you have a very high-value yaku (e.g., Goko, Shiko), Shobu might be safer to secure the win or deal significant damage.
        *   If your formed Yaku is low value and you see potential to improve (e.g., Sanko to Shiko, or adding more Tane/Tanzaku/Kasu), or if the player has a high score, Koi-Koi might be a good risk.
        *   If the player has already called Koi-Koi, you might need to be more aggressive in calling Koi-Koi back if you form a better Yaku or want to increase the stakes.
        *   If the deck is very small (e.g., < 10 cards), the risk of the player completing a yaku or the round ending without further gain for you increases, making Shobu more attractive unless your hand strongly suggests a quick high-value Yaku.
        *   If you haven't formed a Yaku, or if you are not in a position to make this decision (e.g. mid-turn), omit 'callKoiKoi'.

4.  **AI Thought Process**:
    *   You **must** provide an 'aiThoughtProcess'. Briefly explain your choices or strategy for this turn. E.g., "Played Pine Crane to match Pine Kasu. Plan to Koi-Koi if Yaku formed as player has few scoring cards and deck is large."

Output Format: Strict JSON matching the output schema.

Example JSON output for a move (normal match):
{
  "playCardFromHand": {
    "cardName": "松上鶴",
    "matchWithFieldCardName": "松雜牌1"
  },
  "drawCardAction": {
    "matchWithFieldCardName": "梅雜牌1" 
  },
  "callKoiKoi": false,
  "aiThoughtProcess": "Playing Pine Crane to match Pine Kasu. If drawn card is Plum, will match Plum Kasu. Will Shobu as player is close to Akatan."
}

Example JSON output (take all four from hand, no match with drawn card):
{
  "playCardFromHand": {
    "cardName": "松上鶴" 
  },
  "drawCardAction": {}, 
  "callKoiKoi": true,
  "aiThoughtProcess": "Playing Pine Crane to capture all four Pine cards. Drawn card will be placed on field. Calling Koi-Koi as Goko is possible."
}

Provide your JSON response now.
`,
});

const koiKoiAiOpponentFlowInternal = ai.defineFlow(
  {
    name: 'koiKoiAiOpponentFlowInternal',
    inputSchema: AiKoiKoiInputSchema,
    outputSchema: AiKoiKoiOutputSchema,
  },
  async (input) => {
    if (input.aiHand.length === 0 && input.currentDeckSize === 0) {
      return { aiThoughtProcess: "No cards in hand and deck is empty. No move possible." };
    }

    let llmResponse;
    try {
        // console.log("Requesting AI opponent move with input:", JSON.stringify(input, null, 2));
        llmResponse = await opponentPrompt(input);
        // console.log("AI opponent LLM response received:", JSON.stringify(llmResponse.output, null, 2));
    } catch (err: any) {
        console.warn(`AI opponent LLM prompt failed. Error: ${err.message || err}. Using fallback.`);
        llmResponse = { output: null }; 
    }
    
    const llmOutput = llmResponse.output;
    
    if (llmOutput && llmOutput.aiThoughtProcess) {
        // Basic validation of LLM output
        if (llmOutput.playCardFromHand && typeof llmOutput.playCardFromHand.cardName !== 'string') {
            console.warn("AI opponent LLM output malformed (playCardFromHand.cardName missing or invalid). Using fallback.");
        } else if (llmOutput.playCardFromHand && !input.aiHand.find(c => c.name === llmOutput.playCardFromHand!.cardName)) {
            console.warn(`AI opponent LLM output malformed (playCardFromHand.cardName '${llmOutput.playCardFromHand.cardName}' not in AI hand). Using fallback.`);
        }
        // Add more validation as needed for drawCardAction, etc.
        else {
            return llmOutput; 
        }
    } else {
        console.warn("AI opponent LLM output missing aiThoughtProcess or output is null. Using fallback.");
    }

    // Fallback dumb AI if prompt fails or returns malformed/incomplete output
    let playCardFromHand: AiKoiKoiOutput['playCardFromHand'] = undefined;
    let aiThought: string = "Fallback AI: ";

    if (input.aiHand.length > 0) {
      let cardToPlay: AiCardSimplified | null = null;
      let matchOnField: AiCardSimplified | null = null;
      let isTakeAllFour = false;

      // Fallback: Try to find a "Take All Four"
      for (const handC of input.aiHand) {
          const fieldCardsOfMonth = input.fieldCards.filter(fc => fc.monthValue === handC.monthValue);
          if (fieldCardsOfMonth.length === 3) { 
              cardToPlay = handC;
              isTakeAllFour = true;
              break;
          }
      }
      
      if (!isTakeAllFour) {
        for (const handC of input.aiHand) {
          const foundMatch = input.fieldCards.find(fieldC => fieldC.monthValue === handC.monthValue);
          if (foundMatch) {
            cardToPlay = handC;
            matchOnField = foundMatch;
            break;
          }
        }
      }


      if (cardToPlay) {
        if (isTakeAllFour) {
             playCardFromHand = {
                cardName: cardToPlay.name,
            };
            aiThought += `Played '${cardToPlay.name}' from hand to capture all four cards of month ${cardToPlay.monthValue}.`;
        } else if (matchOnField) { 
            playCardFromHand = {
                cardName: cardToPlay.name,
                matchWithFieldCardName: matchOnField.name,
            };
            aiThought += `Played '${cardToPlay.name}' from hand to match '${matchOnField.name}'.`;
        } else { 
            cardToPlay = cardToPlay || input.aiHand[0]; 
            playCardFromHand = {
                cardName: cardToPlay.name,
            };
            aiThought += `Played '${cardToPlay.name}' from hand (no match, placed on field).`;
        }
      } else if (input.aiHand.length > 0) { 
         cardToPlay = input.aiHand[0];
         playCardFromHand = { cardName: cardToPlay.name };
         aiThought += `Played '${cardToPlay.name}' from hand (no obvious match, placed on field).`;
      }
    } else {
      aiThought += "No cards in hand to play.";
    }

    let drawCardAction: AiKoiKoiOutput['drawCardAction'] = undefined;
    if (input.currentDeckSize > 0) {
      let potentialTakeAllFourFieldMonth: number | null = null;
      const fieldCardCounts: Record<number, number> = {};
      input.fieldCards.forEach(fc => {
        fieldCardCounts[fc.monthValue] = (fieldCardCounts[fc.monthValue] || 0) + 1;
      });
      for (const month in fieldCardCounts) {
        if (fieldCardCounts[month] === 3) {
            potentialTakeAllFourFieldMonth = parseInt(month);
            break;
        }
      }

      if (potentialTakeAllFourFieldMonth !== null) {
        drawCardAction = {}; 
        aiThought += (aiThought.length > 12 ? " " : "") + `Planning for drawn card to potentially complete a Take All Four for month ${potentialTakeAllFourFieldMonth}.`;
      } else if (input.fieldCards.length > 0) {
          drawCardAction = {
            matchWithFieldCardName: input.fieldCards[0].name 
          };
          aiThought += (aiThought.length > 12 ? " " : "") + `Planning to match drawn card with '${input.fieldCards[0].name}' if possible.`;
      } else {
          drawCardAction = {}; 
          aiThought += (aiThought.length > 12 ? " " : "") + `Planning to place drawn card on field as no field cards to match.`;
      }
    } else {
      aiThought += (aiThought.length > 12 ? " " : "") + "Deck is empty, no draw action possible.";
    }
    
    return {
      playCardFromHand,
      drawCardAction,
      callKoiKoi: false, 
      aiThoughtProcess: aiThought.trim(),
    };
  }
);

export async function koiKoiAiOpponentFlow(input: AiKoiKoiInput): Promise<AiKoiKoiOutput> {
  return koiKoiAiOpponentFlowInternal(input);
}
    