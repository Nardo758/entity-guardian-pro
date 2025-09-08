import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ComplianceRequest {
  state: string;
  entityType?: string;
  entityId?: string;
}

// Mock state compliance data - in production, integrate with actual state APIs
const stateComplianceData = {
  "DE": {
    name: "Delaware",
    requirements: {
      "LLC": {
        annualReport: true,
        annualReportFee: 300,
        annualReportDue: "June 1",
        franchiseTax: true,
        franchiseTaxFee: 300,
        franchiseTaxDue: "June 1"
      },
      "Corporation": {
        annualReport: true,
        annualReportFee: 175,
        annualReportDue: "March 1",
        franchiseTax: true,
        franchiseTaxFee: "Variable",
        franchiseTaxDue: "March 1"
      }
    },
    registeredAgentRequired: true,
    annualFees: [300, 175],
    filingDeadlines: ["March 1", "June 1"],
    penalties: {
      lateAnnualReport: 200,
      lateFranchiseTax: "10% + interest"
    }
  },
  "CA": {
    name: "California",
    requirements: {
      "LLC": {
        annualReport: false,
        statementOfInformation: true,
        statementFee: 20,
        statementDue: "Within 90 days after LLC filing date, then every 2 years",
        franchiseTax: true,
        franchiseTaxFee: 800,
        franchiseTaxDue: "15th day of 4th month"
      },
      "Corporation": {
        annualReport: false,
        statementOfInformation: true,
        statementFee: 25,
        statementDue: "Within 90 days after incorporation, then annually",
        franchiseTax: true,
        franchiseTaxFee: 800,
        franchiseTaxDue: "15th day of 4th month"
      }
    },
    registeredAgentRequired: false,
    annualFees: [800],
    filingDeadlines: ["April 15"],
    penalties: {
      lateStatement: 250,
      lateFranchiseTax: "Various penalties apply"
    }
  },
  "TX": {
    name: "Texas",
    requirements: {
      "LLC": {
        annualReport: false,
        publicInformationReport: true,
        publicInfoFee: 0,
        publicInfoDue: "By May 15th",
        franchiseTax: true,
        franchiseTaxFee: "Variable (0.375% - 0.75%)",
        franchiseTaxDue: "May 15th"
      },
      "Corporation": {
        annualReport: false,
        publicInformationReport: true,
        publicInfoFee: 0,
        publicInfoDue: "By May 15th",
        franchiseTax: true,
        franchiseTaxFee: "Variable (0.375% - 0.75%)",
        franchiseTaxDue: "May 15th"
      }
    },
    registeredAgentRequired: true,
    annualFees: [0],
    filingDeadlines: ["May 15"],
    penalties: {
      latePublicInfo: "Forfeiture of corporate charter",
      lateFranchiseTax: "Various penalties apply"
    }
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      throw new Error("Authentication failed");
    }

    const { state, entityType, entityId }: ComplianceRequest = await req.json();

    if (!state) {
      throw new Error("State is required");
    }

    const stateData = stateComplianceData[state as keyof typeof stateComplianceData];
    if (!stateData) {
      return new Response(JSON.stringify({ 
        error: "State compliance data not available",
        availableStates: Object.keys(stateComplianceData)
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    let response = {
      state: state,
      stateName: stateData.name,
      lastUpdated: new Date().toISOString(),
      generalInfo: {
        registeredAgentRequired: stateData.registeredAgentRequired,
        annualFees: stateData.annualFees,
        filingDeadlines: stateData.filingDeadlines,
        penalties: stateData.penalties
      },
      requirements: stateData.requirements
    };

    // If specific entity type requested, filter requirements
    if (entityType && stateData.requirements[entityType as keyof typeof stateData.requirements]) {
      response = {
        ...response,
        requirements: {
          [entityType]: stateData.requirements[entityType as keyof typeof stateData.requirements]
        }
      };
    }

    // If entity ID provided, create/update compliance deadlines
    if (entityId) {
      const { data: entity, error: entityError } = await supabaseClient
        .from('entities')
        .select('*')
        .eq('id', entityId)
        .eq('user_id', user.id)
        .single();

      if (entityError || !entity) {
        throw new Error("Entity not found or access denied");
      }

      // Create compliance deadlines based on state requirements
      const currentYear = new Date().getFullYear();
      const deadlines = [];

      if (entityType && stateData.requirements[entityType as keyof typeof stateData.requirements]) {
        const req = stateData.requirements[entityType as keyof typeof stateData.requirements] as any;
        
        if (req.annualReportDue) {
          deadlines.push({
            user_id: user.id,
            entity_id: entityId,
            title: `Annual Report - ${entity.name}`,
            description: `File annual report for ${entity.name} in ${stateData.name}`,
            deadline_type: 'annual_report',
            due_date: `${currentYear}-${req.annualReportDue}`,
            filing_fee: req.annualReportFee || 0,
            state: state,
            status: 'pending'
          });
        }

        if (req.franchiseTaxDue && typeof req.franchiseTaxFee === 'number') {
          deadlines.push({
            user_id: user.id,
            entity_id: entityId,
            title: `Franchise Tax - ${entity.name}`,
            description: `Pay franchise tax for ${entity.name} in ${stateData.name}`,
            deadline_type: 'franchise_tax',
            due_date: `${currentYear}-${req.franchiseTaxDue}`,
            filing_fee: req.franchiseTaxFee,
            state: state,
            status: 'pending'
          });
        }
      }

      if (deadlines.length > 0) {
        const { error: deadlineError } = await supabaseClient
          .from('compliance_deadlines')
          .upsert(deadlines, { 
            onConflict: 'user_id,entity_id,deadline_type',
            ignoreDuplicates: false 
          });

        if (deadlineError) {
          console.error('Error creating compliance deadlines:', deadlineError);
        }
      }
    }

    // Log API usage
    await supabaseClient
      .from('api_usage_logs')
      .insert({
        user_id: user.id,
        endpoint: '/compliance-api',
        method: 'POST',
        status_code: 200,
        metadata: { state, entityType, entityId }
      });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Compliance API error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Compliance API failed" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});