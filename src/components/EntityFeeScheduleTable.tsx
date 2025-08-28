import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Entity } from '@/types/entity';
import { stateRequirements } from '@/lib/state-requirements';

interface EntityFeeScheduleTableProps {
  entities: Entity[];
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const EntityFeeScheduleTable: React.FC<EntityFeeScheduleTableProps> = ({ entities }) => {
  // Calculate fees for each entity by month
  const getEntityFees = (entity: Entity) => {
    const fees = Array(12).fill(0);
    
    // Entity renewal fee (assuming due in formation month)
    const formationMonth = new Date(entity.formation_date).getMonth();
    const entityFee = stateRequirements[entity.state][entity.type].fee;
    if (entityFee > 0) {
      fees[formationMonth] += entityFee;
    }
    
    // Registered agent fee
    if (entity.registered_agent_fee && entity.registered_agent_fee_due_date) {
      const agentMonth = new Date(entity.registered_agent_fee_due_date).getMonth();
      fees[agentMonth] += entity.registered_agent_fee;
    }
    
    // Independent director fee
    if (entity.independent_director_fee && entity.independent_director_fee_due_date) {
      const directorMonth = new Date(entity.independent_director_fee_due_date).getMonth();
      fees[directorMonth] += entity.independent_director_fee;
    }
    
    return fees;
  };

  // Calculate monthly totals
  const monthlyTotals = Array(12).fill(0);
  const entityFeeData = entities.map(entity => {
    const fees = getEntityFees(entity);
    fees.forEach((fee, index) => {
      monthlyTotals[index] += fee;
    });
    return { entity, fees };
  });

  const formatCurrency = (amount: number) => {
    return amount > 0 ? `$${amount.toFixed(2)}` : '-';
  };

  return (
    <Card className="w-full bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="bg-gradient-to-r from-primary to-primary-dark text-primary-foreground rounded-t-lg">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          📅 Entity Fee Schedule - 2025
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold text-foreground min-w-[200px]">
                  Entity / Fee Type
                </TableHead>
                {months.map((month) => (
                  <TableHead key={month} className="text-center font-semibold text-foreground min-w-[80px]">
                    {month}
                  </TableHead>
                ))}
                <TableHead className="text-center font-semibold text-foreground min-w-[100px]">
                  Total
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entityFeeData.map(({ entity, fees }) => (
                <React.Fragment key={entity.id}>
                  {/* Entity Renewal Row */}
                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                          {entity.state}
                        </Badge>
                        {entity.name} - Entity Renewal
                      </div>
                    </TableCell>
                    {fees.map((fee, index) => (
                      <TableCell key={index} className="text-center">
                        <span className={fee > 0 ? 'text-success font-semibold' : 'text-muted-foreground'}>
                          {formatCurrency(fee)}
                        </span>
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold text-success">
                      {formatCurrency(fees.reduce((sum, fee) => sum + fee, 0))}
                    </TableCell>
                  </TableRow>
                  
                  {/* Registered Agent Row */}
                  {entity.registered_agent_fee && entity.registered_agent_fee > 0 && (
                    <TableRow className="hover:bg-muted/30">
                      <TableCell className="font-medium pl-8">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-info/10 text-info border-info/20">
                            Agent
                          </Badge>
                          {entity.name} - Registered Agent
                        </div>
                      </TableCell>
                      {months.map((_, index) => {
                        const agentFee = entity.registered_agent_fee_due_date && 
                          new Date(entity.registered_agent_fee_due_date).getMonth() === index 
                          ? entity.registered_agent_fee : 0;
                        return (
                          <TableCell key={index} className="text-center">
                            <span className={agentFee > 0 ? 'text-info font-semibold' : 'text-muted-foreground'}>
                              {formatCurrency(agentFee)}
                            </span>
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center font-semibold text-info">
                        {formatCurrency(entity.registered_agent_fee)}
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
              
              {/* Monthly Totals Row */}
              <TableRow className="bg-primary/10 border-t-2 border-primary/20 font-bold">
                <TableCell className="font-bold text-primary">
                  MONTHLY TOTALS
                </TableCell>
                {monthlyTotals.map((total, index) => (
                  <TableCell key={index} className="text-center font-bold text-primary">
                    {formatCurrency(total)}
                  </TableCell>
                ))}
                <TableCell className="text-center font-bold text-primary text-lg">
                  {formatCurrency(monthlyTotals.reduce((sum, total) => sum + total, 0))}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};