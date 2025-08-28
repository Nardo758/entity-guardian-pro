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

// Mock data for reports
const mockReportData = {
  overview: {
    totalEntities: 12,
    activeEntities: 10,
    pendingRenewals: 3,
    overdueRenewals: 1,
    totalAnnualFees: 5400,
    upcomingPayments: 1350
  },
  renewals: [
    { entity: "TechCorp Solutions LLC", dueDate: "2024-03-15", amount: 450, status: "pending", daysLeft: 45 },
    { entity: "Innovation Partners Inc", dueDate: "2024-04-20", amount: 300, status: "pending", daysLeft: 80 },
    { entity: "Digital Ventures Corp", dueDate: "2024-02-10", amount: 600, status: "overdue", daysLeft: -15 }
  ],
  compliance: [
    { entity: "TechCorp Solutions LLC", type: "Annual Report", status: "filed", date: "2024-01-15" },
    { entity: "Innovation Partners Inc", type: "Tax Filing", status: "pending", date: "2024-03-15" },
    { entity: "Digital Ventures Corp", type: "License Renewal", status: "overdue", date: "2024-01-01" }
  ],
  expenses: {
    categories: [
      { name: "State Filing Fees", amount: 2100, percentage: 38.9 },
      { name: "Registered Agent Fees", amount: 1800, percentage: 33.3 },
      { name: "Legal Services", amount: 900, percentage: 16.7 },
      { name: "Other Fees", amount: 600, percentage: 11.1 }
    ],
    monthly: [
      { month: "Jan", amount: 850 },
      { month: "Feb", amount: 1200 },
      { month: "Mar", amount: 950 },
      { month: "Apr", amount: 1100 },
      { month: "May", amount: 800 },
      { month: "Jun", amount: 1300 }
    ]
  }
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
                    {mockReportData.expenses.categories.map((category, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{category.name}</span>
                          <span className="text-sm text-muted-foreground">
                            ${category.amount} ({category.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-secondary/20 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${category.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
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
                    {mockReportData.expenses.monthly.map((month, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium w-12">{month.month}</span>
                        <div className="flex-1 mx-4">
                          <div className="w-full bg-secondary/20 rounded-full h-3">
                            <div 
                              className="bg-gradient-to-r from-primary to-primary/70 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${(month.amount / 1300) * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground w-16 text-right">
                          ${month.amount}
                        </span>
                      </div>
                    ))}
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
                        <p className="font-medium text-success">Strong Compliance Rate</p>
                        <p className="text-sm text-muted-foreground">
                          83% of your entities are in good standing, above industry average of 75%
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                      <div>
                        <p className="font-medium text-warning">Renewal Attention Needed</p>
                        <p className="text-sm text-muted-foreground">
                          3 entities require renewal within the next 60 days
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-info/10 border border-info/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <DollarSign className="h-5 w-5 text-info mt-0.5" />
                      <div>
                        <p className="font-medium text-info">Cost Optimization</p>
                        <p className="text-sm text-muted-foreground">
                          Consider consolidating registered agent services to save $600/year
                        </p>
                      </div>
                    </div>
                  </div>
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
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium text-sm">Set up automated renewal reminders</p>
                      <p className="text-xs text-muted-foreground">
                        Never miss a deadline with our 90, 60, and 30-day alerts
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium text-sm">Schedule quarterly compliance reviews</p>
                      <p className="text-xs text-muted-foreground">
                        Regular reviews help catch issues before they become problems
                      </p>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <p className="font-medium text-sm">Consider premium support package</p>
                      <p className="text-xs text-muted-foreground">
                        With 12 entities, premium support could save time and ensure compliance
                      </p>
                    </div>
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