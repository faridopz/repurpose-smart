import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Sparkles } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
}

export default function UpgradeModal({ open, onOpenChange, feature }: UpgradeModalProps) {
  const plans = [
    {
      name: "Pro",
      price: "$15",
      period: "month",
      icon: Zap,
      color: "from-orange-500 to-amber-400",
      features: [
        "30 smart clips per month",
        "Custom brand colors",
        "Logo upload",
        "Priority processing",
        "Advanced AI insights"
      ]
    },
    {
      name: "Enterprise",
      price: "$49",
      period: "month",
      icon: Crown,
      color: "from-purple-500 to-pink-400",
      features: [
        "Unlimited smart clips",
        "White-label exports",
        "Team collaboration",
        "API access",
        "Dedicated support",
        "Custom AI training"
      ]
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-orange-500" />
            Unlock {feature}
          </DialogTitle>
          <DialogDescription>
            Upgrade to unlock premium features and supercharge your content creation
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 py-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.name}
                className="border-2 rounded-lg p-6 hover:border-orange-500/50 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 bg-gradient-to-br ${plan.color} rounded-lg`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                  </div>
                  <Badge className={`bg-gradient-to-r ${plan.color} border-0 text-white`}>
                    Popular
                  </Badge>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 border-0 text-white`}
                  size="lg"
                  onClick={() => {
                    // Placeholder for Stripe integration
                    alert(`Stripe integration coming soon! Selected plan: ${plan.name}`);
                  }}
                >
                  Upgrade to {plan.name}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>🔒 Secure payment powered by Stripe (coming soon)</p>
          <p className="mt-1">7-day free trial • Cancel anytime</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
