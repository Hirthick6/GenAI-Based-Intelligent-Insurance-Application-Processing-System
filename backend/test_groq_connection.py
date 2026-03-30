"""
Test Groq API connection and chat functionality
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from openai import OpenAI

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY is not set")

def test_groq_connection():
    """Test basic Groq API connection"""
    print("=" * 60)
    print("TESTING GROQ API CONNECTION")
    print("=" * 60)
    
    try:
        client = OpenAI(
            api_key=GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1",
        )
        
        print("\n✅ Client initialized successfully")
        print(f"📡 Using model: llama-3.3-70b-versatile")
        
        # Test simple question
        print("\n" + "-" * 60)
        print("Testing with a simple question...")
        print("-" * 60)
        
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant. Answer briefly."
                },
                {
                    "role": "user",
                    "content": "What is 2+2? Answer in one sentence."
                }
            ],
            temperature=0.3,
            max_tokens=100,
        )
        
        answer = response.choices[0].message.content
        print(f"\n💬 Question: What is 2+2?")
        print(f"🤖 Answer: {answer}")
        
        print("\n" + "=" * 60)
        print("✅ GROQ API CONNECTION SUCCESSFUL!")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\n" + "=" * 60)
        print("❌ GROQ API CONNECTION FAILED!")
        print("=" * 60)
        return False

def test_document_chat():
    """Test document-based chat"""
    print("\n\n" + "=" * 60)
    print("TESTING DOCUMENT CHAT")
    print("=" * 60)
    
    # Sample document data
    document_context = """
    === EXTRACTED INFORMATION ===
    
    Applicant Information:
      - Full Name: John Doe
      - Date Of Birth: 15/05/1990
      - Age: 34
      - Gender: Male
      - Occupation: Software Engineer
      - Annual Income: 1200000
    
    Insurance Details:
      - Plan Name: Term Life Insurance Plus
      - Sum Assured: 5000000
      - Premium Amount: 25000
      - Premium Frequency: Annual
      - Policy Term: 30
    
    Nominee Information:
      - Name: Jane Doe
      - Relationship: Spouse
      - Share Percentage: 100%
    
    === DOCUMENT TEXT ===
    LIFE INSURANCE APPLICATION FORM
    
    Applicant Details:
    Name: John Doe
    Date of Birth: 15/05/1990
    Age: 34 years
    Gender: Male
    Occupation: Software Engineer
    Annual Income: Rs. 12,00,000
    
    Insurance Details:
    Plan: Term Life Insurance Plus
    Sum Assured: Rs. 50,00,000
    Premium: Rs. 25,000 per year
    Policy Term: 30 years
    
    Nominee Details:
    Name: Jane Doe
    Relationship: Spouse
    Share: 100%
    """
    
    questions = [
        "What is the applicant's name?",
        "What is the sum assured?",
        "Who is the nominee and what is their relationship?",
        "What is the premium amount and frequency?",
    ]
    
    try:
        client = OpenAI(
            api_key=GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1",
        )
        
        for i, question in enumerate(questions, 1):
            print(f"\n{i}. ❓ Question: {question}")
            print("-" * 60)
            
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {
                        "role": "system",
                        "content": """You are an intelligent document assistant.
Answer questions based ONLY on the provided document content.
Keep answers short and clear."""
                    },
                    {
                        "role": "user",
                        "content": f"User Question: {question}\n\nDocument Context:\n{document_context}"
                    }
                ],
                temperature=0.3,
                max_tokens=500,
            )
            
            answer = response.choices[0].message.content
            print(f"🤖 Answer: {answer}\n")
        
        print("=" * 60)
        print("✅ DOCUMENT CHAT TEST SUCCESSFUL!")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\n" + "=" * 60)
        print("❌ DOCUMENT CHAT TEST FAILED!")
        print("=" * 60)
        return False

if __name__ == "__main__":
    print("\n🚀 Starting Groq API Tests...\n")
    
    # Test 1: Basic connection
    connection_ok = test_groq_connection()
    
    if connection_ok:
        # Test 2: Document chat
        test_document_chat()
    
    print("\n✨ Tests complete!\n")
