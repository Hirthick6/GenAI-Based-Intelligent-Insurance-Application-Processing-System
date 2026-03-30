"""
Test final chat format - Direct and concise answers
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from openai import OpenAI

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY is not set")

FINAL_SYSTEM_PROMPT = """You are a smart assistant that answers questions from a document.

Answer the question using ONLY the document content.

Rules:
- Give a direct answer (no explanations like "I found...")
- Do NOT repeat the question
- Do NOT say "based on the document"
- If the answer exists, return the exact value clearly
- If not found, say: "Not available in the document"

Examples:
Q: Who is the insured person?
A: Manoj Yadav

Q: What is the premium amount?
A: ₹50,000

Q: What is the policy term?
A: 25 years

Be direct and concise."""

def test_final_format():
    """Test the final clean format"""
    print("=" * 70)
    print("TESTING FINAL CHAT FORMAT - DIRECT ANSWERS")
    print("=" * 70)
    
    document_context = """
=== EXTRACTED INFORMATION ===

APPLICANT INFORMATION:
  • Full Name: Manoj Yadav
  • Date Of Birth: 15/08/1988
  • Age: 36
  • Gender: Male
  • Occupation: Software Developer
  • Annual Income: 1800000

INSURANCE DETAILS:
  • Plan Name: Life Shield Plus
  • Sum Assured: 7500000
  • Premium Amount: 35000
  • Premium Frequency: Annual
  • Policy Term: 30

NOMINEE INFORMATION:
  • Name: Sunita Yadav
  • Relationship: Wife
  • Share Percentage: 100%

=== DOCUMENT TEXT ===
LIFE INSURANCE APPLICATION FORM

Applicant Name: Manoj Yadav
Date of Birth: 15/08/1988
Age: 36 years
Gender: Male
Occupation: Software Developer
Annual Income: ₹18,00,000

Insurance Plan: Life Shield Plus
Sum Assured: ₹75,00,000
Premium: ₹35,000 per year
Policy Term: 30 years

Nominee: Sunita Yadav (Wife) - 100%
"""
    
    test_questions = [
        "client name ?",
        "Who is the insured person?",
        "What is the sum assured?",
        "What is the premium amount?",
        "Who is the nominee?",
        "What is the policy term?",
        "What is the applicant's occupation?",
        "What is the applicant's age?",
    ]
    
    try:
        client = OpenAI(
            api_key=GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1",
        )
        
        print("\n📋 Testing Questions:\n")
        
        for i, question in enumerate(test_questions, 1):
            user_message = f"""Question: {question}

Document:
{document_context}"""
            
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": FINAL_SYSTEM_PROMPT},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.1,
                max_tokens=500,
            )
            
            answer = response.choices[0].message.content
            
            print(f"{i}. Q: {question}")
            print(f"   A: {answer}")
            print()
        
        print("=" * 70)
        print("✅ FINAL FORMAT TEST COMPLETE")
        print("=" * 70)
        print("\nAnswers should be:")
        print("- Direct and concise")
        print("- No 'based on document' phrases")
        print("- No question repetition")
        print("- Just the answer")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("\n🚀 Testing final chat format...\n")
    test_final_format()
    print("\n✨ Done!\n")
