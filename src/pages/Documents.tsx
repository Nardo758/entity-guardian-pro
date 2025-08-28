import React, { useState } from 'react';
import { DocumentUpload } from '@/components/DocumentUpload';
import { DocumentList } from '@/components/DocumentList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useEntities } from '@/hooks/useEntities';
import { FileText, Upload, FolderOpen } from 'lucide-react';

const Documents: React.FC = () => {
  const { entities, loading: entitiesLoading } = useEntities();
  const [selectedEntityId, setSelectedEntityId] = useState<string | undefined>(undefined);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Document Management</h1>
          <p className="text-muted-foreground">
            Upload, organize, and manage your business documents
          </p>
        </div>
      </div>

      <div className="grid gap-6">
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
  );
};

export default Documents;