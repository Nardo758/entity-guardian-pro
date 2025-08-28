import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { toast } from "@/hooks/use-toast";
import { useEntities } from "@/hooks/useEntities";
import { EntityEditModal } from "@/components/EntityEditModal";
import { Entity } from "@/types/entity";

const EntityDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getEntity, updateEntity } = useEntities();
  const [entity, setEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchEntityData = async () => {
      if (!id) {
        navigate('/');
        return;
      }
      
      setLoading(true);
      try {
        const entityData = await getEntity(id);
        if (!entityData) {
          toast({
            title: "Entity Not Found",
            description: "The requested entity could not be found.",
            variant: "destructive"
          });
          navigate('/');
          return;
        }
        setEntity(entityData);
      } catch (error) {
        console.error('Error fetching entity:', error);
        toast({
          title: "Error Loading Entity",
          description: "Failed to load entity details. Please try again.",
          variant: "destructive"
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchEntityData();
  }, [id, getEntity, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading entity details...</p>
        </div>
      </div>
    );
  }

  if (!entity) {
    return null;
  }

  // Calculate days until renewal - use registered agent fee due date as primary renewal
  const renewalDate = entity.registered_agent_fee_due_date || entity.independent_director_fee_due_date;
  const daysUntilRenewal = renewalDate 
    ? Math.ceil((new Date(renewalDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

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

  const handleEditEntity = () => {
    setIsEditModalOpen(true);
  };

  const handleSaveEntity = async (entityData: Partial<Omit<Entity, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!entity || !id) return;
    
    try {
      const updatedEntity = await updateEntity(id, entityData);
      if (updatedEntity) {
        setEntity(updatedEntity);
      }
    } catch (error) {
      // Error is already handled in the hook
    }
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
                <Badge className="bg-success text-white">
                  Active
                </Badge>
                <Badge variant="outline">
                  {entity.type.replace('_', ' ').toUpperCase()}
                </Badge>
                <Badge variant="outline">
                  <MapPin className="h-3 w-3 mr-1" />
                  {entity.state}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleShareEntity}>
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" onClick={handleEditEntity}>
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
                    {renewalDate ? new Date(renewalDate).toLocaleDateString() : 'No date set'}
                  </p>
                  <p className={`text-sm font-medium ${getUrgencyColor(daysUntilRenewal)}`}>
                    {renewalDate ? (
                      daysUntilRenewal > 0 ? `${daysUntilRenewal} days remaining` : 'Overdue!'
                    ) : (
                      'No renewal date set'
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Amount Due</p>
                <p className="text-2xl font-bold text-primary">
                  ${(entity.registered_agent_fee || 0) + (entity.independent_director_fee || 0)}
                </p>
                {renewalDate && (
                  <Progress 
                    value={Math.max(0, Math.min(100, ((365 - daysUntilRenewal) / 365) * 100))} 
                    className="w-32 mt-2"
                  />
                )}
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
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Entity Type</p>
                      <p className="font-semibold">{entity.type.replace('_', ' ').toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">State</p>
                      <p className="font-semibold">{entity.state}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Formation Date</p>
                      <p className="font-semibold">
                        {new Date(entity.formation_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Registered Agent Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Registered Agent
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Name</p>
                      <p className="font-semibold">{entity.registered_agent_name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{entity.registered_agent_phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{entity.registered_agent_email}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Annual Fee</p>
                      <p className="font-semibold text-primary">${entity.registered_agent_fee}</p>
                    </div>
                    {entity.registered_agent_fee_due_date && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Fee Due Date</p>
                        <p className="font-semibold">
                          {new Date(entity.registered_agent_fee_due_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Independent Director (if exists) */}
            {entity.independent_director_name && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Independent Director
                  </CardTitle>
                  <CardDescription>Delaware special requirement</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Name</p>
                        <p className="font-semibold">{entity.independent_director_name}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{entity.independent_director_phone}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{entity.independent_director_email}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Annual Fee</p>
                        <p className="font-semibold text-primary">${entity.independent_director_fee}</p>
                      </div>
                      {entity.independent_director_fee_due_date && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Fee Due Date</p>
                          <p className="font-semibold">
                            {new Date(entity.independent_director_fee_due_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
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
                  {/* Mock officers data - replace with real data when available */}
                  {[
                    { name: "John Smith", title: "CEO", appointed: "2020-03-15" },
                    { name: "Sarah Johnson", title: "CFO", appointed: "2021-01-10" },
                    { name: "Michael Chen", title: "Secretary", appointed: "2020-03-15" }
                  ].map((officer, index) => (
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
                  <Button variant="outline" className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Add Officer
                  </Button>
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
                  {/* Mock documents data - replace with real data when available */}
                  {[
                    { name: "Certificate of Incorporation", date: entity?.formation_date || "2020-03-15", type: "Certificate" },
                    { name: "Operating Agreement", date: entity?.formation_date || "2020-03-20", type: "Agreement" },
                    { name: "Annual Report 2024", date: "2024-03-15", type: "Filing" },
                    { name: "Good Standing Certificate", date: "2024-01-01", type: "Certificate" }
                  ].map((doc, index) => (
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
                  <Button variant="outline" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
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
                  {/* Mock compliance data - replace with real data when available */}
                  {[
                    { name: "Annual Report Filed", status: true, description: "Due annually" },
                    { name: "Taxes Current", status: true, description: "Filed quarterly" },
                    { name: "Licenses Valid", status: false, description: "Renewal required" },
                    { name: "Insurance Current", status: true, description: "Policy active" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {item.status ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-warning" />
                        )}
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                      <Badge variant={item.status ? "default" : "secondary"}>
                        {item.status ? "Current" : "Action Required"}
                      </Badge>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Update Compliance
                  </Button>
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
                <CardDescription>Upcoming fees and costs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Registered Agent Fee</p>
                      <p className="text-2xl font-bold text-primary">${entity.registered_agent_fee}</p>
                      {entity.registered_agent_fee_due_date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {new Date(entity.registered_agent_fee_due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {entity.independent_director_fee && entity.independent_director_fee > 0 && (
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Independent Director Fee</p>
                        <p className="text-2xl font-bold text-primary">${entity.independent_director_fee}</p>
                        {entity.independent_director_fee_due_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Due: {new Date(entity.independent_director_fee_due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                    <div className="text-center p-4 border rounded-lg bg-primary/10">
                      <p className="text-sm text-muted-foreground">Total Due</p>
                      <p className="text-2xl font-bold text-primary">
                        ${(entity.registered_agent_fee || 0) + (entity.independent_director_fee || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Annual costs</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Modal */}
        <EntityEditModal
          entity={entity}
          open={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveEntity}
        />
      </div>
    </div>
  );
};

export default EntityDetails;