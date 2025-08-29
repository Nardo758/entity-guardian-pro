import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Building,
  Clock,
  BarChart3,
  PieChart,
  Filter,
  ExternalLink
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { useEntities } from "@/hooks/useEntities";
import { usePayments } from "@/hooks/usePayments";
import { useAnalytics } from "@/hooks/useAnalytics";
import { MetricsChart } from "@/components/charts/MetricsChart";
import { ComplianceChart } from "@/components/charts/ComplianceChart";

// Calculate expense categories from real payment data
const getExpenseCategories = (payments: any[]) => {
  const categoryMap: Record<string, number> = {};
  let total = 0;

  payments.forEach(payment => {
    const amount = Number(payment.amount);
    const type = payment.type || 'Other Fees';
    
    categoryMap[type] = (categoryMap[type] || 0) + amount;
    total += amount;
  });

  return Object.entries(categoryMap).map(([name, amount]) => ({
    name,
    amount,
    percentage: total > 0 ? Math.round((amount / total) * 100 * 10) / 10 : 0
  }));
};

// Calculate monthly expense trends from real payment data
const getMonthlyExpenses = (payments: any[]) => {
  const monthMap: Record<string, number> = {};
  
  payments.forEach(payment => {
    if (payment.paid_date) {
      const date = new Date(payment.paid_date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      monthMap[monthKey] = (monthMap[monthKey] || 0) + Number(payment.amount);
    }
  });

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map(month => ({
    month,
    amount: monthMap[month] || 0
  })).filter(item => item.amount > 0);
};

const Reports = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState("6months");
  const [selectedEntityFilter, setSelectedEntityFilter] = useState("all");
  
  // Fetch real data
  const { entities, loading: entitiesLoading } = useEntities();
  const { payments, loading: paymentsLoading } = usePayments();
  const { 
    analyticsData, 
    complianceChecks, 
    costProjections, 
    loading: analyticsLoading 
  } = useAnalytics();

  const loading = entitiesLoading || paymentsLoading || analyticsLoading;

  // Calculate real metrics
  const totalEntities = entities.length;
  const activeEntities = entities.length; // Assuming all are active for now
  const pendingPayments = payments.filter(p => p.status === 'pending').length;
  const overduePayments = payments.filter(p => {
    const dueDate = new Date(p.due_date);
    return p.status === 'pending' && dueDate < new Date();
  }).length;
  const totalAnnualFees = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const upcomingPayments = payments
    .filter(p => {
      const dueDate = new Date(p.due_date);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return p.status === 'pending' && dueDate <= thirtyDaysFromNow;
    })
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const completedCompliance = complianceChecks.filter(c => c.status === 'completed').length;
  const complianceRate = complianceChecks.length > 0 
    ? Math.round((completedCompliance / complianceChecks.length) * 100) 
    : 0;

  // Calculate expense data from real payments
  const expenseCategories = getExpenseCategories(payments.filter(p => p.status === 'paid'));
  const monthlyExpenses = getMonthlyExpenses(payments.filter(p => p.status === 'paid'));
  const maxMonthlyAmount = Math.max(...monthlyExpenses.map(m => m.amount), 1);

  // Generate insights based on real data
  const upcomingRenewals = payments.filter(p => {
    const dueDate = new Date(p.due_date);
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
    return p.status === 'pending' && dueDate <= sixtyDaysFromNow;
  }).length;

  const handleExportReport = (reportType: string) => {
    toast({
      title: "Report Export Started",
      description: `${reportType} report is being generated and will be downloaded shortly.`,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'filed':
      case 'paid':
      case 'completed':
        return <Badge className="bg-success text-white">✓ {status}</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-warning text-warning">⏳ {status}</Badge>;
      case 'overdue':
        return <Badge variant="destructive">⚠ {status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading reports...</div>
        </div>
      </div>
    );
  }

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
                Reports & Analytics
              </h1>
              <p className="text-muted-foreground">Comprehensive insights into your entity portfolio</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate("/analytics")}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Advanced Analytics
              <ExternalLink className="h-3 w-3" />
            </Button>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => handleExportReport("comprehensive")}>
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Entities</p>
                  <p className="text-2xl font-bold">{totalEntities}</p>
                  <p className="text-xs text-success flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Active portfolio
                  </p>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <Building className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-success">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Entities</p>
                  <p className="text-2xl font-bold">{activeEntities}</p>
                  <p className="text-xs text-success flex items-center mt-1">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {complianceRate}% compliance rate
                  </p>
                </div>
                <div className="p-3 rounded-full bg-success/10">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-warning">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                  <p className="text-2xl font-bold">{pendingPayments}</p>
                  <p className="text-xs text-warning flex items-center mt-1">
                    <Clock className="h-3 w-3 mr-1" />
                    {overduePayments} overdue
                  </p>
                </div>
                <div className="p-3 rounded-full bg-warning/10">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-destructive">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Annual Fees</p>
                  <p className="text-2xl font-bold">${totalAnnualFees.toLocaleString()}</p>
                  <p className="text-xs text-primary flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    ${upcomingPayments.toLocaleString()} upcoming
                  </p>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="renewals" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="renewals">Payment Schedule</TabsTrigger>
            <TabsTrigger value="compliance">Compliance Status</TabsTrigger>
            <TabsTrigger value="charts">Visual Analytics</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="renewals" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Payments
                  </CardTitle>
                  <CardDescription>Payments requiring attention</CardDescription>
                </div>
                <Button variant="outline" onClick={() => handleExportReport("payments")}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No payments found</p>
                    </div>
                  ) : (
                    payments
                      .filter(payment => payment.status === 'pending')
                      .slice(0, 10)
                      .map((payment) => {
                        const dueDate = new Date(payment.due_date);
                        const today = new Date();
                        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        const isOverdue = daysUntilDue < 0;
                        
                        return (
                          <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-semibold">{payment.entity_name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {payment.type} • Due: {dueDate.toLocaleDateString()}
                              </p>
                              <p className="text-sm">
                                {isOverdue 
                                  ? `${Math.abs(daysUntilDue)} days overdue` 
                                  : `${daysUntilDue} days remaining`
                                }
                              </p>
                            </div>
                            <div className="text-right space-y-2">
                              <p className="font-semibold">${payment.amount}</p>
                              <Badge variant={isOverdue ? 'destructive' : 'secondary'}>
                                {isOverdue ? '⚠ overdue' : '⏳ pending'}
                              </Badge>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Compliance Overview
                  </CardTitle>
                  <CardDescription>Track compliance status and requirements</CardDescription>
                </div>
                <Button variant="outline" onClick={() => handleExportReport("compliance")}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complianceChecks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No compliance checks found</p>
                    </div>
                  ) : (
                    complianceChecks.slice(0, 10).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-semibold">{item.check_name}</h4>
                          <p className="text-sm text-muted-foreground">{item.check_type}</p>
                          {item.due_date && (
                            <p className="text-sm text-muted-foreground">
                              Due: {new Date(item.due_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {getStatusBadge(item.status)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="charts" className="space-y-6">
            <div className="grid gap-6">
              {analyticsData.length > 0 && (
                <MetricsChart analyticsData={analyticsData} />
              )}
              
              {complianceChecks.length > 0 && (
                <ComplianceChart complianceChecks={complianceChecks} />
              )}
              
              {(analyticsData.length === 0 && complianceChecks.length === 0) && (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No chart data available yet</p>
                      <p className="text-sm mt-2">Analytics data will appear here as you use the system</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Expense Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Expense Categories
                  </CardTitle>
                  <CardDescription>Breakdown of annual entity expenses</CardDescription>
                </CardHeader>
                 <CardContent>
                   <div className="space-y-4">
                     {expenseCategories.length === 0 ? (
                       <div className="text-center py-4 text-muted-foreground">
                         <p>No expense data available yet</p>
                         <p className="text-sm mt-1">Expense categories will appear as payments are made</p>
                       </div>
                     ) : (
                       expenseCategories.map((category, index) => (
                         <div key={index} className="space-y-2">
                           <div className="flex items-center justify-between">
                             <span className="text-sm font-medium">{category.name}</span>
                             <span className="text-sm text-muted-foreground">
                               ${category.amount.toLocaleString()} ({category.percentage}%)
                             </span>
                           </div>
                           <div className="w-full bg-secondary/20 rounded-full h-2">
                             <div 
                               className="bg-primary h-2 rounded-full transition-all duration-300"
                               style={{ width: `${category.percentage}%` }}
                             />
                           </div>
                         </div>
                       ))
                     )}
                   </div>
                 </CardContent>
              </Card>

              {/* Monthly Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Monthly Expense Trends
                  </CardTitle>
                  <CardDescription>Entity-related expenses over time</CardDescription>
                </CardHeader>
                 <CardContent>
                   <div className="space-y-4">
                     {monthlyExpenses.length === 0 ? (
                       <div className="text-center py-4 text-muted-foreground">
                         <p>No monthly expense data available yet</p>
                         <p className="text-sm mt-1">Monthly trends will appear as payments are processed</p>
                       </div>
                     ) : (
                       monthlyExpenses.map((month, index) => (
                         <div key={index} className="flex items-center justify-between">
                           <span className="text-sm font-medium w-12">{month.month}</span>
                           <div className="flex-1 mx-4">
                             <div className="w-full bg-secondary/20 rounded-full h-3">
                               <div 
                                 className="bg-gradient-to-r from-primary to-primary/70 h-3 rounded-full transition-all duration-300"
                                 style={{ width: `${(month.amount / maxMonthlyAmount) * 100}%` }}
                               />
                             </div>
                           </div>
                           <span className="text-sm text-muted-foreground w-16 text-right">
                             ${month.amount.toLocaleString()}
                           </span>
                         </div>
                       ))
                     )}
                   </div>
                 </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Key Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Key Insights
                  </CardTitle>
                  <CardDescription>AI-powered analysis of your entity portfolio</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                     <div className="flex items-start gap-3">
                       <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                       <div>
                         <p className="font-medium text-success">
                           {complianceRate >= 75 ? 'Strong Compliance Rate' : 'Good Compliance Progress'}
                         </p>
                         <p className="text-sm text-muted-foreground">
                           {complianceRate}% of your compliance checks are completed
                           {complianceRate >= 75 ? ', above industry average of 75%' : ', working towards 75% target'}
                         </p>
                       </div>
                     </div>
                   </div>
                   
                   {(upcomingRenewals > 0 || overduePayments > 0) && (
                     <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                       <div className="flex items-start gap-3">
                         <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                         <div>
                           <p className="font-medium text-warning">
                             {overduePayments > 0 ? 'Overdue Payments Need Attention' : 'Renewal Attention Needed'}
                           </p>
                           <p className="text-sm text-muted-foreground">
                             {overduePayments > 0 
                               ? `${overduePayments} payments are overdue and need immediate attention`
                               : `${upcomingRenewals} entities require renewal within the next 60 days`
                             }
                           </p>
                         </div>
                       </div>
                     </div>
                   )}

                   {totalEntities >= 5 && (
                     <div className="p-4 bg-info/10 border border-info/20 rounded-lg">
                       <div className="flex items-start gap-3">
                         <DollarSign className="h-5 w-5 text-info mt-0.5" />
                         <div>
                           <p className="font-medium text-info">Portfolio Management</p>
                           <p className="text-sm text-muted-foreground">
                             With {totalEntities} entities, consider our premium management features for better oversight
                           </p>
                         </div>
                       </div>
                     </div>
                   )}
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Recommendations
                  </CardTitle>
                  <CardDescription>Actionable steps to improve your entity management</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                     {overduePayments > 0 && (
                       <div className="p-3 border border-destructive/20 rounded-lg">
                         <p className="font-medium text-sm text-destructive">Address overdue payments immediately</p>
                         <p className="text-xs text-muted-foreground">
                           {overduePayments} payment{overduePayments > 1 ? 's are' : ' is'} overdue and require immediate attention
                         </p>
                       </div>
                     )}
                     
                     {upcomingRenewals > 0 && (
                       <div className="p-3 border border-warning/20 rounded-lg">
                         <p className="font-medium text-sm text-warning">Prepare for upcoming renewals</p>
                         <p className="text-xs text-muted-foreground">
                           {upcomingRenewals} renewal{upcomingRenewals > 1 ? 's' : ''} needed within 60 days - set reminders now
                         </p>
                       </div>
                     )}

                     <div className="p-3 border rounded-lg">
                       <p className="font-medium text-sm">Set up automated renewal reminders</p>
                       <p className="text-xs text-muted-foreground">
                         Never miss a deadline with our automated notification system
                       </p>
                     </div>
                     
                     {complianceChecks.length > 0 && complianceRate < 90 && (
                       <div className="p-3 border rounded-lg">
                         <p className="font-medium text-sm">Improve compliance tracking</p>
                         <p className="text-xs text-muted-foreground">
                           Current rate: {complianceRate}% - aim for 90% or higher for optimal management
                         </p>
                       </div>
                     )}

                     {totalEntities >= 10 && (
                       <div className="p-3 border rounded-lg">
                         <p className="font-medium text-sm">Consider portfolio optimization</p>
                         <p className="text-xs text-muted-foreground">
                           With {totalEntities} entities, review consolidation opportunities to reduce costs
                         </p>
                       </div>
                     )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Reports;