import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

export interface ReasoningDetails {
  situationType?: string;
  situationDescription?: string;
  predictedFailures?: Array<{ mode: string; p: number }>;
  confidence?: number;
  reasoningSteps?: string[];
  similarContext?: string;
  memoryNote?: string;
  recommendationSummary?: string[];
}

export function ViewReasoningDropdown({ details }: { details: ReasoningDetails }) {
  const hasDetails = Boolean(
    details?.situationType ||
    details?.predictedFailures?.length ||
    details?.confidence !== undefined ||
    details?.reasoningSteps?.length ||
    details?.similarContext ||
    details?.memoryNote
  );

  if (!hasDetails) return null;

  return (
    <Collapsible defaultOpen={false}>
      <CollapsibleTrigger className="inline-flex w-full justify-between items-center rounded-lg border border-border bg-muted px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition hover:bg-muted/80">
        View reasoning
        <ChevronDown className="w-3 h-3" />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 rounded-xl border border-border bg-background p-3 text-[11px] text-muted-foreground space-y-3">
        {details.situationType && (
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-bronze/90">Situation</div>
            <div className="mt-1 text-sm text-foreground">{details.situationDescription || details.situationType}</div>
          </div>
        )}

        {details.predictedFailures?.length ? (
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-bronze/90">Predicted patterns</div>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              {details.predictedFailures.map((failure) => (
                <li key={failure.mode}>
                  <span className="font-semibold text-foreground">{failure.mode.replace(/_/g, " ")}</span>
                  {details.confidence !== undefined ? ` — ${Math.round(failure.p * 100)}%` : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {details.recommendationSummary?.length ? (
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-bronze/90">Internal recommendations</div>
            <ul className="mt-2 space-y-1 list-disc list-inside text-foreground">
              {details.recommendationSummary.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {details.similarContext && (
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-bronze/90">Behavioral context</div>
            <p className="mt-1 text-sm text-foreground">{details.similarContext}</p>
          </div>
        )}

        {details.reasoningSteps?.length ? (
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-bronze/90">Reasoning trail</div>
            <div className="mt-2 space-y-1 text-sm text-foreground">
              {details.reasoningSteps.map((step, idx) => (
                <p key={idx} className="border-l-2 border-bronze/40 pl-2">{step}</p>
              ))}
            </div>
          </div>
        ) : null}

        {details.confidence !== undefined && (
          <div className="text-[10px] uppercase tracking-[0.18em] text-bronze/90">
            Confidence
            <div className="mt-1 text-sm text-foreground">{Math.round(details.confidence * 100)}%</div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
