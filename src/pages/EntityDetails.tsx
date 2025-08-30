import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntityRegisteredAgentSection } from '@/components/EntityRegisteredAgentSection';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  FileText,
  Phone,
  Mail,
  Globe,
  Building,
  Users,
  Edit,
  Download,
  Share
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

// Mock entity data - in real app this would come from API
const mockEntity = {
  id: "1",
  name: "TechCorp Solutions LLC",
  type: "LLC",
  status: "Active",
  jurisdiction: "Delaware",
  incorporationDate: "2020-03-15",
  nextRenewalDate: "2024-03-15",
  registeredAgent: "Corporate Services Inc.",
  address: {
    street: "123 Business Ave, Suite 100",
    city: "Wilmington",
    state: "DE",
    zipCode: "19801"
  },
  contact: {
    phone: "+1 (555) 123-4567",
    email: "legal@techcorp.com",
    website: "www.techcorp.com"
  },
  officers: [
    { name: "Sarah Johnson", title: "CEO", appointed: "2020-03-15" },
    { name: "Michael Chen", title: "CFO", appointed: "2021-01-10" },
    { name: "Emily Davis", title: "Secretary", appointed: "2020-03-15" }
  ],
  documents: [
    { name: "Certificate of Incorporation", date: "2020-03-15", type: "Certificate" },
    { name: "Operating Agreement", date: "2020-03-20", type: "Agreement" },
    { name: "Annual Report 2023", date: "2023-03-15", type: "Filing" },
    { name: "Good Standing Certificate", date: "2023-12-01", type: "Certificate" }
  ],
  financials: {
    annualFee: 300,
    registeredAgentFee: 150,
    totalDue: 450,
    lastPayment: "2023-03-15"
  },
  compliance: {
    annualReportFiled: true,
    taxesCurrent: true,
    licensesValid: true,
    insuranceCurrent: true
  }
};

const EntityDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entity, setEntity] = useState(mockEntity);
  const [loading, setLoading] = useState(false);

  // Calculate days until renewal
  const daysUntilRenewal = Math.ceil(
    (new Date(entity.nextRenewalDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-success text-white';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'inactive': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getUrgencyColor = (days: number) => {
    if (days <= 30) return 'text-destructive';
    if (days <= 60) return 'text-warning';
    return 'text-success';
  };

  const handleRenewNow = () => {
    toast({
      title: "Renewal Process Started",
      description: "Redirecting to renewal workflow...",
    });
    // In real app, would redirect to renewal process
  };

  const handleShareEntity = () => {
    toast({
      title: "Share Link Copied",
      description: "Entity details link copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {entity.name}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge className={getStatusColor(entity.status)}>
                  {entity.status}
                </Badge>
                <Badge variant="outline">
                  {entity.type}
                </Badge>
                <Badge variant="outline">
                  <MapPin className="h-3 w-3 mr-1" />
                  {entity.jurisdiction}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleShareEntity}>
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button 
              onClick={handleRenewNow}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              Renew Now
            </Button>
          </div>
        </div>

        {/* Renewal Status Card */}
        <Card className="mb-8 border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Next Renewal Due</h3>
                  <p className="text-2xl font-bold">
                    {new Date(entity.nextRenewalDate).toLocaleDateString()}
                  </p>
                  <p className={`text-sm font-medium ${getUrgencyColor(daysUntilRenewal)}`}>
                    {daysUntilRenewal > 0 ? `${daysUntilRenewal} days remaining` : 'Overdue!'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Amount Due</p>
                <p className="text-2xl font-bold text-primary">
                  ${entity.financials.totalDue}
                </p>
                <Progress 
                  value={Math.max(0, Math.min(100, ((365 - daysUntilRenewal) / 365) * 100))} 
                  className="w-32 mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="officers">Officers</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Entity Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Entity Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Entity Type</p>
                      <p className="font-semibold">{entity.type}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Jurisdiction</p>
                      <p className="font-semibold">{entity.jurisdiction}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Incorporation Date</p>
                      <p className="font-semibold">
                        {new Date(entity.incorporationDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Registered Agent</p>
                      <p className="font-semibold">{entity.registeredAgent}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Registered Agent Section */}
              <EntityRegisteredAgentSection 
                entityId={entity.id} 
                entityState={entity.address.state}
              />

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{entity.contact.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{entity.contact.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span>{entity.contact.website}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                      <div>
                        <p>{entity.address.street}</p>
                        <p>{entity.address.city}, {entity.address.state} {entity.address.zipCode}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="officers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Officers & Directors
                </CardTitle>
                <CardDescription>Current officers and their appointment dates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {entity.officers.map((officer, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">{officer.name}</p>
                        <p className="text-sm text-muted-foreground">{officer.title}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Appointed</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(officer.appointed).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Entity Documents
                </CardTitle>
                <CardDescription>Important documents and filings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {entity.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-primary/10">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {doc.type} • {new Date(doc.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Compliance Status
                </CardTitle>
                <CardDescription>Current compliance status and requirements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {entity.compliance.annualReportFiled ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-warning" />
                      )}
                      <span>Annual Report Filed</span>
                    </div>
                    <Badge variant={entity.compliance.annualReportFiled ? "default" : "secondary"}>
                      {entity.compliance.annualReportFiled ? "Complete" : "Pending"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {entity.compliance.taxesCurrent ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-warning" />
                      )}
                      <span>Taxes Current</span>
                    </div>
                    <Badge variant={entity.compliance.taxesCurrent ? "default" : "secondary"}>
                      {entity.compliance.taxesCurrent ? "Current" : "Overdue"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {entity.compliance.licensesValid ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-warning" />
                      )}
                      <span>Licenses Valid</span>
                    </div>
                    <Badge variant={entity.compliance.licensesValid ? "default" : "secondary"}>
                      {entity.compliance.licensesValid ? "Valid" : "Expired"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {entity.compliance.insuranceCurrent ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-warning" />
                      )}
                      <span>Insurance Current</span>
                    </div>
                    <Badge variant={entity.compliance.insuranceCurrent ? "default" : "secondary"}>
                      {entity.compliance.insuranceCurrent ? "Active" : "Lapsed"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Summary
                </CardTitle>
                <CardDescription>Upcoming fees and payment history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Annual Fee</p>
                      <p className="text-2xl font-bold text-primary">${entity.financials.annualFee}</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Registered Agent Fee</p>
                      <p className="text-2xl font-bold text-primary">${entity.financials.registeredAgentFee}</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg bg-primary/10">
                      <p className="text-sm text-muted-foreground">Total Due</p>
                      <p className="text-2xl font-bold text-primary">${entity.financials.totalDue}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-semibold mb-3">Recent Payments</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Annual Renewal 2023</p>
                          <p className="text-sm text-muted-foreground">
                            Paid on {new Date(entity.financials.lastPayment).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="font-semibold text-success">$450.00</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EntityDetails;