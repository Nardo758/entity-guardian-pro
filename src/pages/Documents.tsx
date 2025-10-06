import React, { useState } from 'react';
import { DocumentUpload } from '@/components/DocumentUpload';
import { DocumentList } from '@/components/DocumentList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useEntities } from '@/hooks/useEntities';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Upload, FolderOpen } from 'lucide-react';
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

import { useNavigate } from "react-router-dom";

const Documents: React.FC = () => {
  const navigate = useNavigate();
  const { entities, loading: entitiesLoading } = useEntities();
  const [selectedEntityId, setSelectedEntityId] = useState<string | undefined>(undefined);
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
       <DashboardHeader
          title="Document Management"
          subtitle="Upload, organize, and manage your business documents"
          onAddEntity={() => setShowAddForm(true)} />

        <div className="grid gap-6 p-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Filter by Entity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="entity-filter">Entity</Label>
                <Select value={selectedEntityId || 'all'} onValueChange={(value) => setSelectedEntityId(value === 'all' ? undefined : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an entity or view all documents" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Documents</SelectItem>
                    {!entitiesLoading && entities.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.name} ({entity.type.replace('_', ' ').toUpperCase()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="view" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="view" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                View Documents
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Documents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="view" className="space-y-6">
              <DocumentList
                entityId={selectedEntityId}
                title={selectedEntityId ? `Documents for ${entities.find(e => e.id === selectedEntityId)?.name}` : 'All Documents'}
              />
            </TabsContent>

            <TabsContent value="upload" className="space-y-6">
              <DocumentUpload
                entityId={selectedEntityId}
                onUploadComplete={() => {
                  // Could add some notification or refresh logic here
                }}
              />

              {selectedEntityId && (
                <DocumentList
                  entityId={selectedEntityId}
                  title={`Recent uploads for ${entities.find(e => e.id === selectedEntityId)?.name}`}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Documents;