"""
Document Chat Service
=====================
Uses Groq API (Llama 3.3 70B) to answer questions about documents
based on extracted content and OCR text.
"""

import logging
from typing import Dict, List, Optional
from app.config import settings

logger = logging.getLogger(__name__)

CHAT_SYSTEM_PROMPT = """You are a document Q&A assistant. Answer questions using the document content, metadata, and extracted fields provided.

STRICT RULES:
1. Give ONLY the direct answer - no preamble, no "based on document"
2. Do NOT say "I found information" or similar phrases
3. Do NOT repeat or rephrase the question
4. Extract the EXACT value from the document or metadata
5. If not found anywhere in the provided context, say: "Not available in the document"
6. For greetings, respond briefly and invite questions
7. Application metadata (ID, status, sender, dates, confidence) is part of the document context

CORRECT EXAMPLES:
Q: Who is the applicant?
A: Manoj Yadav

Q: What is the Application ID?
A: APP-20260326032040-ED53B6A2

Q: What is the status?
A: Completed

Q: What is the sum assured?
A: ₹50,00,000

Q: hi
A: Hello! What would you like to know about this document?

Q: Who is John?
A: Not available in the document

Be direct. Extract exact values. No explanations."""


class ChatService:
    """Document-based Q&A using Groq API with Llama 3.3 70B."""

    def __init__(self):
        self.groq_key = settings.GROQ_API_KEY
        self.model = "llama-3.3-70b-versatile"

    def ask_question(
        self,
        question: str,
        document_context: str,
        extracted_data: Optional[Dict] = None,
        conversation_history: Optional[List[Dict]] = None,
    ) -> Dict:
        """
        Answer a question about a document using Groq API.

        Args:
            question: User's question
            document_context: OCR text and document content
            extracted_data: Structured extracted fields
            conversation_history: Previous messages for context

        Returns:
            Dict with answer and metadata
        """
        if not self.groq_key:
            return {
                "answer": "Chat service is not configured. Please add GROQ_API_KEY to environment.",
                "error": "missing_api_key",
                "success": False,
            }

        try:
            # Build context from document
            context = self._build_context(document_context, extracted_data)

            # Build messages
            messages = [{"role": "system", "content": CHAT_SYSTEM_PROMPT}]

            # Add conversation history if provided
            if conversation_history:
                messages.extend(conversation_history[-6:])  # Last 3 exchanges

            # Add current question with context
            user_message = f"""Question: {question}

Document:
{context}"""
            messages.append({"role": "user", "content": user_message})

            # Call Groq API
            answer = self._call_groq(messages)

            return {
                "answer": answer,
                "question": question,
                "model": self.model,
                "success": True,
            }

        except Exception as e:
            logger.error(f"Chat service error: {e}", exc_info=True)
            return {
                "answer": "Sorry, I encountered an error processing your question. Please try again.",
                "error": str(e),
                "success": False,
            }

    def _call_groq(self, messages: List[Dict]) -> str:
        """Call Groq API with Llama 3.3 70B model."""
        try:
            from openai import OpenAI

            client = OpenAI(
                api_key=self.groq_key,
                base_url="https://api.groq.com/openai/v1",
            )

            logger.info(f"Calling Groq API with model: {self.model}")

            response = client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.05,  # Even lower temperature for maximum precision
                max_tokens=500,
                top_p=0.9,
            )

            answer = response.choices[0].message.content.strip()
            
            # Post-process to remove any generic phrases that slipped through
            answer = self._clean_answer(answer)
            
            logger.info(f"Groq API response received: {len(answer)} characters")

            return answer

        except Exception as e:
            logger.error(f"Groq API call failed: {e}", exc_info=True)
            raise
    
    def _clean_answer(self, answer: str) -> str:
        """Remove generic phrases from answer."""
        # Remove common generic prefixes (case-insensitive)
        generic_phrases = [
            "based on the document, i found information related to",
            "based on the document, i found",
            "based on the document,",
            "according to the document,",
            "the document shows that",
            "the document shows",
            "the document states that",
            "the document states",
            "the document mentions that",
            "the document mentions",
            "i found information related to",
            "i found information about",
            "i found information",
            "the answer is:",
            "answer:",
            "here is the answer:",
        ]
        
        answer_lower = answer.lower().strip()
        
        # Check each phrase
        for phrase in generic_phrases:
            if answer_lower.startswith(phrase):
                # Remove the phrase
                answer = answer[len(phrase):].strip()
                answer_lower = answer.lower()
                # Remove leading quotes, colons, or punctuation
                answer = answer.lstrip('":. ')
                # Capitalize first letter if needed
                if answer and answer[0].islower():
                    answer = answer[0].upper() + answer[1:]
        
        # If answer ends with just a period and quotes, clean it
        answer = answer.strip('"\'.')
        
        return answer

    def _build_context(
        self, document_text: str, extracted_data: Optional[Dict]
    ) -> str:
        """Build context string from document content and extracted data."""
        context_parts = []

        # Add structured extracted data first (more reliable)
        if extracted_data:
            context_parts.append("=== EXTRACTED INFORMATION ===\n")
            context_parts.append(self._format_extracted_data(extracted_data))

        # Add OCR text (for additional context)
        if document_text:
            # Limit text to avoid token limits
            max_text_length = 3000
            truncated_text = document_text[:max_text_length]
            if len(document_text) > max_text_length:
                truncated_text += "\n... (text truncated)"

            context_parts.append("\n=== DOCUMENT TEXT ===\n")
            context_parts.append(truncated_text)

        return "\n".join(context_parts)

    def _format_extracted_data(self, data: Dict) -> str:
        """Format extracted data into readable text."""
        lines = []

        # Define order and labels for better readability
        sections = {
            "applicant": "APPLICANT INFORMATION",
            "contact": "CONTACT DETAILS",
            "identity": "IDENTITY DOCUMENTS",
            "insurance": "INSURANCE DETAILS",
            "medical": "MEDICAL INFORMATION",
            "nominee": "NOMINEE INFORMATION",
        }

        for key, label in sections.items():
            if key in data and isinstance(data[key], dict):
                section_lines = []
                for field, value in data[key].items():
                    if value and str(value).strip() and str(value).lower() not in ['null', 'none', '-', 'not available', 'not available in the document']:
                        # Format field name
                        field_name = field.replace("_", " ").title()
                        section_lines.append(f"  • {field_name}: {value}")
                
                if section_lines:
                    lines.append(f"\n{label}:")
                    lines.extend(section_lines)

        return "\n".join(lines) if lines else "No structured data available"
