"""
Test questions that don't exist in the document
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.chat_service import ChatService

sample_extracted_data = {
    "applicant": {
        "full_name": "Rajesh Kumar",
        "age": "35",
    },
    "insurance": {
        "sum_assured": "5000000",
    }
}

sample_ocr_text = """
LIFE INSURANCE APPLICATION
Applicant: Rajesh Kumar
Age: 35 years
Sum Assured: ₹50,00,000
"""

def test_not_found():
    """Test questions about things not in the document"""
    chat_service = ChatService()
    
    questions = [
        "who is niahit?",
        "who is john?",
        "what is the car model?",
        "client name?",  # This SHOULD be found
    ]
    
    print("=" * 70)
    print("TESTING NOT FOUND SCENARIOS")
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
            
            # Check for issues
            if "based on the document" in answer.lower():
                print("   ❌ Contains 'based on the document'")
            elif "i found information" in answer.lower():
                print("   ❌ Contains 'I found information'")
            elif "not available" in answer.lower():
                print("   ✅ Correctly says not available")
            else:
                print("   ✅ Clean answer")
        else:
            print(f"   ❌ Error: {result.get('error')}")
    
    print("\n" + "=" * 70)

if __name__ == "__main__":
    print("\n🚀 Testing not found scenarios...\n")
    test_not_found()
    print("\n✨ Done!\n")
