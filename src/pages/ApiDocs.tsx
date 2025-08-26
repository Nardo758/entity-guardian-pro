import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Code, 
  Copy, 
  Key, 
  Book, 
  Zap, 
  Shield, 
  Search,
  ExternalLink,
  PlayCircle,
  CheckCircle,
  AlertTriangle,
  Database,
  Settings,
  Globe
} from "lucide-react";

const ApiDocs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeEndpoint, setActiveEndpoint] = useState("entities");

  const endpoints = [
    {
      id: "entities",
      name: "Entities",
      method: "GET",
      path: "/api/v1/entities",
      description: "Retrieve all business entities for your account",
      parameters: [
        { name: "limit", type: "integer", required: false, description: "Number of results to return (max 100)" },
        { name: "offset", type: "integer", required: false, description: "Number of results to skip" },
        { name: "status", type: "string", required: false, description: "Filter by entity status" }
      ],
      response: `{
  "data": [
    {
      "id": "ent_123456789",
      "name": "Acme Corp LLC",
      "type": "LLC",
      "jurisdiction": "Delaware",
      "status": "active",
      "formed_date": "2020-01-15",
      "renewal_date": "2025-01-15",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-12-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "has_more": true
  }
}`
    },
    {
      id: "entity-create",
      name: "Create Entity",
      method: "POST",
      path: "/api/v1/entities",
      description: "Create a new business entity record",
      parameters: [
        { name: "name", type: "string", required: true, description: "Entity name" },
        { name: "type", type: "string", required: true, description: "Entity type (LLC, Corp, etc.)" },
        { name: "jurisdiction", type: "string", required: true, description: "State/country of formation" },
        { name: "formed_date", type: "date", required: true, description: "Date entity was formed" }
      ],
      response: `{
  "data": {
    "id": "ent_123456789",
    "name": "New Corp LLC",
    "type": "LLC",
    "jurisdiction": "Delaware", 
    "status": "active",
    "formed_date": "2024-12-15",
    "renewal_date": "2025-12-15",
    "created_at": "2024-12-15T10:30:00Z",
    "updated_at": "2024-12-15T10:30:00Z"
  }
}`
    },
    {
      id: "renewals",
      name: "Renewals",
      method: "GET", 
      path: "/api/v1/renewals",
      description: "Get upcoming renewal dates and requirements",
      parameters: [
        { name: "entity_id", type: "string", required: false, description: "Filter by specific entity" },
        { name: "due_before", type: "date", required: false, description: "Filter renewals due before date" },
        { name: "status", type: "string", required: false, description: "Filter by renewal status" }
      ],
      response: `{
  "data": [
    {
      "id": "ren_987654321",
      "entity_id": "ent_123456789",
      "type": "annual_report",
      "due_date": "2025-03-15",
      "status": "pending",
      "fee_amount": 300.00,
      "requirements": [
        "Annual report filing",
        "Registered agent confirmation"
      ],
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}`
    },
    {
      id: "webhooks",
      name: "Webhooks",
      method: "POST",
      path: "/api/v1/webhooks",
      description: "Configure webhook endpoints for real-time notifications",
      parameters: [
        { name: "url", type: "string", required: true, description: "Webhook endpoint URL" },
        { name: "events", type: "array", required: true, description: "List of events to subscribe to" },
        { name: "secret", type: "string", required: false, description: "Webhook signing secret" }
      ],
      response: `{
  "data": {
    "id": "wh_456789123",
    "url": "https://example.com/webhook",
    "events": ["entity.renewal_due", "entity.status_changed"],
    "status": "active",
    "created_at": "2024-12-15T10:30:00Z"
  }
}`
    }
  ];

  const codeExamples = {
    curl: `curl -X GET "https://api.entityrenewal.pro/v1/entities" \\
  -H "Authorization: Bearer your_api_key" \\
  -H "Content-Type: application/json"`,
    
    javascript: `const response = await fetch('https://api.entityrenewal.pro/v1/entities', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer your_api_key',
    'Content-Type': 'application/json'
  }
});
const data = await response.json();`,

    python: `import requests

headers = {
    'Authorization': 'Bearer your_api_key',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.entityrenewal.pro/v1/entities',
    headers=headers
)
data = response.json()`
  };

  const filteredEndpoints = endpoints.filter(endpoint =>
    endpoint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    endpoint.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET": return "bg-green-100 text-green-800";
      case "POST": return "bg-blue-100 text-blue-800";
      case "PUT": return "bg-yellow-100 text-yellow-800";
      case "DELETE": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Code className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">API Documentation</h1>
              <p className="text-muted-foreground">Integrate EntityRenewal Pro with your applications</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="flex items-center gap-1.5">
                <Globe className="h-3 w-3" />
                API v1.0
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1.5">
                <Shield className="h-3 w-3" />
                REST API
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Book className="h-4 w-4 mr-2" />
                Postman Collection
              </Button>
              <Button>
                <Key className="h-4 w-4 mr-2" />
                Get API Key
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Quick Start */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Quick Start
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Get API credentials
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Make your first request
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Set up webhooks
                  </div>
                  <Button size="sm" className="w-full">
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Start Tutorial
                  </Button>
                </CardContent>
              </Card>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search endpoints..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Endpoint List */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground">ENDPOINTS</h3>
                {filteredEndpoints.map((endpoint) => (
                  <Button
                    key={endpoint.id}
                    variant={activeEndpoint === endpoint.id ? "secondary" : "ghost"}
                    className="w-full justify-start h-auto p-3"
                    onClick={() => setActiveEndpoint(endpoint.id)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <Badge className={`text-xs px-2 py-0.5 ${getMethodColor(endpoint.method)}`}>
                        {endpoint.method}
                      </Badge>
                      <div className="text-left">
                        <div className="font-medium text-sm">{endpoint.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {endpoint.path}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* API Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>
                  The EntityRenewal Pro API uses REST conventions with JSON payloads
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h4 className="font-medium">Secure</h4>
                    <p className="text-sm text-muted-foreground">OAuth 2.0 & API Keys</p>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <Database className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h4 className="font-medium">RESTful</h4>
                    <p className="text-sm text-muted-foreground">Standard HTTP methods</p>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h4 className="font-medium">Real-time</h4>
                    <p className="text-sm text-muted-foreground">Webhook notifications</p>
                  </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Base URL</h4>
                  <code className="text-sm">https://api.entityrenewal.pro/v1</code>
                </div>
              </CardContent>
            </Card>

            {/* Active Endpoint Details */}
            {filteredEndpoints.map((endpoint) => (
              activeEndpoint === endpoint.id && (
                <Card key={endpoint.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Badge className={`${getMethodColor(endpoint.method)} px-3 py-1`}>
                        {endpoint.method}
                      </Badge>
                      <div>
                        <CardTitle className="text-xl">{endpoint.name}</CardTitle>
                        <code className="text-sm text-muted-foreground">{endpoint.path}</code>
                      </div>
                    </div>
                    <CardDescription className="text-base">
                      {endpoint.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Parameters */}
                    {endpoint.parameters.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Parameters</h4>
                        <div className="space-y-3">
                          {endpoint.parameters.map((param, index) => (
                            <div key={index} className="flex items-start gap-4 p-3 bg-muted/30 rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <code className="font-medium text-sm">{param.name}</code>
                                  <Badge variant="outline" className="text-xs">
                                    {param.type}
                                  </Badge>
                                  {param.required && (
                                    <Badge variant="destructive" className="text-xs">
                                      Required
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {param.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Code Examples */}
                    <div>
                      <h4 className="font-medium mb-3">Code Examples</h4>
                      <Tabs defaultValue="curl" className="w-full">
                        <TabsList>
                          <TabsTrigger value="curl">cURL</TabsTrigger>
                          <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                          <TabsTrigger value="python">Python</TabsTrigger>
                        </TabsList>
                        {Object.entries(codeExamples).map(([lang, code]) => (
                          <TabsContent key={lang} value={lang}>
                            <div className="relative">
                              <ScrollArea className="h-32">
                                <pre className="text-sm p-4 bg-muted/50 rounded-lg overflow-x-auto">
                                  <code>{code}</code>
                                </pre>
                              </ScrollArea>
                              <Button
                                size="sm"
                                variant="outline"
                                className="absolute top-2 right-2"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    </div>

                    {/* Response */}
                    <div>
                      <h4 className="font-medium mb-3">Response</h4>
                      <div className="relative">
                        <ScrollArea className="h-64">
                          <pre className="text-sm p-4 bg-muted/50 rounded-lg overflow-x-auto">
                            <code>{endpoint.response}</code>
                          </pre>
                        </ScrollArea>
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            ))}

            {/* Additional Resources */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Resources</CardTitle>
                <CardDescription>
                  More tools and documentation to help you integrate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-auto p-4 justify-start">
                    <div className="flex items-center gap-3">
                      <Settings className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-medium">Webhook Documentation</div>
                        <div className="text-sm text-muted-foreground">Real-time notifications</div>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 ml-auto" />
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4 justify-start">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-medium">Authentication Guide</div>
                        <div className="text-sm text-muted-foreground">Security best practices</div>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 ml-auto" />
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4 justify-start">
                    <div className="flex items-center gap-3">
                      <Code className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-medium">SDK Libraries</div>
                        <div className="text-sm text-muted-foreground">Official client libraries</div>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 ml-auto" />
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4 justify-start">
                    <div className="flex items-center gap-3">
                      <PlayCircle className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-medium">Interactive Tutorial</div>
                        <div className="text-sm text-muted-foreground">Step-by-step guide</div>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 ml-auto" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDocs;