"""
Test greetings and actual questions
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.chat_service import ChatService

# Sample document data
sample_extracted_data = {
    "applicant": {
        "full_name": "Rajesh Kumar",
        "age": "35",
        "occupation": "Engineer"
    },
    "insurance": {
        "sum_assured": "5000000",
        "premium_amount": "30000",
        "policy_term": "20"
    },
    "nominee": {
        "name": "Priya Kumar",
        "relationship": "Wife"
    }
}

sample_ocr_text = """
LIFE INSURANCE APPLICATION

Applicant: Rajesh Kumar
Age: 35 years
Occupation: Engineer

Sum Assured: ₹50,00,000
Premium: ₹30,000 per year
Policy Term: 20 years

Nominee: Priya Kumar (Wife)
"""

def test_chat():
    """Test various questions including greetings"""
    chat_service = ChatService()
    
    questions = [
        "hi",
        "client name?",
        "What is the sum assured?",
        "Who is the nominee?",
        "premium amount?",
    ]
    
    print("=" * 70)
    print("TESTING CHAT WITH GREETINGS AND QUESTIONS")
    print("=" * 70)
    
    for i, question in enumerate(questions, 1):
        print(f"\n{i}. Q: {question}")
        print("-" * 70)
        
        result = chat_service.ask_question(
            question=question,
            document_context=sample_ocr_text,
            extracted_data=sample_extracted_data
        )
        
        if result.get("success"):
            answer = result['answer']
            print(f"   A: {answer}")
            
            # Check for generic phrases
            if "based on the document" in answer.lower():
                print("   ⚠️  WARNING: Contains 'based on the document'")
            elif "i found information" in answer.lower():
                print("   ⚠️  WARNING: Contains 'I found information'")
            else:
                print("   ✅ Clean answer")
        else:
            print(f"   ❌ Error: {result.get('error', 'Unknown error')}")
    
    print("\n" + "=" * 70)
    print("TEST COMPLETE")
    print("=" * 70)

if __name__ == "__main__":
    print("\n🚀 Testing chat service...\n")
    test_chat()
    print("\n✨ Done!\n")
