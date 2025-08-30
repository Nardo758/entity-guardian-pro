import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck, Building2, DollarSign, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AgentSignupCTA: React.FC = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: Building2,
      title: 'Professional Exposure',
      description: 'Get discovered by business owners nationwide'
    },
    {
      icon: DollarSign,
      title: 'Steady Income',
      description: 'Build recurring revenue with registered agent services'
    },
    {
      icon: Users,
      title: 'Client Management',
      description: 'Manage all your clients from one dashboard'
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-secondary/5 to-primary/5">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Are You a Registered Agent?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join our network of professional registered agents and connect with business owners
            who need your services. Grow your client base and streamline your operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card key={index} className="text-center border-border/50">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Button
            onClick={() => navigate('/agent-signup')}
            size="lg"
            className="bg-primary hover:bg-primary-dark text-lg px-8 py-3"
          >
            <UserCheck className="w-5 h-5 mr-2" />
            Join as Registered Agent
          </Button>
          <p className="text-sm text-muted-foreground mt-3">
            Free to join • Start connecting with clients today
          </p>
        </div>
      </div>
    </section>
  );
};

export default AgentSignupCTA;