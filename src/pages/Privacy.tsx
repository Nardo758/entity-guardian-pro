import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Shield, Eye, Database, Users, Lock, Globe, Mail } from "lucide-react";

const Privacy = () => {
  const lastUpdated = "December 15, 2024";
  
  const sections = [
    {
      id: "information-collection",
      title: "1. Information We Collect",
      icon: Database,
      content: [
        "We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.",
        "Account information including name, email address, company details, and billing information.",
        "Business entity data including registration details, renewal dates, and compliance information.",
        "Usage data such as how you interact with our platform, features used, and performance metrics."
      ]
    },
    {
      id: "information-usage",
      title: "2. How We Use Your Information",
      icon: Eye,
      content: [
        "To provide, maintain, and improve our services and customer support.",
        "To process transactions and send you related information including confirmations and invoices.",
        "To send you technical notices, updates, security alerts, and administrative messages.",
        "To communicate with you about products, services, offers, and events, and provide news and information we think will be of interest to you."
      ]
    },
    {
      id: "information-sharing",
      title: "3. Information Sharing and Disclosure",
      icon: Users,
      content: [
        "We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.",
        "We may share information with trusted third-party service providers who assist us in operating our platform.",
        "We may disclose your information if required by law or to protect our rights, property, or safety.",
        "In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction."
      ]
    },
    {
      id: "data-security",
      title: "4. Data Security",
      icon: Lock,
      content: [
        "We implement appropriate technical and organizational measures to protect your personal information.",
        "All data transmission is encrypted using industry-standard SSL/TLS protocols.",
        "We regularly review and update our security practices to ensure ongoing protection.",
        "Access to personal information is restricted to authorized personnel only."
      ]
    },
    {
      id: "data-retention",
      title: "5. Data Retention",
      icon: Database,
      content: [
        "We retain your personal information for as long as necessary to provide our services.",
        "Account information is retained until you delete your account or request deletion.",
        "Business entity data may be retained for compliance and legal requirements.",
        "You may request deletion of your personal information at any time, subject to legal obligations."
      ]
    },
    {
      id: "your-rights",
      title: "6. Your Rights and Choices",
      icon: Shield,
      content: [
        "You have the right to access, update, or delete your personal information.",
        "You can opt-out of marketing communications at any time.",
        "You may request a copy of the personal information we hold about you.",
        "You have the right to file a complaint with a data protection authority."
      ]
    },
    {
      id: "international-transfers",
      title: "7. International Data Transfers",
      icon: Globe,
      content: [
        "Your information may be transferred to and processed in countries other than your own.",
        "We ensure that such transfers comply with applicable data protection laws.",
        "We implement appropriate safeguards to protect your information during international transfers.",
        "By using our service, you consent to the transfer of your information as described."
      ]
    },
    {
      id: "cookies",
      title: "8. Cookies and Tracking Technologies",
      icon: Eye,
      content: [
        "We use cookies and similar technologies to provide and improve our services.",
        "Essential cookies are necessary for the platform to function properly.",
        "Analytics cookies help us understand how our service is used and improve performance.",
        "You can control cookie settings through your browser, though some features may not work properly if disabled."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Privacy Policy</h1>
              <p className="text-muted-foreground">How we collect, use, and protect your personal information</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              Last updated: {lastUpdated}
            </Badge>
            <Badge variant="outline">GDPR Compliant</Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid gap-6">
          {/* Introduction */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your privacy is important to us. This Privacy Policy explains how EntityRenewal Pro 
              collects, uses, and protects your personal information when you use our services.
            </AlertDescription>
          </Alert>

          {/* Quick Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy at a Glance</CardTitle>
              <CardDescription>
                Key points about how we handle your data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Secure by Design</h4>
                    <p className="text-sm text-muted-foreground">End-to-end encryption and industry-standard security</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Eye className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Transparent Usage</h4>
                    <p className="text-sm text-muted-foreground">Clear information about how your data is used</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Your Control</h4>
                    <p className="text-sm text-muted-foreground">Full control over your personal information</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Global Compliance</h4>
                    <p className="text-sm text-muted-foreground">GDPR, CCPA, and other privacy law compliant</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Sections */}
          {sections.map((section, index) => (
            <Card key={section.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <section.icon className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{section.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {section.content.map((paragraph, pIndex) => (
                    <p key={pIndex} className="text-muted-foreground leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </CardContent>
              {index < sections.length - 1 && <Separator className="mx-6" />}
            </Card>
          ))}

          {/* Contact Information */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Privacy Contact
              </CardTitle>
              <CardDescription>
                Questions about your privacy or this policy?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Data Protection Officer:</strong> privacy@entityrenewal.pro</p>
                <p><strong>Address:</strong> 123 Business Ave, Suite 400, Corporate City, CC 12345</p>
                <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                <p className="text-muted-foreground pt-2">
                  We're committed to responding to privacy inquiries within 30 days.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Privacy;