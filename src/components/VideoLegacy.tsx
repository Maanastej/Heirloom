import { Button } from "@/components/ui/button";
import { Video, Mic, Heart, Calendar, ArrowRight } from "lucide-react";

const VideoLegacy = () => {
  return (
    <section id="video-legacy" className="py-24 bg-navy relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-bronze/5 to-transparent" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-bronze/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-bronze/20 border border-bronze/30 mb-6">
              <Video className="w-4 h-4 text-bronze" />
              <span className="text-bronze text-sm font-medium">Video Preservation</span>
            </div>

            <h2 className="font-serif text-4xl md:text-5xl text-cream leading-tight mb-6">
              Stories That Transcend
              <span className="block text-bronze-light">Generations</span>
            </h2>

            <p className="text-cream/70 text-lg mb-8 leading-relaxed">
              Capture the voices, expressions, and wisdom of your family elders in high-quality video. 
              These aren't just recordings—they're living memories that future generations can experience firsthand.
            </p>

            <div className="space-y-4 mb-10">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-bronze/20 flex items-center justify-center flex-shrink-0">
                  <Mic className="w-5 h-5 text-bronze" />
                </div>
                <div>
                  <h4 className="text-cream font-medium mb-1">Guided Recording Sessions</h4>
                  <p className="text-cream/60 text-sm">Structured prompts help capture meaningful stories and life lessons.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-bronze/20 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-bronze" />
                </div>
                <div>
                  <h4 className="text-cream font-medium mb-1">Personal Messages</h4>
                  <p className="text-cream/60 text-sm">Record messages for future milestones—graduations, weddings, births.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-bronze/20 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-bronze" />
                </div>
                <div>
                  <h4 className="text-cream font-medium mb-1">Time-Released Content</h4>
                  <p className="text-cream/60 text-sm">Schedule videos to be unlocked at specific dates or life events.</p>
                </div>
              </div>
            </div>

            <Button variant="hero" size="lg">
              Start Recording
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          <div className="relative">
            {/* Video preview card */}
            <div className="relative rounded-2xl overflow-hidden shadow-elegant bg-navy-light border border-cream/10">
              <div className="aspect-video bg-gradient-to-br from-navy-light to-navy flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-bronze/20 flex items-center justify-center mx-auto mb-4">
                    <Video className="w-10 h-10 text-bronze" />
                  </div>
                  <p className="text-cream/60 text-sm">Video Legacy Preview</p>
                </div>
              </div>
              
              {/* Video info bar */}
              <div className="p-6 border-t border-cream/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-cream font-medium">Grandpa's Life Story</h4>
                    <p className="text-cream/50 text-sm">Recorded December 2024</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-forest/20 text-forest-light text-xs font-medium">Family Only</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoLegacy;
