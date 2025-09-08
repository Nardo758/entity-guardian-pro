import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Save, X, AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface EntityEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: any;
  onSave: (updatedEntity: any) => void;
}

const EntityEditModal = ({ isOpen, onClose, entity, onSave }: EntityEditModalProps) => {
  const [formData, setFormData] = useState(entity);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [loading, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  useEffect(() => {
    setFormData(entity);
    setHasUnsavedChanges(false);
  }, [entity]);

  const handleInputChange = (field: string, value: any, nested?: string) => {
    const newData = { ...formData };
    
    if (nested) {
      newData[nested] = { ...newData[nested], [field]: value };
    } else {
      newData[field] = value;
    }
    
    setFormData(newData);
    setHasUnsavedChanges(true);
  };

  const handleOfficerChange = (index: number, field: string, value: string) => {
    const newOfficers = [...formData.officers];
    newOfficers[index] = { ...newOfficers[index], [field]: value };
    setFormData({ ...formData, officers: newOfficers });
    setHasUnsavedChanges(true);
  };

  const addOfficer = () => {
    const newOfficer = {
      name: "",
      title: "",
      appointed: new Date().toISOString().split('T')[0],
      email: "",
      phone: ""
    };
    setFormData({
      ...formData,
      officers: [...formData.officers, newOfficer]
    });
    setHasUnsavedChanges(true);
  };

  const removeOfficer = (index: number) => {
    const newOfficers = formData.officers.filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, officers: newOfficers });
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate required fields
      if (!formData.name || !formData.type || !formData.jurisdiction) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }

      // In real app, would call API to update entity
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      onSave(formData);
      setHasUnsavedChanges(false);
      
      toast({
        title: "Entity Updated",
        description: "All changes have been saved successfully"
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save changes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
        onClose();
        setHasUnsavedChanges(false);
      }
    } else {
      onClose();
    }
  };

  const handleTabChange = (value: string) => {
    if (hasUnsavedChanges) {
      if (window.confirm("You have unsaved changes. Save before switching tabs?")) {
        handleSave();
      }
    }
    setActiveTab(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Edit Entity: {formData.name}</span>
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-warning">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Unsaved Changes
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Make changes to your entity information. Changes are synchronized across all tabs.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="officers">Officers</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="financials">Financials</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto pr-2">
              <TabsContent value="overview" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Entity Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) => handleInputChange("status", value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Dissolved">Dissolved</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="type">Entity Type *</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value) => handleInputChange("type", value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LLC">LLC</SelectItem>
                            <SelectItem value="Corporation">Corporation</SelectItem>
                            <SelectItem value="Partnership">Partnership</SelectItem>
                            <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="jurisdiction">Jurisdiction *</Label>
                        <Select
                          value={formData.jurisdiction}
                          onValueChange={(value) => handleInputChange("jurisdiction", value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Delaware">Delaware</SelectItem>
                            <SelectItem value="Nevada">Nevada</SelectItem>
                            <SelectItem value="Wyoming">Wyoming</SelectItem>
                            <SelectItem value="California">California</SelectItem>
                            <SelectItem value="New York">New York</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="incorporationDate">Incorporation Date</Label>
                        <Input
                          id="incorporationDate"
                          type="date"
                          value={formData.incorporationDate}
                          onChange={(e) => handleInputChange("incorporationDate", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="nextRenewalDate">Next Renewal Date</Label>
                        <Input
                          id="nextRenewalDate"
                          type="date"
                          value={formData.nextRenewalDate}
                          onChange={(e) => handleInputChange("nextRenewalDate", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Registered Agent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <Label htmlFor="registeredAgent">Registered Agent</Label>
                      <Input
                        id="registeredAgent"
                        value={formData.registeredAgent}
                        onChange={(e) => handleInputChange("registeredAgent", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="officers" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Officers & Directors</CardTitle>
                      <CardDescription>Manage entity officers and their information</CardDescription>
                    </div>
                    <Button onClick={addOfficer} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Officer
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formData.officers.map((officer: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Officer {index + 1}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOfficer(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Name</Label>
                            <Input
                              value={officer.name}
                              onChange={(e) => handleOfficerChange(index, "name", e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>Title</Label>
                            <Input
                              value={officer.title}
                              onChange={(e) => handleOfficerChange(index, "title", e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>Email</Label>
                            <Input
                              type="email"
                              value={officer.email || ""}
                              onChange={(e) => handleOfficerChange(index, "email", e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>Appointment Date</Label>
                            <Input
                              type="date"
                              value={officer.appointed}
                              onChange={(e) => handleOfficerChange(index, "appointed", e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={formData.contact.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value, "contact")}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.contact.email}
                          onChange={(e) => handleInputChange("email", e.target.value, "contact")}
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={formData.contact.website}
                          onChange={(e) => handleInputChange("website", e.target.value, "contact")}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Address</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="street">Street Address</Label>
                      <Input
                        id="street"
                        value={formData.address.street}
                        onChange={(e) => handleInputChange("street", e.target.value, "address")}
                        className="mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={formData.address.city}
                          onChange={(e) => handleInputChange("city", e.target.value, "address")}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={formData.address.state}
                          onChange={(e) => handleInputChange("state", e.target.value, "address")}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="zipCode">ZIP Code</Label>
                        <Input
                          id="zipCode"
                          value={formData.address.zipCode}
                          onChange={(e) => handleInputChange("zipCode", e.target.value, "address")}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="financials" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="annualFee">Annual Fee ($)</Label>
                        <Input
                          id="annualFee"
                          type="number"
                          value={formData.financials.annualFee}
                          onChange={(e) => handleInputChange("annualFee", parseFloat(e.target.value) || 0, "financials")}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="registeredAgentFee">Registered Agent Fee ($)</Label>
                        <Input
                          id="registeredAgentFee"
                          type="number"
                          value={formData.financials.registeredAgentFee}
                          onChange={(e) => handleInputChange("registeredAgentFee", parseFloat(e.target.value) || 0, "financials")}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Total Due: ${(formData.financials.annualFee + formData.financials.registeredAgentFee).toFixed(2)}</Label>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <Separator />
        
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {hasUnsavedChanges && (
              <>
                <AlertTriangle className="h-4 w-4 text-warning" />
                You have unsaved changes
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading || !hasUnsavedChanges}
              className="min-w-[100px]"
            >
              {loading ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EntityEditModal;