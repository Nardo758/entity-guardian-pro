import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Building2, Calendar, FileText, Users, Shield, ArrowRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const Landing = () => {
  const features = [
    {
      icon: Building2,
      title: 'Entity Management',
      description: 'Track all your business entities, their formation dates, and renewal requirements in one place.'
    },
    {
      icon: Calendar,
      title: 'Automated Reminders',
      description: 'Never miss critical renewal deadlines with smart notifications and scheduling.'
    },
    {
      icon: FileText,
      title: 'Document Storage',
      description: 'Securely store and organize all your compliance documents and certificates.'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Invite team members and manage permissions for seamless collaboration.'
    },
    {
      icon: Shield,
      title: 'Compliance Tracking',
      description: 'Stay compliant with automated tracking of regulatory requirements and deadlines.'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Corporate Secretary',
      company: 'TechCorp Inc.',
      content: 'Entity Renewal Pro has transformed how we manage our 50+ subsidiaries. No more missed renewals!',
      rating: 5
    },
    {
      name: 'Michael Rodriguez',
      role: 'Legal Operations',
      company: 'Global Ventures',
      content: 'The automated reminders and document management features have saved us countless hours.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Entity Renewal Pro</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <Badge className="mb-4" variant="secondary">
            Trusted by 1000+ Companies
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Never Miss Another
            <span className="text-primary block">Entity Renewal</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Streamline your business entity management with automated tracking, 
            smart reminders, and comprehensive compliance tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="gap-2">
                Start Free Trial
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              Watch Demo
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">99.9%</div>
              <div className="text-muted-foreground">Renewal Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">10,000+</div>
              <div className="text-muted-foreground">Entities Managed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">500hrs</div>
              <div className="text-muted-foreground">Saved Monthly</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Everything You Need to Stay Compliant
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools designed specifically for corporate compliance professionals
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <feature.icon className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Trusted by Compliance Professionals
            </h2>
            <p className="text-xl text-muted-foreground">
              See what our customers are saying
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-2">
                <CardHeader>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardDescription className="text-base italic">
                    "{testimonial.content}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            Choose the plan that fits your organization's needs
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <Card className="border-2">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Starter</CardTitle>
                <div className="text-4xl font-bold text-primary">$29<span className="text-lg text-muted-foreground">/month</span></div>
                <CardDescription>Perfect for small businesses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Up to 10 entities</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Basic reminders</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Document storage</span>
                </div>
                <Link to="/register" className="block pt-4">
                  <Button className="w-full">Start Free Trial</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Professional */}
            <Card className="border-2 border-primary relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Professional</CardTitle>
                <div className="text-4xl font-bold text-primary">$79<span className="text-lg text-muted-foreground">/month</span></div>
                <CardDescription>For growing companies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Up to 100 entities</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Advanced automation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Team collaboration</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Priority support</span>
                </div>
                <Link to="/register" className="block pt-4">
                  <Button className="w-full">Start Free Trial</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Enterprise */}
            <Card className="border-2">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <div className="text-4xl font-bold text-primary">$199<span className="text-lg text-muted-foreground">/month</span></div>
                <CardDescription>For large organizations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Unlimited entities</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Custom integrations</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Dedicated support</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Advanced analytics</span>
                </div>
                <Link to="/register" className="block pt-4">
                  <Button className="w-full">Contact Sales</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Ready to Streamline Your Entity Management?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of professionals who never miss a renewal deadline
          </p>
          <Link to="/register">
            <Button size="lg" className="gap-2">
              Start Your Free Trial Today
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-6 w-6 text-primary" />
                <span className="font-bold text-foreground">Entity Renewal Pro</span>
              </div>
              <p className="text-muted-foreground">
                The complete solution for business entity compliance and renewal management.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="#" className="hover:text-foreground">Features</Link></li>
                <li><Link to="#" className="hover:text-foreground">Pricing</Link></li>
                <li><Link to="#" className="hover:text-foreground">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/support" className="hover:text-foreground">Help Center</Link></li>
                <li><Link to="/api-docs" className="hover:text-foreground">API Docs</Link></li>
                <li><Link to="#" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-foreground">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 Entity Renewal Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;