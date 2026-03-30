"""
Test improved chat with specific answers
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from openai import OpenAI

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY is not set")

IMPROVED_SYSTEM_PROMPT = """You are an intelligent document assistant specialized in insurance applications.
Your task is to answer user questions based ONLY on the provided document content.

CRITICAL INSTRUCTIONS:
- Answer with SPECIFIC information from the document (names, numbers, dates)
- Do NOT give generic responses like "I found information related to..."
- Do NOT use external knowledge or make assumptions
- If the answer is not in the document, say: "Not available in the document"
- Keep answers direct and factual
- For names: Give the EXACT name from the document
- For amounts: Give the EXACT amount with currency
- For dates: Give the EXACT date in the format shown
- Be precise and specific, not vague

EXAMPLES:
❌ BAD: "Based on the document, I found information related to the client name"
✅ GOOD: "The client name is John Doe"

❌ BAD: "The document contains premium information"
✅ GOOD: "The premium amount is Rs. 25,000 per year"

Always extract and provide the ACTUAL VALUE, not just acknowledge its existence."""

def test_specific_answers():
    """Test that AI gives specific answers"""
    print("=" * 70)
    print("TESTING IMPROVED CHAT - SPECIFIC ANSWERS")
    print("=" * 70)
    
    document_context = """
=== EXTRACTED INFORMATION ===

APPLICANT INFORMATION:
  • Full Name: Rajesh Kumar
  • Date Of Birth: 10/03/1985
  • Age: 39
  • Gender: Male
  • Occupation: Business Owner
  • Annual Income: 2500000

INSURANCE DETAILS:
  • Plan Name: Comprehensive Life Cover
  • Sum Assured: 10000000
  • Premium Amount: 45000
  • Premium Frequency: Annual
  • Policy Term: 25

NOMINEE INFORMATION:
  • Name: Priya Kumar
  • Relationship: Wife
  • Share Percentage: 100%

=== DOCUMENT TEXT ===
LIFE INSURANCE APPLICATION

Applicant: Rajesh Kumar
DOB: 10/03/1985
Age: 39 years
Occupation: Business Owner
Income: Rs. 25,00,000 per annum

Policy Details:
Plan: Comprehensive Life Cover
Coverage: Rs. 1,00,00,000
Annual Premium: Rs. 45,000
Term: 25 years

Nominee: Priya Kumar (Wife) - 100%
"""
    
    test_cases = [
        {
            "question": "client name ?",
            "expected_contains": "Rajesh Kumar"
        },
        {
            "question": "What is the sum assured?",
            "expected_contains": "10000000"
        },
        {
            "question": "Who is the nominee?",
            "expected_contains": "Priya Kumar"
        },
        {
            "question": "What is the premium amount?",
            "expected_contains": "45000"
        },
        {
            "question": "What is the applicant's occupation?",
            "expected_contains": "Business Owner"
        }
    ]
    
    try:
        client = OpenAI(
            api_key=GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1",
        )
        
        passed = 0
        failed = 0
        
        for i, test in enumerate(test_cases, 1):
            question = test["question"]
            expected = test["expected_contains"]
            
            print(f"\n{i}. ❓ Question: {question}")
            print("-" * 70)
            
            user_message = f"""Question: {question}

Please answer this question using ONLY the information below. Provide the SPECIFIC value or information requested, not a generic response.

{document_context}

Remember: Give the EXACT answer from the document, not just "I found information about...". Be specific and direct."""
            
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": IMPROVED_SYSTEM_PROMPT},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.1,
                max_tokens=800,
            )
            
            answer = response.choices[0].message.content
            print(f"🤖 Answer: {answer}")
            
            # Check if answer contains expected value
            if expected.lower() in answer.lower():
                print(f"✅ PASS - Contains expected value: {expected}")
                passed += 1
            else:
                print(f"❌ FAIL - Missing expected value: {expected}")
                failed += 1
        
        print("\n" + "=" * 70)
        print(f"RESULTS: {passed} passed, {failed} failed out of {len(test_cases)} tests")
        print("=" * 70)
        
        return failed == 0
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("\n🚀 Testing improved chat responses...\n")
    success = test_specific_answers()
    
    if success:
        print("\n✅ All tests passed! Chat is giving specific answers.\n")
    else:
        print("\n⚠️ Some tests failed. Review the responses above.\n")
