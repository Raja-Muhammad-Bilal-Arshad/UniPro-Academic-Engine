
import { Message } from '../types';

export const parseUniProResponse = (text: string): Message['parsedContent'] => {
  const result: Message['parsedContent'] = {
    theory: '',
    code: '',
    codeLanguage: 'text',
    output: '',
    metrics: '',
    refinedText: '',
    changelog: '',
    latex: '',
    conversionNotes: '',
    docStructure: '',
    markdown: '',
  };

  // --- Creation Modes (Assignment, Project, Thesis) ---

  // 1. Extract Theory
  const theoryMatch = text.match(/\[START_THEORY\]([\s\S]*?)\[END_THEORY\]/);
  if (theoryMatch) {
    result.theory = theoryMatch[1].trim();
  }

  // 2. Extract Code
  // Regex to catch [START_CODE_LANG] ... [END_CODE]
  const codeMatch = text.match(/\[START_CODE_([A-Z0-9_]+)\]([\s\S]*?)\[END_CODE\]/);
  if (codeMatch) {
    result.codeLanguage = codeMatch[1].toLowerCase();
    result.code = codeMatch[2].trim();
  }

  // 3. Extract Output
  const outputMatch = text.match(/\[START_OUTPUT_SCREENSHOT\]([\s\S]*?)\[END_OUTPUT\]/);
  if (outputMatch) {
    result.output = outputMatch[1].trim();
  }

  // --- Utility Mode (Academic Utilities) ---

  // 4. Extract Metrics
  const metricsMatch = text.match(/\[START_ANALYSIS_METRICS\]([\s\S]*?)\[END_METRICS\]/);
  if (metricsMatch) {
    result.metrics = metricsMatch[1].trim();
  }

  // 5. Extract Refined Text
  const refinedTextMatch = text.match(/\[START_REFINED_TEXT\]([\s\S]*?)\[END_TEXT\]/);
  if (refinedTextMatch) {
    result.refinedText = refinedTextMatch[1].trim();
  }

  // 6. Extract Changelog
  const changelogMatch = text.match(/\[START_CHANGELOG\]([\s\S]*?)\[END_CHANGELOG\]/);
  if (changelogMatch) {
    result.changelog = changelogMatch[1].trim();
  }

  // --- Organizer (Module 5) & Markdown (Module 6) Shared Tags ---
  // Note: Both modules use [START_CONVERSION_NOTES] and [START_DOC_STRUCTURE]

  // 7. Extract Conversion Notes
  const notesMatch = text.match(/\[START_CONVERSION_NOTES\]([\s\S]*?)\[END_CONVERSION_NOTES\]/);
  if (notesMatch) {
    result.conversionNotes = notesMatch[1].trim();
  }

  // 8. Extract Document Structure
  const structMatch = text.match(/\[START_DOC_STRUCTURE\]([\s\S]*?)\[END_DOC_STRUCTURE\]/);
  if (structMatch) {
    result.docStructure = structMatch[1].trim();
  }

  // --- Organizer Specific ---
  // 9. Extract LaTeX
  const latexMatch = text.match(/\[START_LATEX_CONVERSION\]([\s\S]*?)\[END_LATEX_CONVERSION\]/);
  if (latexMatch) {
    result.latex = latexMatch[1].trim();
    result.codeLanguage = 'latex'; // Explicitly set for syntax highlighter
  }

  // --- Markdown Specific ---
  // 10. Extract Markdown Content
  const mdMatch = text.match(/\[START_MARKDOWN_CONTENT\]([\s\S]*?)\[END_MARKDOWN_CONTENT\]/);
  if (mdMatch) {
    result.markdown = mdMatch[1].trim();
  }

  // 11. Fallback: If no tags are found, treat the whole text as "Theory" (Conversational mode)
  // Check if any tags were found
  const hasCreationTags = result.theory || result.code || result.output;
  const hasUtilityTags = result.metrics || result.refinedText || result.changelog;
  const hasOrganizerTags = result.latex; // Notes/Struct are shared, so check specific payload
  const hasMarkdownTags = result.markdown;

  const hasAnyTags = hasCreationTags || hasUtilityTags || hasOrganizerTags || hasMarkdownTags || result.conversionNotes;

  if (!hasAnyTags) {
    result.theory = text;
  } else if (!result.theory && !result.metrics && !result.conversionNotes && hasAnyTags) {
      // If content exists but logic missed the start tags (rare), try to salvage pre-text
      const splitAtCode = text.split(/\[START_CODE_/)[0];
      const splitAtMetrics = text.split(/\[START_ANALYSIS_METRICS\]/)[0];
      const splitAtNotes = text.split(/\[START_CONVERSION_NOTES\]/)[0];
      
      let preText = "";
      if (hasCreationTags) preText = splitAtCode;
      else if (hasUtilityTags) preText = splitAtMetrics;
      else if (hasOrganizerTags || hasMarkdownTags) preText = splitAtNotes;
      
      if (preText.trim().length > 0 && !preText.includes('[START_')) {
          result.theory = preText.trim();
      }
  }

  return result;
};
