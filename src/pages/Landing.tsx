import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building, Shield, Bell, Users, TrendingUp, CheckCircle, Star, ArrowRight, Clock,
  FileText, Zap, Globe, Phone, Mail, Download, Monitor
} from 'lucide-react';
import { STRIPE_PRICING_TIERS } from '@/lib/stripe';
import { usePWA } from '@/hooks/usePWA';
import { useToast } from '@/hooks/use-toast';

const Landing = () => {
  const navigate = useNavigate();
  const { installApp, isInstallable, isInstalled, isSupported, canInstall, getBrowserInstructions } = usePWA();
  const { toast } = useToast();

  const handleDesktopDownload = async () => {
    if (isInstalled) {
      toast({
        title: "App Already Installed ✅",
        description: "Entity Renewal Pro is already installed on your device. Look for it in your apps or desktop.",
        variant: "default"
      });
      return;
    }

    if (!isSupported) {
      const { browser, instruction } = getBrowserInstructions();
      toast({
        title: `Install on ${browser}`,
        description: instruction,
        duration: 6000
      });
      return;
    }

    if (canInstall) {
      toast({
        title: "Installing App...",
        description: "Please wait while we install Entity Renewal Pro to your device.",
      });

      const success = await installApp();
      if (success) {
        toast({
          title: "App Installed Successfully! 🎉",
          description: "Entity Renewal Pro has been added to your desktop. You can now access it directly from your device.",
          duration: 6000
        });
      } else {
        toast({
          title: "Installation Cancelled",
          description: "No worries! You can install the app anytime using your browser's menu options.",
          variant: "destructive"
        });
      }
    } else {
      const { browser, instruction } = getBrowserInstructions();
      toast({
        title: `Manual Installation - ${browser}`,
        description: instruction,
        duration: 8000
      });
    }
  };

  const features = [
    {
      icon: Building,
      title: "Entity Management",
      description: "Track and manage all your business entities in one centralized dashboard."
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Never miss a renewal deadline with intelligent reminder systems."
    },
    {
      icon: Shield,
      title: "Compliance Tracking",
      description: "Stay compliant with automated monitoring of regulatory requirements."
    },
    {
      icon: FileText,
      title: "Document Storage",
      description: "Securely store and organize all your important business documents."
    },
    {
      icon: TrendingUp,
      title: "Analytics & Reports",
      description: "Get insights into your entity portfolio with detailed analytics."
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Work together with your team and manage permissions effectively."
    }
  ];

  const benefits = [
    "Automated renewal tracking",
    "Multi-state compliance support",
    "Secure document management",
    "Real-time notifications",
    "Team collaboration tools",
    "Detailed reporting & analytics"
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      company: "Johnson & Associates LLC",
      text: "Entity Renewal Pro has saved us countless hours and prevented missed deadlines. It's indispensable for our business.",
      rating: 5
    },
    {
      name: "Mike Chen",
      company: "TechStart Ventures",
      text: "The automated notifications alone have paid for themselves. We've never missed a renewal since switching.",
      rating: 5
    },
    {
      name: "Lisa Rodriguez",
      company: "Rodriguez Holdings",
      text: "Managing multiple entities across different states used to be a nightmare. This platform makes it simple.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center">
                <Building className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Entity Renewal Pro</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </button>
              <Link to="/support" className="text-muted-foreground hover:text-foreground transition-colors">
                Support
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-primary to-primary-dark">
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-4" variant="secondary">
              <Zap className="w-3 h-3 mr-1" />
              Trusted by 500+ Businesses
            </Badge>

            <h1 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Never Miss Another Business Entity Renewal
            </h1>

            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Automate your entity management, stay compliant, and focus on growing your business.
              Entity Renewal Pro handles the complexity so you don't have to.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" asChild className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-lg px-8">
                <Link to="/signup">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Learn More
              </Button>
            </div>

            {/* Desktop Download Section */}
            <div className="flex justify-center mb-12">
              <Button
                size="lg"
                variant="secondary"
                className={`text-lg px-8 bg-card/80 hover:bg-card border border-border/50 backdrop-blur-sm shadow-lg transition-all duration-200 ${isInstalled ? 'bg-success/10 border-success/20 text-success-foreground' :
                    canInstall ? 'bg-primary/10 border-primary/20 hover:bg-primary/20' :
                      'bg-muted/50'
                  }`}
                onClick={handleDesktopDownload}
              >
                <Monitor className="mr-2 h-5 w-5" />
                {isInstalled ? 'App Installed ✅' :
                  canInstall ? 'Install Desktop App' :
                    'Get Desktop Access'}
                {!isInstalled && <Download className="ml-2 h-4 w-4" />}
              </Button>
            </div>

            <div className="text-center mb-8">
              <p className="text-sm text-muted-foreground">
                {isInstalled ?
                  '✅ Enjoy the full desktop experience with Entity Renewal Pro' :
                  canInstall ?
                    '💡 Install for offline access, faster loading, and native desktop experience' :
                    isSupported ?
                      '📱 Add Entity Renewal Pro to your desktop for quick access' :
                      '🔗 Access Entity Renewal Pro directly from your desktop'
                }
              </p>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>No setup fees</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>24/7 support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Everything You Need to Manage Your Entities
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools to track, manage, and maintain compliance for all your business entities
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
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

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                Why Choose Entity Renewal Pro?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Save time, reduce risk, and stay compliant with our comprehensive entity management platform.
              </p>

              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-lg">{benefit}</span>
                  </div>
                ))}
              </div>

              <Button size="lg" asChild className="mt-8 bg-gradient-to-r from-primary to-primary-dark">
                <Link to="/signup">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            <div className="lg:pl-8">
              <Card className="border-0 shadow-2xl bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Save 10+ Hours Per Month
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Manual tracking</span>
                      <span className="text-muted-foreground">15 hrs/month</span>
                    </div>
                    <div className="flex justify-between">
                      <span>With Entity Renewal Pro</span>
                      <span className="text-green-600 font-semibold">2 hrs/month</span>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Time Saved</span>
                      <span className="text-primary">13 hrs/month</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground">
              Choose the plan that fits your business needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {Object.values(STRIPE_PRICING_TIERS).map((tier) => (
              <Card key={tier.id} className={`relative border-0 shadow-lg bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 ${tier.popular ? 'ring-2 ring-primary shadow-2xl scale-105' : ''}`}>
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                  <div className="mt-4">
                    <div className="text-3xl font-bold">${tier.monthlyPrice}</div>
                    <div className="text-sm text-muted-foreground">per month</div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="text-center mb-4">
                    <div className="text-sm font-medium">
                      {typeof tier.entities === 'number' ? `${tier.entities} entities` : tier.entities}
                    </div>
                    {tier.perEntityCost && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {tier.perEntityCost}
                      </div>
                    )}
                  </div>

                  <ul className="space-y-2 text-sm mb-6">
                    {tier.features.slice(0, 4).map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full ${tier.popular ? 'bg-gradient-to-r from-primary to-primary-dark' : ''}`}
                    variant={tier.popular ? 'default' : 'outline'}
                    asChild
                  >
                    <Link to="/paid-register">Subscribe Now</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              All plans include a 14-day free trial • No setup fees • Cancel anytime
            </p>
            <Button variant="outline" asChild>
              <Link to="/paid-register">
                View All Features
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Trusted by Business Owners Like You
            </h2>
            <p className="text-xl text-muted-foreground">
              See what our customers have to say about Entity Renewal Pro
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardDescription className="text-base italic">
                    "{testimonial.text}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.company}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary-dark text-primary-foreground">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to Simplify Your Entity Management?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join hundreds of businesses that trust Entity Renewal Pro to keep them compliant and organized.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild className="text-lg px-8">
              <Link to="/paid-register">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 border-white text-primary">
              <Link to="/support">
                Talk to Sales
                <Phone className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center">
                  <Building className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold">Entity Renewal Pro</span>
              </div>
              <p className="text-muted-foreground">
                Simplifying entity management for businesses everywhere.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link to="#pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link to="/api-docs" className="hover:text-foreground transition-colors">API</Link></li>
                <li><Link to="/integrations" className="hover:text-foreground transition-colors">Integrations</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/support" className="hover:text-foreground transition-colors">Help Center</Link></li>
                <li><Link to="/support" className="hover:text-foreground transition-colors">Contact Us</Link></li>
                <li><Link to="/api-docs" className="hover:text-foreground transition-colors">Documentation</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground">
              © 2024 Entity Renewal Pro. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <Button asChild className="bg-gradient-to-r from-primary to-primary-dark">
                <Link to="/signup">Subscribe Now</Link>
              </Button>
              <a href="mailto:support@entityrenewal.pro" className="text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="h-5 w-5" />
              </a>
              <a href="tel:+1-555-0123" className="text-muted-foreground hover:text-foreground transition-colors">
                <Phone className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;