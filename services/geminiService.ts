import { GoogleGenAI } from "@google/genai";
import { type ProcessedData } from '../types';

const MAX_INPUT_LENGTH = 250000; // Character limit for the input data

export async function generateSqlFromData(csvData: string, customPrompt: string): Promise<ProcessedData> {
  if (csvData.length > MAX_INPUT_LENGTH) {
    throw new Error(
      `Input data is too large (${(csvData.length / 1024).toFixed(
        0
      )} KB). Please provide a file with less than 250 KB of text content.`
    );
  }

  // Initialize the AI client here to ensure it's fresh for every call
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const userPromptSection = customPrompt.trim()
  ? `
    ---
    IMPORTANT USER INSTRUCTIONS:
    The user has provided specific instructions for data cleaning and transformation. You must follow these instructions carefully.
    
    User Instructions: "${customPrompt.trim()}"
    ---
    `
  : '';


  const prompt = `
    You are an expert data engineer and MySQL specialist. Your task is to process raw, messy CSV data, clean it, infer data types, and generate a complete and valid MySQL script and associated data.

    Analyze the following CSV data:
    \`\`\`csv
    ${csvData}
    \`\`\`
    ${userPromptSection}

    Based on the data, and prioritizing any user instructions provided, perform the following actions and structure your response as a single, valid JSON object.
    The JSON object must have these exact keys: "tableName", "cleanedData", "createTableSql", "insertSql", "explanation".
    Do not wrap the JSON object in markdown backticks or any other formatting.

    1.  **tableName:** Propose a logical, snake_case table name based on the data's content.
    2.  **cleanedData:** Convert the CSV into an array of JSON objects representing the cleaned rows. Handle inconsistencies like extra spaces, inconsistent capitalization in headers, and represent missing values as 'null'. Apply any transformations requested by the user.
    3.  **createTableSql:** Write a single, valid MySQL \`CREATE TABLE\` statement. Infer the most appropriate MySQL data type for each column (e.g., VARCHAR(255), INT, DECIMAL(10, 2), DATE, DATETIME). Enclose all identifiers in backticks (\`). If a suitable primary key column (like 'id') exists, define it. The schema must reflect the final state of the cleanedData.
    4.  **insertSql:** Create a single multi-value MySQL \`INSERT INTO\` statement for all the data rows. Ensure string values are properly escaped and null values are handled correctly.
    5.  **explanation:** Briefly explain your reasoning for the chosen table name, the data type for each column, and a summary of the cleaning actions you performed based on user instructions.
  `;

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
        }
    });

    const text = response.text.trim();
    // The model is instructed to return a clean JSON string, but we use a regex 
    // as a robust fallback in case it wraps the output in markdown.
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```|({[\s\S]*})/);

    if (!jsonMatch) {
      // Final fallback: try to parse the raw text directly.
      try {
        const parsedResult = JSON.parse(text);
        return parsedResult;
      } catch (e) {
         throw new Error("Could not find a valid JSON object in the AI's response.");
      }
    }
    
    const jsonString = jsonMatch[1] || jsonMatch[2];
    const parsedResult: ProcessedData = JSON.parse(jsonString);
    
    if (!parsedResult.tableName || !parsedResult.createTableSql || !parsedResult.insertSql) {
        throw new Error("AI response is missing required fields.");
    }

    return parsedResult;

  } catch (error) {
    console.error("Error calling Gemini API or parsing response:", error);
    throw new Error("Failed to call the Gemini API. Please check your network connection and ensure the API key is configured correctly.");
  }
}