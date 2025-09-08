import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  Loader2,
  RefreshCw,
  CheckCircle 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ComplianceData {
  state: string;
  stateName: string;
  lastUpdated: string;
  generalInfo: {
    registeredAgentRequired: boolean;
    annualFees: number[];
    filingDeadlines: string[];
    penalties: Record<string, string | number>;
  };
  requirements: Record<string, any>;
}

interface ComplianceIntegrationProps {
  entityId?: string;
  entityState?: string;
  entityType?: string;
  onComplianceUpdated?: (data: ComplianceData) => void;
}

const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' }
];

const ENTITY_TYPES = [
  'LLC',
  'Corporation',
  'Partnership',
  'Non-Profit'
];

export const ComplianceIntegration: React.FC<ComplianceIntegrationProps> = ({
  entityId,
  entityState,
  entityType,
  onComplianceUpdated
}) => {
  const [selectedState, setSelectedState] = useState(entityState || '');
  const [selectedEntityType, setSelectedEntityType] = useState(entityType || '');
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchComplianceData = async () => {
    if (!selectedState) {
      setError('Please select a state');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('compliance-api', {
        body: {
          state: selectedState,
          entityType: selectedEntityType || undefined,
          entityId: entityId || undefined
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setComplianceData(data);
      onComplianceUpdated?.(data);
      toast.success(`Compliance data updated for ${data.stateName}`);

    } catch (error) {
      console.error('Error fetching compliance data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch compliance data');
    } finally {
      setLoading(false);
    }
  };

  const formatFee = (fee: number | string) => {
    if (typeof fee === 'number') {
      return fee === 0 ? 'No fee' : `$${fee.toLocaleString()}`;
    }
    return fee;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            State Compliance Information
          </CardTitle>
          <CardDescription>
            Get the latest compliance requirements and deadlines for your entity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">State</label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state.code} value={state.code}>
                      {state.name} ({state.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Entity Type (Optional)</label>
              <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select entity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  {ENTITY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={fetchComplianceData}
            disabled={loading || !selectedState}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching Compliance Data...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Get Compliance Information
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {complianceData && (
        <div className="space-y-6">
          {/* General Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                {complianceData.stateName} - General Requirements
              </CardTitle>
              <CardDescription>
                Last updated: {new Date(complianceData.lastUpdated).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Registered Agent Required
                  </h4>
                  <Badge 
                    variant={complianceData.generalInfo.registeredAgentRequired ? "destructive" : "secondary"}
                  >
                    {complianceData.generalInfo.registeredAgentRequired ? "Required" : "Not Required"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Annual Fees
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {complianceData.generalInfo.annualFees.map((fee, index) => (
                      <Badge key={index} variant="outline">
                        {formatFee(fee)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Filing Deadlines
                </h4>
                <div className="flex flex-wrap gap-2">
                  {complianceData.generalInfo.filingDeadlines.map((deadline, index) => (
                    <Badge key={index} variant="secondary">
                      {deadline}
                    </Badge>
                  ))}
                </div>
              </div>

              {Object.keys(complianceData.generalInfo.penalties).length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Penalties for Late Filing
                  </h4>
                  <div className="space-y-1">
                    {Object.entries(complianceData.generalInfo.penalties).map(([key, value]) => (
                      <div key={key} className="text-sm text-muted-foreground">
                        <strong className="capitalize">{key.replace(/([A-Z])/g, ' $1')}: </strong>
                        {formatFee(value)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Entity-Specific Requirements */}
          {Object.keys(complianceData.requirements).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Entity-Specific Requirements</CardTitle>
                <CardDescription>
                  Detailed compliance requirements by entity type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(complianceData.requirements).map(([entityType, requirements]) => (
                    <div key={entityType} className="space-y-3">
                      <h4 className="font-medium text-lg border-b pb-2">
                        {entityType}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {Object.entries(requirements as Record<string, any>).map(([req, value]) => (
                          <div key={req} className="flex justify-between items-center">
                            <span className="capitalize font-medium">
                              {req.replace(/([A-Z])/g, ' $1')}:
                            </span>
                            <span className="text-muted-foreground">
                              {typeof value === 'boolean' 
                                ? (value ? 'Yes' : 'No')
                                : typeof value === 'number' 
                                  ? formatFee(value)
                                  : String(value)
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                      {Object.keys(complianceData.requirements).length > 1 && (
                        <Separator />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {entityId && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Compliance deadlines have been automatically created for this entity based on {complianceData.stateName} requirements.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
};