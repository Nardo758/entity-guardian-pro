import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar as CalendarIcon, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEntities } from '@/hooks/useEntities';
import { stateRequirements } from '@/lib/state-requirements';

interface EntityPayment {
  month: number;
  amount: number;
  type: 'agent_fee' | 'renewal_fee' | 'director_fee';
  status: 'overdue' | 'due_this_month' | 'due_next_month' | 'future';
}

const Calendar: React.FC = () => {
  const navigate = useNavigate();
  const { entities } = useEntities();
  const [selectedYear, setSelectedYear] = useState(2025);

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const entityPaymentData = useMemo(() => {
    return entities.map(entity => {
      const payments: EntityPayment[] = [];
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      // Agent fees - typically due in January
      if (entity.registered_agent_fee) {
        const agentFeeMonth = 0; // January
        let status: EntityPayment['status'] = 'future';
        
        if (selectedYear === currentYear) {
          if (agentFeeMonth < currentMonth) status = 'overdue';
          else if (agentFeeMonth === currentMonth) status = 'due_this_month';
          else if (agentFeeMonth === currentMonth + 1) status = 'due_next_month';
        }

        payments.push({
          month: agentFeeMonth,
          amount: entity.registered_agent_fee,
          type: 'agent_fee',
          status
        });
      }

      // Director fees for Delaware entities - combined with agent fees in January
      if (entity.state === 'DE' && entity.independent_director_fee) {
        const existingJanPayment = payments.find(p => p.month === 0);
        if (existingJanPayment) {
          existingJanPayment.amount += entity.independent_director_fee;
        } else {
          let status: EntityPayment['status'] = 'future';
          
          if (selectedYear === currentYear) {
            if (0 < currentMonth) status = 'overdue';
            else if (0 === currentMonth) status = 'due_this_month';
            else if (0 === currentMonth + 1) status = 'due_next_month';
          }

          payments.push({
            month: 0,
            amount: entity.independent_director_fee,
            type: 'director_fee',
            status
          });
        }
      }

      // Entity renewal fees - based on formation date or state requirements
      const formationDate = new Date(entity.formation_date);
      const renewalMonth = formationDate.getMonth();
      const stateReq = stateRequirements[entity.state as keyof typeof stateRequirements];
      const entityTypeKey = entity.type as keyof typeof stateReq;
      const renewalFee = stateReq && typeof stateReq === 'object' && entityTypeKey in stateReq 
        ? (stateReq[entityTypeKey] as { fee: number }).fee 
        : 0;

      if (renewalFee > 0) {
        let status: EntityPayment['status'] = 'future';
        
        if (selectedYear === currentYear) {
          if (renewalMonth < currentMonth) status = 'overdue';
          else if (renewalMonth === currentMonth) status = 'due_this_month';
          else if (renewalMonth === currentMonth + 1) status = 'due_next_month';
        }

        payments.push({
          month: renewalMonth,
          amount: renewalFee,
          type: 'renewal_fee',
          status
        });
      }

      return {
        entity,
        payments,
        totalAnnual: payments.reduce((sum, p) => sum + p.amount, 0)
      };
    });
  }, [entities, selectedYear]);

  const getPaymentForMonth = (entityPayments: EntityPayment[], month: number) => {
    return entityPayments.filter(p => p.month === month);
  };

  const getCellColor = (status: EntityPayment['status']) => {
    switch (status) {
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'due_this_month':
        return 'bg-yellow-100 text-yellow-800';
      case 'due_next_month':
        return 'bg-orange-100 text-orange-800';
      case 'future':
        return 'bg-blue-50 text-blue-700';
      default:
        return '';
    }
  };

  const formatAmount = (amount: number) => {
    return amount > 0 ? `$${amount.toFixed(2)}` : '$0.00';
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Entity Renewal Calendar</h1>
                <p className="text-muted-foreground">Annual payment schedule by entity and month</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Spreadsheet Calendar */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="font-bold text-foreground border-r border-border w-[180px]">
                      Entity
                    </TableHead>
                    {months.map(month => (
                      <TableHead key={month} className="font-bold text-foreground text-center border-r border-border w-[75px] px-1 text-xs">
                        {month}-{selectedYear.toString().slice(-2)}
                      </TableHead>
                    ))}
                    <TableHead className="font-bold text-foreground text-center bg-green-50 w-[90px] px-1 text-xs">
                      TOTAL
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entityPaymentData.map(({ entity, payments, totalAnnual }, index) => (
                    <TableRow 
                      key={entity.id} 
                      className={`hover:bg-muted/50 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                    >
                      <TableCell className="border-r border-border font-medium">
                        <div>
                          <div className="font-semibold">{entity.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {entity.type} • {entity.state}
                          </div>
                        </div>
                      </TableCell>
                      {months.map((_, monthIndex) => {
                        const monthPayments = getPaymentForMonth(payments, monthIndex);
                        const totalAmount = monthPayments.reduce((sum, p) => sum + p.amount, 0);
                        const hasPayment = totalAmount > 0;
                        const cellColor = hasPayment ? getCellColor(monthPayments[0].status) : '';
                        
                        return (
                          <TableCell 
                            key={monthIndex} 
                            className={`text-center border-r border-border px-1 text-xs ${cellColor}`}
                          >
                            <span className={hasPayment ? 'font-medium' : 'text-muted-foreground'}>
                              {totalAmount > 0 ? `$${totalAmount.toFixed(0)}` : '$0'}
                            </span>
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center font-bold bg-green-50 px-1 text-xs">
                        ${totalAnnual.toFixed(0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Color Legend */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
                <span>Overdue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
                <span>Due This Month</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-100 border border-orange-200 rounded"></div>
                <span>Due Next Month</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
                <span>Future Payment</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
                <span className="text-muted-foreground">No Payment</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Calendar;