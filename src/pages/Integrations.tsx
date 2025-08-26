import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Settings, 
  Zap, 
  Calendar, 
  Mail, 
  FileText, 
  CreditCard, 
  Users, 
  Database,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Globe,
  Shield,
  Plus
} from "lucide-react";

const Integrations = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const integrations = [
    {
      id: "quickbooks",
      name: "QuickBooks Online",
      description: "Sync financial data and automate entity expense tracking",
      category: "Accounting",
      icon: FileText,
      status: "connected",
      popular: true,
      features: ["Financial sync", "Expense tracking", "Invoice management"],
      setupTime: "5 minutes"
    },
    {
      id: "outlook",
      name: "Microsoft Outlook",
      description: "Receive renewal notifications and calendar reminders",
      category: "Communication",
      icon: Mail,
      status: "available",
      popular: true,
      features: ["Email notifications", "Calendar sync", "Task management"],
      setupTime: "2 minutes"
    },
    {
      id: "slack",
      name: "Slack",
      description: "Get entity updates and alerts in your team channels",
      category: "Communication",
      icon: Users,
      status: "connected",
      popular: false,
      features: ["Channel notifications", "Team alerts", "Status updates"],
      setupTime: "3 minutes"
    },
    {
      id: "stripe",
      name: "Stripe",
      description: "Process payments for entity fees and renewals",
      category: "Payment",
      icon: CreditCard,
      status: "available",
      popular: true,
      features: ["Payment processing", "Subscription billing", "Fee tracking"],
      setupTime: "10 minutes"
    },
    {
      id: "salesforce",
      name: "Salesforce",
      description: "Sync entity data with your CRM system",
      category: "CRM",
      icon: Database,
      status: "available",
      popular: false,
      features: ["Contact sync", "Lead tracking", "Opportunity management"],
      setupTime: "15 minutes"
    },
    {
      id: "zapier",
      name: "Zapier",
      description: "Connect with thousands of apps through automation workflows",
      category: "Automation",
      icon: Zap,
      status: "connected",
      popular: true,
      features: ["Workflow automation", "Data sync", "Custom triggers"],
      setupTime: "Variable"
    },
    {
      id: "gcal",
      name: "Google Calendar",
      description: "Sync renewal dates and compliance deadlines",
      category: "Productivity",
      icon: Calendar,
      status: "available",
      popular: true,
      features: ["Calendar sync", "Deadline reminders", "Event creation"],
      setupTime: "2 minutes"
    },
    {
      id: "docusign",
      name: "DocuSign",
      description: "Manage entity document signatures and approvals",
      category: "Documents",
      icon: FileText,
      status: "available",
      popular: false,
      features: ["Document signing", "Approval workflows", "Audit trails"],
      setupTime: "8 minutes"
    }
  ];

  const categories = ["all", "Accounting", "Communication", "Payment", "CRM", "Automation", "Productivity", "Documents"];

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeTab === "all" || integration.category === activeTab;
    return matchesSearch && matchesCategory;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "available":
        return <Plus className="h-4 w-4 text-muted-foreground" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Connected</Badge>;
      case "available":
        return <Badge variant="outline">Available</Badge>;
      default:
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Setup Required</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Integrations</h1>
              <p className="text-muted-foreground">Connect EntityRenewal Pro with your favorite tools</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search integrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Request Integration
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">3</div>
                  <div className="text-sm text-muted-foreground">Connected</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-2xl font-bold">50+</div>
                  <div className="text-sm text-muted-foreground">Available</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold">1.2k</div>
                  <div className="text-sm text-muted-foreground">Automations</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">99.9%</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Integration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map((integration) => (
            <Card key={integration.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <integration.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      {integration.popular && (
                        <Badge variant="secondary" className="text-xs">Popular</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(integration.status)}
                      {getStatusBadge(integration.status)}
                    </div>
                    <CardDescription className="text-sm">
                      {integration.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Features</h4>
                    <div className="flex flex-wrap gap-1">
                      {integration.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Setup time: {integration.setupTime}</span>
                    <span className="capitalize">{integration.category}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex gap-2">
                    {integration.status === "connected" ? (
                      <>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                        <Button variant="secondary" size="sm">
                          <Switch className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" className="flex-1">
                        Connect
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredIntegrations.length === 0 && (
          <div className="text-center py-12">
            <div className="p-4 rounded-lg bg-muted/30 inline-block mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No integrations found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or browse different categories
            </p>
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Clear Search
            </Button>
          </div>
        )}

        {/* Custom Integration CTA */}
        <Card className="mt-12 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-8 text-center">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold mb-4">Need a Custom Integration?</h3>
              <p className="text-muted-foreground mb-6">
                Don't see the tool you need? Our team can build custom integrations 
                tailored to your specific workflow requirements.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg">
                  Request Custom Integration
                </Button>
                <Button variant="outline" size="lg">
                  View API Documentation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Integrations;