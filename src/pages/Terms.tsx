import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, FileText, Shield, Users } from "lucide-react";

const Terms = () => {
  const lastUpdated = "December 15, 2024";
  
  const sections = [
    {
      id: "acceptance",
      title: "1. Acceptance of Terms",
      icon: FileText,
      content: [
        "By accessing and using EntityRenewal Pro, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.",
        "These terms constitute a legally binding agreement between you and EntityRenewal Pro.",
        "If you do not agree to these terms, you must not use our service."
      ]
    },
    {
      id: "service-description",
      title: "2. Service Description",
      icon: Shield,
      content: [
        "EntityRenewal Pro is a comprehensive business entity management platform that helps organizations track renewals, manage compliance, and maintain corporate records.",
        "Our service includes entity tracking, renewal notifications, document management, and compliance monitoring features.",
        "We reserve the right to modify or discontinue any aspect of our service with reasonable notice."
      ]
    },
    {
      id: "user-responsibilities",
      title: "3. User Responsibilities",
      icon: Users,
      content: [
        "You are responsible for maintaining the confidentiality of your account credentials.",
        "You agree to provide accurate and complete information when using our service.",
        "You must not use our service for any unlawful purpose or in violation of any applicable laws.",
        "You are responsible for all activities that occur under your account."
      ]
    },
    {
      id: "data-usage",
      title: "4. Data Usage and Privacy",
      icon: Shield,
      content: [
        "We collect and process your data in accordance with our Privacy Policy.",
        "You retain ownership of all data you input into our system.",
        "We implement industry-standard security measures to protect your data.",
        "You grant us permission to process your data to provide our services."
      ]
    },
    {
      id: "payment-terms",
      title: "5. Payment Terms",
      icon: FileText,
      content: [
        "Subscription fees are billed in advance on a monthly or annual basis.",
        "All fees are non-refundable except as required by law.",
        "We may change our pricing with 30 days' notice to existing customers.",
        "Failure to pay may result in service suspension or termination."
      ]
    },
    {
      id: "limitation-liability",
      title: "6. Limitation of Liability",
      icon: Shield,
      content: [
        "Our service is provided 'as is' without warranties of any kind.",
        "We are not liable for any indirect, incidental, or consequential damages.",
        "Our total liability is limited to the amount you paid for our service in the preceding 12 months.",
        "Some jurisdictions do not allow the exclusion of certain warranties or damages."
      ]
    },
    {
      id: "termination",
      title: "7. Termination",
      icon: FileText,
      content: [
        "Either party may terminate this agreement at any time with notice.",
        "Upon termination, your right to use our service will cease immediately.",
        "We will provide you with an opportunity to export your data for a reasonable period.",
        "Provisions that should survive termination will remain in effect."
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
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Terms of Service</h1>
              <p className="text-muted-foreground">Legal terms and conditions for using EntityRenewal Pro</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              Last updated: {lastUpdated}
            </Badge>
            <Badge variant="outline">Version 2.1</Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid gap-6">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle>Important Notice</CardTitle>
              <CardDescription>
                Please read these terms carefully before using our service
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                These Terms of Service govern your use of EntityRenewal Pro and related services. 
                By using our platform, you agree to comply with and be bound by these terms. 
                If you have any questions about these terms, please contact our legal team.
              </p>
            </CardContent>
          </Card>

          {/* Terms Sections */}
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
              <CardTitle>Contact Us</CardTitle>
              <CardDescription>
                Questions about these terms? We're here to help
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Email:</strong> legal@entityrenewal.pro</p>
                <p><strong>Address:</strong> 123 Business Ave, Suite 400, Corporate City, CC 12345</p>
                <p><strong>Phone:</strong> +1 (555) 123-4567</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Terms;