import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { useAgents } from "@/hooks/useAgents";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Building2, MapPin, DollarSign, Calendar, ToggleLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

export const AgentProfileEditor = () => {
  const { user } = useAuth();
  const { getUserAgent, updateAgentProfile } = useAgents();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agentProfile, setAgentProfile] = useState({
    id: "",
    company_name: "",
    bio: "",
    states: [] as string[],
    price_per_entity: 0,
    years_experience: 0,
    contact_email: "",
    is_available: true,
  });

  useEffect(() => {
    const loadAgentProfile = async () => {
      if (!user) return;
      
      try {
        const profile = await getUserAgent();
        if (profile) {
          setAgentProfile({
            id: profile.id,
            company_name: profile.company_name || "",
            bio: profile.bio || "",
            states: profile.states || [],
            price_per_entity: profile.price_per_entity || 0,
            years_experience: profile.years_experience || 0,
            contact_email: profile.contact_email || "",
            is_available: profile.is_available,
          });
        }
      } catch (error) {
        console.error("Error loading agent profile:", error);
        toast({
          title: "Error",
          description: "Failed to load agent profile",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadAgentProfile();
  }, [user]);

  const toggleState = (state: string) => {
    setAgentProfile((prev) => ({
      ...prev,
      states: prev.states.includes(state)
        ? prev.states.filter((s) => s !== state)
        : [...prev.states, state],
    }));
  };

  const handleSave = async () => {
    if (!agentProfile.id) {
      toast({
        title: "Error",
        description: "Agent profile not found",
        variant: "destructive",
      });
      return;
    }

    if (!agentProfile.company_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Company name is required",
        variant: "destructive",
      });
      return;
    }

    if (agentProfile.states.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one state",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await updateAgentProfile(agentProfile.id, {
        company_name: agentProfile.company_name,
        bio: agentProfile.bio,
        states: agentProfile.states,
        price_per_entity: agentProfile.price_per_entity,
        years_experience: agentProfile.years_experience,
        contact_email: agentProfile.contact_email,
        is_available: agentProfile.is_available,
      });

      toast({
        title: "Success",
        description: "Agent profile updated successfully",
      });
    } catch (error) {
      console.error("Error updating agent profile:", error);
      toast({
        title: "Error",
        description: "Failed to update agent profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Information
          </CardTitle>
          <CardDescription>
            Update your company details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name *</Label>
            <Input
              id="company_name"
              value={agentProfile.company_name}
              onChange={(e) =>
                setAgentProfile((prev) => ({ ...prev, company_name: e.target.value }))
              }
              placeholder="Your Company LLC"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_email">Contact Email</Label>
            <Input
              id="contact_email"
              type="email"
              value={agentProfile.contact_email}
              onChange={(e) =>
                setAgentProfile((prev) => ({ ...prev, contact_email: e.target.value }))
              }
              placeholder="contact@yourcompany.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={agentProfile.bio}
              onChange={(e) =>
                setAgentProfile((prev) => ({ ...prev, bio: e.target.value }))
              }
              placeholder="Tell entity owners about your services and experience..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Service States
          </CardTitle>
          <CardDescription>
            Select the states where you provide registered agent services *
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {US_STATES.map((state) => (
              <Badge
                key={state}
                variant={agentProfile.states.includes(state) ? "default" : "outline"}
                className="cursor-pointer transition-colors"
                onClick={() => toggleState(state)}
              >
                {state}
              </Badge>
            ))}
          </div>
          {agentProfile.states.length > 0 && (
            <p className="text-sm text-muted-foreground mt-4">
              Selected: {agentProfile.states.length} state{agentProfile.states.length !== 1 ? "s" : ""}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pricing & Experience
          </CardTitle>
          <CardDescription>
            Set your pricing and showcase your experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="price_per_entity">Price Per Entity (Annual)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="price_per_entity"
                type="number"
                min="0"
                step="10"
                value={agentProfile.price_per_entity}
                onChange={(e) =>
                  setAgentProfile((prev) => ({
                    ...prev,
                    price_per_entity: parseFloat(e.target.value) || 0,
                  }))
                }
                className="pl-7"
                placeholder="100"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Your annual fee per entity for registered agent services
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="years_experience" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Years of Experience
            </Label>
            <Input
              id="years_experience"
              type="number"
              min="0"
              max="99"
              value={agentProfile.years_experience}
              onChange={(e) =>
                setAgentProfile((prev) => ({
                  ...prev,
                  years_experience: parseInt(e.target.value) || 0,
                }))
              }
              placeholder="5"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ToggleLeft className="h-5 w-5" />
            Availability Status
          </CardTitle>
          <CardDescription>
            Control whether you appear in the agent directory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_available">Available for New Clients</Label>
              <p className="text-sm text-muted-foreground">
                Show your profile in the agent directory and accept new invitations
              </p>
            </div>
            <Switch
              id="is_available"
              checked={agentProfile.is_available}
              onCheckedChange={(checked) =>
                setAgentProfile((prev) => ({ ...prev, is_available: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  );
};
