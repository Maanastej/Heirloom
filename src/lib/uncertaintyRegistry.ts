export interface UncertaintyVariable {
  id: string;
  name: string;
  confidence: number;
  importance: number;
  recommendationImpact: number;
}

export const getPastQuestions = (chatHistory: any[]): { question: string; answer: string }[] => {
  const pastQA: { question: string; answer: string }[] = [];
  
  for (let i = 0; i < chatHistory.length; i++) {
    const msg = chatHistory[i];
    if (msg.role === "ai" && msg.structuredData?.nextQuestion?.question) {
      // Look ahead for the user's answer
      let answer = "User has not answered yet or skipped.";
      if (i + 1 < chatHistory.length && chatHistory[i + 1].role === "user") {
         answer = chatHistory[i + 1].content;
      }
      pastQA.push({ question: msg.structuredData.nextQuestion.question, answer });
    }
  }
  
  return pastQA;
};
