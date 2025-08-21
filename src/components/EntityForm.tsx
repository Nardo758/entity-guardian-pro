import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Entity } from '@/types/entity';
import { stateRequirements } from '@/lib/state-requirements';

interface EntityFormProps {
  onSubmit: (entity: Omit<Entity, 'id'>) => void;
  onCancel: () => void;
}

export const EntityForm: React.FC<EntityFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'llc' as Entity['type'],
    state: 'CA',
    formationDate: '',
    registeredAgent: {
      name: '',
      email: '',
      phone: '',
      fee: 0,
      feeDueDate: ''
    },
    independentDirector: {
      name: '',
      email: '',
      phone: '',
      fee: 0,
      feeDueDate: ''
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.formationDate && formData.registeredAgent.name) {
      onSubmit(formData);
    }
  };

  const updateRegisteredAgentFee = (value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, '');
    const numValue = parseFloat(cleanValue) || 0;
    setFormData({
      ...formData,
      registeredAgent: { ...formData.registeredAgent, fee: numValue }
    });
  };

  const updateDirectorFee = (value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, '');
    const numValue = parseFloat(cleanValue) || 0;
    setFormData({
      ...formData,
      independentDirector: { ...formData.independentDirector, fee: numValue }
    });
  };

  const isDelawareEntity = formData.state === 'DE';
  const isDirectorRequired = isDelawareEntity && (formData.type === 'c_corp' || formData.type === 's_corp');

  return (
    <Card className="mb-8 border shadow-sm">
      <CardHeader>
        <CardTitle>Add New Entity</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Entity Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter entity name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Entity Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData({ ...formData, type: value as Entity['type'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                  <SelectItem value="llc">Limited Liability Company (LLC)</SelectItem>
                  <SelectItem value="c_corp">C-Corporation</SelectItem>
                  <SelectItem value="s_corp">S-Corporation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Select 
                value={formData.state} 
                onValueChange={(value) => setFormData({ ...formData, state: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CA">California</SelectItem>
                  <SelectItem value="TX">Texas</SelectItem>
                  <SelectItem value="FL">Florida</SelectItem>
                  <SelectItem value="NY">New York</SelectItem>
                  <SelectItem value="DE">Delaware</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="formationDate">Formation Date</Label>
              <Input
                id="formationDate"
                type="date"
                value={formData.formationDate}
                onChange={(e) => setFormData({ ...formData, formationDate: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Registered Agent */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <h4 className="font-semibold mb-4 text-foreground">Registered Agent *</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agentName">Agent Name *</Label>
                <Input
                  id="agentName"
                  value={formData.registeredAgent.name}
                  onChange={(e) => setFormData({
                    ...formData,
                    registeredAgent: { ...formData.registeredAgent, name: e.target.value }
                  })}
                  placeholder="Enter agent name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agentEmail">Agent Email *</Label>
                <Input
                  id="agentEmail"
                  type="email"
                  value={formData.registeredAgent.email}
                  onChange={(e) => setFormData({
                    ...formData,
                    registeredAgent: { ...formData.registeredAgent, email: e.target.value }
                  })}
                  placeholder="agent@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agentPhone">Agent Phone *</Label>
                <Input
                  id="agentPhone"
                  type="tel"
                  value={formData.registeredAgent.phone}
                  onChange={(e) => setFormData({
                    ...formData,
                    registeredAgent: { ...formData.registeredAgent, phone: e.target.value }
                  })}
                  placeholder="(555) 123-4567"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agentFee">Annual Agent Fee *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="agentFee"
                    type="text"
                    value={formData.registeredAgent.fee > 0 ? formData.registeredAgent.fee.toFixed(2) : ''}
                    onChange={(e) => updateRegisteredAgentFee(e.target.value)}
                    placeholder="150.00"
                    className="pl-8"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the yearly cost for registered agent services
                </p>
              </div>
            </div>
          </div>

          {/* Delaware Special Requirements */}
          {isDelawareEntity && (
            <div className="rounded-lg border bg-info-muted/30 p-4">
              <div className="mb-4">
                <h4 className="font-semibold text-info mb-1">
                  Delaware Special Requirements
                </h4>
                <p className="text-sm text-muted-foreground">
                  Delaware entities have additional compliance requirements
                </p>
              </div>

              <div>
                <h5 className="font-semibold mb-3 text-foreground">
                  Independent Director for Delaware Entities
                  {isDirectorRequired && <span className="text-destructive"> *</span>}
                  {!isDirectorRequired && <span className="text-muted-foreground"> (Optional)</span>}
                </h5>
                <p className="text-xs text-muted-foreground mb-4">
                  {isDirectorRequired 
                    ? 'Required for Delaware Corporations'
                    : 'Optional for Delaware LLCs, Sole Proprietorships, and Partnerships'
                  }
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="directorName">
                      Director Name {isDirectorRequired && <span className="text-destructive">*</span>}
                    </Label>
                    <Input
                      id="directorName"
                      value={formData.independentDirector.name}
                      onChange={(e) => setFormData({
                        ...formData,
                        independentDirector: { ...formData.independentDirector, name: e.target.value }
                      })}
                      placeholder="Enter director name"
                      required={isDirectorRequired}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="directorEmail">
                      Director Email {isDirectorRequired && <span className="text-destructive">*</span>}
                    </Label>
                    <Input
                      id="directorEmail"
                      type="email"
                      value={formData.independentDirector.email}
                      onChange={(e) => setFormData({
                        ...formData,
                        independentDirector: { ...formData.independentDirector, email: e.target.value }
                      })}
                      placeholder="director@example.com"
                      required={isDirectorRequired}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="directorPhone">
                      Director Phone {isDirectorRequired && <span className="text-destructive">*</span>}
                    </Label>
                    <Input
                      id="directorPhone"
                      type="tel"
                      value={formData.independentDirector.phone}
                      onChange={(e) => setFormData({
                        ...formData,
                        independentDirector: { ...formData.independentDirector, phone: e.target.value }
                      })}
                      placeholder="(555) 123-4567"
                      required={isDirectorRequired}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="directorFee">
                      Annual Director Fee {isDirectorRequired && <span className="text-destructive">*</span>}
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="directorFee"
                        type="text"
                        value={formData.independentDirector.fee > 0 ? formData.independentDirector.fee.toFixed(2) : ''}
                        onChange={(e) => updateDirectorFee(e.target.value)}
                        placeholder="2500.00"
                        className="pl-8"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter the yearly compensation for independent director
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="bg-success hover:bg-success/90 text-success-foreground">
              Add Entity
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};