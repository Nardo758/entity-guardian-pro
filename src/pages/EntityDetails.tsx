import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  FileText, 
  Users, 
  CheckCircle, 
  DollarSign, 
  Calendar,
  MapPin,
  Building,
  Share,
  Edit,
  MoreVertical,
  Phone,
  Mail,
  User,
  Clock,
  AlertCircle,
  Download,
  Upload,
  Trash2,
  Plus,
  ArrowLeft
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useEntities } from '@/hooks/useEntities';
import { useOfficers } from '@/hooks/useOfficers';
import { useComplianceChecks } from '@/hooks/useComplianceChecks';
import { useDocuments } from '@/hooks/useDocuments';
import { Entity } from '@/types/entity';
import { EntityEditModal } from '@/components/EntityEditModal';
import { OfficerModal } from '@/components/OfficerModal';
import { ComplianceModal } from '@/components/ComplianceModal';
import { DocumentUpload } from '@/components/DocumentUpload';
import { DocumentList } from '@/components/DocumentList';

const EntityDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entity, setEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isOfficerModalOpen, setIsOfficerModalOpen] = useState(false);
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState<any>(null);
  const [selectedComplianceCheck, setSelectedComplianceCheck] = useState<any>(null);
  const { getEntity, updateEntity } = useEntities();
  const { officers, addOfficer, updateOfficer, deleteOfficer } = useOfficers(id);
  const { complianceChecks, addComplianceCheck, updateComplianceCheck, deleteComplianceCheck } = useComplianceChecks(id);
  const { documents, deleteDocument, downloadDocument } = useDocuments(id);

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
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Entity Officers</h3>
              <Button size="sm" onClick={() => {
                setSelectedOfficer(null);
                setIsOfficerModalOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Officer
              </Button>
            </div>
            
            <div className="grid gap-4">
              {officers.map((officer) => (
                <Card key={officer.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold">{officer.name}</h4>
                          <Badge variant={officer.is_active ? 'default' : 'secondary'}>
                            {officer.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{officer.title}</p>
                        {officer.email && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Mail className="h-3 w-3 mr-1" />
                            {officer.email}
                          </div>
                        )}
                        {officer.phone && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Phone className="h-3 w-3 mr-1" />
                            {officer.phone}
                          </div>
                        )}
                        {officer.appointment_date && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            Appointed: {new Date(officer.appointment_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedOfficer(officer);
                            setIsOfficerModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Officer</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove {officer.name} from this entity?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteOfficer(officer.id)}>
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {officers.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No officers added yet</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => {
                        setSelectedOfficer(null);
                        setIsOfficerModalOpen(true);
                      }}
                    >
                      Add First Officer
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Tabs defaultValue="view" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="view">View Documents</TabsTrigger>
                <TabsTrigger value="upload">Upload Document</TabsTrigger>
              </TabsList>
              <TabsContent value="view">
                <DocumentList entityId={id} title="Entity Documents" />
              </TabsContent>
              <TabsContent value="upload">
                <DocumentUpload entityId={id} />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Compliance Status</h3>
              <Button size="sm" onClick={() => {
                setSelectedComplianceCheck(null);
                setIsComplianceModalOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Compliance Check
              </Button>
            </div>
            
            <div className="grid gap-4">
              {complianceChecks.map((check) => (
                <Card key={check.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{check.check_name}</h4>
                          <Badge variant={
                            check.status === 'completed' ? 'default' :
                            check.status === 'pending' ? 'secondary' :
                            check.status === 'overdue' ? 'destructive' : 'outline'
                          }>
                            {check.status.charAt(0).toUpperCase() + check.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground capitalize">{check.check_type.replace('_', ' ')}</p>
                        {check.due_date && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            Due: {new Date(check.due_date).toLocaleDateString()}
                          </div>
                        )}
                        {check.completion_date && (
                          <div className="flex items-center text-sm text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed: {new Date(check.completion_date).toLocaleDateString()}
                          </div>
                        )}
                        {check.notes && (
                          <p className="text-sm text-muted-foreground">{check.notes}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedComplianceCheck(check);
                            setIsComplianceModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Compliance Check</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this compliance check?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteComplianceCheck(check.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {complianceChecks.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No compliance checks added yet</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => {
                        setSelectedComplianceCheck(null);
                        setIsComplianceModalOpen(true);
                      }}
                    >
                      Add First Check
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="financials" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Annual Fees
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${(entity.registered_agent_fee || 0) + (entity.independent_director_fee || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total annual compliance costs
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Registered Agent Fee
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${entity.registered_agent_fee}</div>
                  <p className="text-xs text-muted-foreground">
                    {entity.registered_agent_fee_due_date && (
                      `Due: ${new Date(entity.registered_agent_fee_due_date).toLocaleDateString()}`
                    )}
                  </p>
                </CardContent>
              </Card>

              {entity.independent_director_fee && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Director Fee
                    </CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${entity.independent_director_fee}</div>
                    <p className="text-xs text-muted-foreground">
                      {entity.independent_director_fee_due_date && (
                        `Due: ${new Date(entity.independent_director_fee_due_date).toLocaleDateString()}`
                      )}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {isEditModalOpen && entity && (
          <EntityEditModal
            entity={entity}
            open={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleSaveEntity}
          />
        )}

        {id && (
          <>
            <OfficerModal
              isOpen={isOfficerModalOpen}
              onClose={() => {
                setIsOfficerModalOpen(false);
                setSelectedOfficer(null);
              }}
              onSave={selectedOfficer ? 
                async (data) => { await updateOfficer(selectedOfficer.id, data); } :
                async (data) => { await addOfficer(data); }
              }
              officer={selectedOfficer}
              entityId={id}
            />

            <ComplianceModal
              isOpen={isComplianceModalOpen}
              onClose={() => {
                setIsComplianceModalOpen(false);
                setSelectedComplianceCheck(null);
              }}
              onSave={selectedComplianceCheck ? 
                async (data) => { await updateComplianceCheck(selectedComplianceCheck.id, data); } :
                async (data) => { await addComplianceCheck(data); }
              }
              complianceCheck={selectedComplianceCheck}
              entityId={id}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default EntityDetails;