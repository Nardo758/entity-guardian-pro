import React, { useState } from 'react';
import { Trash2, Archive, Tag, AlertTriangle, CheckSquare, X, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BulkOperation } from '@/types/entity';

interface BulkOperationsProps {
  selectedEntities: string[];
  onClearSelection: () => void;
  onBulkOperation: (operation: BulkOperation) => void;
  totalEntities: number;
}

export const BulkOperations: React.FC<BulkOperationsProps> = ({
  selectedEntities,
  onClearSelection,
  onBulkOperation,
  totalEntities
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [showTagUpdate, setShowTagUpdate] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [newTags, setNewTags] = useState<string>('');
  const [newPriority, setNewPriority] = useState<string>('');

  if (selectedEntities.length === 0) return null;

  const handleBulkDelete = () => {
    onBulkOperation({
      type: 'delete',
      entityIds: selectedEntities
    });
    setShowDeleteConfirm(false);
    onClearSelection();
  };

  const handleStatusUpdate = () => {
    if (!newStatus) return;
    onBulkOperation({
      type: 'updateStatus',
      entityIds: selectedEntities,
      value: newStatus
    });
    setShowStatusUpdate(false);
    setNewStatus('');
    onClearSelection();
  };

  const handleTagUpdate = () => {
    const tags = newTags.split(',').map(tag => tag.trim()).filter(Boolean);
    onBulkOperation({
      type: 'updateTags',
      entityIds: selectedEntities,
      value: tags
    });
    setShowTagUpdate(false);
    setNewTags('');
    onClearSelection();
  };

  const handleArchive = () => {
    onBulkOperation({
      type: 'archive',
      entityIds: selectedEntities
    });
    onClearSelection();
  };

  const handlePriorityUpdate = (priority: string) => {
    onBulkOperation({
      type: 'setPriority',
      entityIds: selectedEntities,
      value: parseInt(priority)
    });
    onClearSelection();
  };

  return (
    <Card className="mb-6 border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="default" className="bg-primary">
              <CheckSquare className="w-3 h-3 mr-1" />
              {selectedEntities.length} selected
            </Badge>
            <span className="text-sm text-muted-foreground">
              of {totalEntities} entities
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Actions */}
            <Dialog open={showStatusUpdate} onOpenChange={setShowStatusUpdate}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Update Status
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Status for {selectedEntities.length} entities</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">New Status</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowStatusUpdate(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleStatusUpdate} disabled={!newStatus}>
                    Update Status
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showTagUpdate} onOpenChange={setShowTagUpdate}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Tag className="w-4 h-4 mr-2" />
                  Add Tags
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Tags to {selectedEntities.length} entities</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={newTags}
                      onChange={(e) => setNewTags(e.target.value)}
                      placeholder="e.g. important, renewal-pending, review"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter tags separated by commas. These will be added to existing tags.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowTagUpdate(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleTagUpdate} disabled={!newTags}>
                    Add Tags
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Priority Update */}
            <Select onValueChange={handlePriorityUpdate}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Priority 1</SelectItem>
                <SelectItem value="2">Priority 2</SelectItem>
                <SelectItem value="3">Priority 3</SelectItem>
                <SelectItem value="4">Priority 4</SelectItem>
                <SelectItem value="5">Priority 5</SelectItem>
              </SelectContent>
            </Select>

            <Separator orientation="vertical" className="h-6" />

            {/* Destructive Actions */}
            <Button variant="outline" size="sm" onClick={handleArchive}>
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </Button>

            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Deletion</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Are you sure you want to delete {selectedEntities.length} entities? 
                    This action cannot be undone.
                  </p>
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="flex items-center text-destructive text-sm">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      This will permanently delete all selected entities and their associated data.
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleBulkDelete}>
                    Delete {selectedEntities.length} Entities
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="ghost" size="sm" onClick={onClearSelection}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};