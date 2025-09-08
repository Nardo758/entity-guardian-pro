import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar as CalendarIcon, Bell, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEntities } from '@/hooks/useEntities';
import { usePayments } from '@/hooks/usePayments';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'renewal' | 'payment' | 'filing' | 'other';
  entityName?: string;
  amount?: number;
  status: 'upcoming' | 'overdue' | 'completed';
}

const Calendar: React.FC = () => {
  const navigate = useNavigate();
  const { entities } = useEntities();
  const { payments } = usePayments();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedView, setSelectedView] = useState<'month' | 'list'>('month');
  const [typeFilter, setTypeFilter] = useState('all');

  // Generate calendar events from entities and payments
  const events = useMemo((): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    
    // Add renewal events from entities
    entities.forEach(entity => {
      if (entity.registered_agent_fee_due_date) {
        events.push({
          id: `renewal-${entity.id}`,
          title: `Agent Fee Due - ${entity.name}`,
          date: new Date(entity.registered_agent_fee_due_date),
          type: 'renewal',
          entityName: entity.name,
          amount: entity.registered_agent_fee,
          status: new Date(entity.registered_agent_fee_due_date) < new Date() ? 'overdue' : 'upcoming'
        });
      }
      
      if (entity.independent_director_fee_due_date) {
        events.push({
          id: `director-${entity.id}`,
          title: `Director Fee Due - ${entity.name}`,
          date: new Date(entity.independent_director_fee_due_date),
          type: 'renewal',
          entityName: entity.name,
          amount: entity.independent_director_fee,
          status: new Date(entity.independent_director_fee_due_date) < new Date() ? 'overdue' : 'upcoming'
        });
      }

      // Add annual filing reminder (1 year from formation)
      const formationDate = new Date(entity.formation_date);
      const annualFilingDate = new Date(formationDate);
      annualFilingDate.setFullYear(annualFilingDate.getFullYear() + 1);
      
      events.push({
        id: `filing-${entity.id}`,
        title: `Annual Filing - ${entity.name}`,
        date: annualFilingDate,
        type: 'filing',
        entityName: entity.name,
        status: annualFilingDate < new Date() ? 'overdue' : 'upcoming'
      });
    });

    // Add payment events
    payments.forEach(payment => {
      if (payment.due_date && payment.status === 'pending') {
        events.push({
          id: `payment-${payment.id}`,
          title: `Payment Due - ${payment.entity_name}`,
          date: new Date(payment.due_date),
          type: 'payment',
          entityName: payment.entity_name,
          amount: payment.amount,
          status: new Date(payment.due_date) < new Date() ? 'overdue' : 'upcoming'
        });
      }
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [entities, payments]);

  const filteredEvents = events.filter(event => 
    typeFilter === 'all' || event.type === typeFilter
  );

  const getEventColor = (type: string, status: string) => {
    if (status === 'overdue') return 'bg-red-100 text-red-800 border-red-200';
    
    switch (type) {
      case 'renewal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'payment':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'filing':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 border border-border/50"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayEvents = getEventsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <div key={day} className={`p-2 border border-border/50 min-h-[100px] ${
          isToday ? 'bg-primary/5 border-primary/20' : ''
        }`}>
          <div className={`text-sm font-medium mb-1 ${
            isToday ? 'text-primary' : 'text-foreground'
          }`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 2).map(event => (
              <div
                key={event.id}
                className={`text-xs p-1 rounded border ${getEventColor(event.type, event.status)}`}
              >
                {event.title.length > 20 ? `${event.title.slice(0, 20)}...` : event.title}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-muted-foreground">
                +{dayEvents.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-0 border border-border rounded-lg overflow-hidden">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-3 bg-muted font-medium text-center border-b border-border">
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  const renderListView = () => {
    const upcomingEvents = filteredEvents.filter(event => 
      event.date >= new Date()
    ).slice(0, 20);

    return (
      <div className="space-y-4">
        {upcomingEvents.map(event => (
          <Card key={event.id} className={`border-l-4 ${
            event.status === 'overdue' ? 'border-l-red-500' : 'border-l-blue-500'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium">{event.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {event.date.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  {event.entityName && (
                    <p className="text-sm text-muted-foreground">
                      Entity: {event.entityName}
                    </p>
                  )}
                </div>
                <div className="text-right space-y-2">
                  <Badge variant={event.status === 'overdue' ? 'destructive' : 'default'}>
                    {event.status === 'overdue' ? 'Overdue' : 'Upcoming'}
                  </Badge>
                  {event.amount && (
                    <p className="text-sm font-medium">${event.amount}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {upcomingEvents.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No upcoming events</h3>
              <p className="text-muted-foreground text-center">
                All your renewal deadlines and payments are up to date!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const overdue = filteredEvents.filter(e => e.status === 'overdue').length;
  const upcoming = filteredEvents.filter(e => e.status === 'upcoming' && 
    e.date >= new Date() && e.date <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  ).length;

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
            <div>
              <h1 className="text-3xl font-bold">Calendar & Deadlines</h1>
              <p className="text-muted-foreground">Track renewal deadlines and important dates</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <Bell className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overdue}</div>
              <p className="text-xs text-muted-foreground">Requires immediate attention</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next 30 Days</CardTitle>
              <CalendarIcon className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{upcoming}</div>
              <p className="text-xs text-muted-foreground">Upcoming deadlines</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredEvents.length}</div>
              <p className="text-xs text-muted-foreground">All tracked events</p>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newDate = new Date(currentDate);
                      newDate.setMonth(newDate.getMonth() - 1);
                      setCurrentDate(newDate);
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-lg font-semibold min-w-[200px] text-center">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newDate = new Date(currentDate);
                      newDate.setMonth(newDate.getMonth() + 1);
                      setCurrentDate(newDate);
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="renewal">Renewals</SelectItem>
                    <SelectItem value="payment">Payments</SelectItem>
                    <SelectItem value="filing">Filings</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex border border-border rounded-lg">
                  <Button
                    variant={selectedView === 'month' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedView('month')}
                    className="rounded-r-none"
                  >
                    Month
                  </Button>
                  <Button
                    variant={selectedView === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedView('list')}
                    className="rounded-l-none"
                  >
                    List
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Content */}
        <div className="space-y-6">
          {selectedView === 'month' ? renderMonthView() : renderListView()}
        </div>
      </div>
    </div>
  );
};

export default Calendar;