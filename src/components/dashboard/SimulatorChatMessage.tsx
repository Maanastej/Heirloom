import { memo } from "react";
import { Brain, User } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { SimulatorResponseData } from "@/lib/graphrag";

interface ChatMessageProps {
  msg: {
    id: string;
    role: "user" | "ai" | "system";
    content?: string;
    structuredData?: SimulatorResponseData;
  };
  isLast: boolean;
  isAwaitingFollowUp: boolean;
  isTyping: boolean;
  activeProfileId: string | null;
  handleFollowUpAnswer: (answer: string) => void;
}

export const SimulatorChatMessage = memo(({
  msg,
  isLast,
  isAwaitingFollowUp,
  isTyping,
  handleFollowUpAnswer
}: ChatMessageProps) => {
  if (msg.role === "system") {
    return (
      <div className="flex justify-center my-4">
        <span className="text-[10px] text-muted-foreground/60 italic bg-muted/30 px-3 py-1 rounded-full border border-border/50">
          {msg.content}
        </span>
      </div>
    );
  }

  const isAI = msg.role === "ai";
  const isHighConfidence = msg.structuredData && (msg.structuredData.confidence >= 0.85 || !msg.structuredData.nextQuestion);

  return (
    <div className={`flex gap-3 max-w-[90%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}>
      {isAI && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border bg-bronze/10 border-bronze/30 text-bronze mt-1">
          <Brain className="w-4 h-4" />
        </div>
      )}
      
      <div className={`text-sm leading-relaxed ${
        msg.role === "user" 
          ? "bg-navy text-cream rounded-2xl rounded-tr-sm shadow-sm p-4" 
          : "bg-transparent text-foreground w-full py-2"
      }`}>
        {msg.role === "user" ? (
          <div className="whitespace-pre-wrap">{msg.content}</div>
        ) : msg.structuredData ? (
          <div className="space-y-5">
            
            {isHighConfidence ? (
              // RECOMMENDATION CARD
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2">
                  <h4 className="font-bold text-foreground text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    Recommendation
                  </h4>
                </div>
                
                <p className="font-serif text-[14px] font-medium text-foreground leading-loose max-w-[95%]">
                  {msg.structuredData.recommendation}
                </p>
                
                <div className="pt-2">
                  <h5 className="font-bold text-muted-foreground text-[10px] uppercase tracking-widest mb-2">Why</h5>
                  <ul className="list-disc pl-4 text-[13px] text-muted-foreground space-y-1.5">
                    {msg.structuredData.learningSummary && msg.structuredData.learningSummary.length > 0 ? (
                      msg.structuredData.learningSummary.map((learning: string, i: number) => (
                        <li key={i}>{learning}</li>
                      ))
                    ) : (
                      <li>{msg.structuredData.primaryReason}</li>
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              // DISCOVERY QUESTION CARD
              <div className="space-y-3">
                {msg.structuredData.nextQuestion && (
                  <>
                    <div className="space-y-1 text-center">
                      <span className="text-[10px] font-bold text-bronze uppercase tracking-widest">
                        One thing I need to understand
                      </span>
                      <p className="font-serif text-[16px] font-semibold text-foreground leading-snug mt-1">
                        {msg.structuredData.nextQuestion.question}
                      </p>
                    </div>

                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Understanding</span>
                      </div>
                      <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-bronze transition-all duration-700" 
                          style={{ width: `${Math.min(100, msg.structuredData.confidence * 100)}%` }} 
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-1">
                      {isLast && isAwaitingFollowUp ? (
                        msg.structuredData.nextQuestion.options.map((opt: string, idx: number) => (
                          <button 
                            key={idx}
                            onClick={() => handleFollowUpAnswer(opt)}
                            disabled={isTyping}
                            className="px-3 py-2 bg-background hover:bg-bronze/5 border border-border hover:border-bronze/30 rounded-lg text-left text-[12px] font-medium text-foreground transition-all flex items-center gap-2 group shadow-sm"
                          >
                            <div className="w-2.5 h-2.5 rounded-full border border-muted-foreground/30 group-hover:border-bronze group-hover:bg-bronze/20 flex-shrink-0 transition-colors" />
                            {opt}
                          </button>
                        ))
                      ) : (
                        <p className="text-[11px] text-muted-foreground italic text-center py-2">Question answered.</p>
                      )}
                    </div>
                  </>
                )}

                {/* View Why I'm Asking (Hidden by default) */}
                <Accordion type="single" collapsible className="w-full border-t pt-2">
                  <AccordionItem value="reasoning" className="border-b-0">
                    <AccordionTrigger className="py-2 text-[11px] text-muted-foreground hover:text-foreground justify-center gap-2">
                      View Why I'm Asking
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4 text-[12px]">
                      {msg.structuredData.learningSummary && msg.structuredData.learningSummary.length > 0 && (
                        <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                          <span className="font-bold block mb-2 text-foreground">Information Learned</span>
                          <ul className="list-disc pl-4 text-muted-foreground space-y-1">
                            {msg.structuredData.learningSummary.map((learning: string, i: number) => (
                              <li key={i}>{learning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {msg.structuredData.twinUncertainty && (
                        <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                          <span className="font-bold block mb-2 text-foreground">Missing Variables</span>
                          <p className="text-muted-foreground">{msg.structuredData.twinUncertainty}</p>
                        </div>
                      )}

                      <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                        <span className="font-bold block mb-2 text-foreground">Evidence Evaluated</span>
                        <p className="text-muted-foreground leading-relaxed">{msg.structuredData.reasoning}</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
});
