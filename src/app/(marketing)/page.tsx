import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/primitives";
import {
  Brain,
  Upload,
  Sparkles,
  Trophy,
  CheckCircle,
  ArrowRight,
  Star,
  Zap,
  Shield,
  Globe,
  BookOpen,
  GraduationCap,
} from "lucide-react";

const features = [
  {
    icon: Upload,
    title: "Upload Any PDF",
    description: "Upload lecture notes, textbooks, manuals, or any document and our system extracts the text instantly.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Brain,
    title: "AI Quiz Generation",
    description: "Powered by Google Gemini AI, generating MCQs, true/false, and short answer questions with precision.",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    icon: Trophy,
    title: "Track Your Progress",
    description: "Attempt quizzes, see instant results, review explanations, and track improvement over time.",
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
  {
    icon: Globe,
    title: "Share & Export",
    description: "Share quizzes with students or colleagues, export as JSON or PDF. (Premium feature)",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your PDFs and quizzes are private by default. Enterprise-grade security with Supabase Storage.",
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "Generate a full quiz from a 50-page document in under 10 seconds. No waiting, no fuss.",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
];

const steps = [
  { number: "01", title: "Upload PDF", description: "Drag and drop your PDF. We support up to 10MB files." },
  { number: "02", title: "Configure Quiz", description: "Choose question type, difficulty, number of questions, and more." },
  { number: "03", title: "AI Generates Quiz", description: "Gemini AI reads your content and creates targeted questions in seconds." },
  { number: "04", title: "Study & Improve", description: "Attempt your quiz, review explanations, share with others." },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for individuals getting started",
    features: [
      "3 PDF uploads/month",
      "5 quiz generations/month",
      "Up to 10 questions/quiz",
      "MCQ & True/False only",
      "Basic difficulty levels",
    ],
    cta: "Get Started Free",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "per month",
    description: "For serious learners and educators",
    features: [
      "50 PDF uploads/month",
      "100 quiz generations/month",
      "Up to 100 questions/quiz",
      "All question types + Mixed",
      "Explanations for every answer",
      "Export quiz as PDF",
      "Share quizzes publicly",
      "Advanced difficulty control",
    ],
    cta: "Start Pro Trial",
    href: "/register?plan=pro",
    highlighted: true,
  },
];

const faqs = [
  {
    q: "What types of PDFs work best?",
    a: "Text-based PDFs work best — lecture notes, textbooks, research papers, manuals. Scanned image PDFs are not currently supported.",
  },
  {
    q: "Can I use this for any language?",
    a: "Yes! You can specify the language when generating a quiz. Gemini supports most major languages.",
  },
  {
    q: "Is my data private?",
    a: "Yes. PDFs are stored in private Supabase Storage buckets. Only you can access your documents and quizzes.",
  },
  {
    q: "How accurate are the AI-generated questions?",
    a: "Questions are generated strictly from your PDF content. The AI is prompted to avoid hallucination. Accuracy is high for factual content.",
  },
  {
    q: "Can I cancel my subscription?",
    a: "Yes. Cancel anytime from your account settings. You retain access until the end of your billing period.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1">
        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b bg-gradient-to-b from-purple-50 via-white to-white dark:from-purple-950/20">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-200 rounded-full blur-3xl opacity-20 -z-0" />

          <div className="container relative z-10 py-20 md:py-32 text-center">
            <Badge className="mb-6 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 border-purple-200 text-sm font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              Powered by Google Gemini AI
            </Badge>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
              Turn Any PDF into an{" "}
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Interactive Quiz
              </span>{" "}
              in Seconds
            </h1>

            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Upload your lecture notes, textbooks, or any PDF. Our AI generates
              MCQs, true/false, and short answer questions instantly. Study
              smarter, not harder.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="gradient" size="xl" asChild>
                <Link href="/register">
                  Start for Free <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>

            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-green-500" /> No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-green-500" /> Free plan available
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-green-500" /> Cancel anytime
              </span>
            </div>
          </div>
        </section>

        {/* ── SOCIAL PROOF ─────────────────────────────────────── */}
        <section className="py-8 border-b bg-muted/30">
          <div className="container">
            <p className="text-center text-sm text-muted-foreground mb-4">
              Trusted by students, teachers, and trainers at
            </p>
            <div className="flex flex-wrap justify-center gap-8 opacity-50 grayscale">
              {["Universities", "Coding Bootcamps", "Corporate Training", "Online Courses", "High Schools"].map((item) => (
                <span key={item} className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" /> {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────────────────────── */}
        <section id="features" className="py-20 md:py-28">
          <div className="container">
            <div className="text-center mb-14">
              <Badge variant="secondary" className="mb-4">Features</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Everything you need to study effectively
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                From upload to insight in seconds — designed for students,
                teachers, and trainers.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f) => (
                <Card key={f.title} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className={`h-11 w-11 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                      <f.icon className={`h-6 w-6 ${f.color}`} />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {f.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────────── */}
        <section id="how-it-works" className="py-20 bg-muted/30 border-y">
          <div className="container">
            <div className="text-center mb-14">
              <Badge variant="secondary" className="mb-4">How It Works</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                From PDF to quiz in 4 steps
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
              {steps.map((step, idx) => (
                <div key={step.number} className="relative">
                  <Card className="h-full">
                    <CardContent className="pt-6">
                      <div className="text-4xl font-black bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3">
                        {step.number}
                      </div>
                      <h3 className="font-semibold text-base mb-2">{step.title}</h3>
                      <p className="text-muted-foreground text-sm">{step.description}</p>
                    </CardContent>
                  </Card>
                  {idx < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ──────────────────────────────────────────── */}
        <section id="pricing" className="py-20 md:py-28">
          <div className="container max-w-4xl">
            <div className="text-center mb-14">
              <Badge variant="secondary" className="mb-4">Pricing</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Simple, transparent pricing
              </h2>
              <p className="text-muted-foreground text-lg">
                Start free, upgrade when you need more.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={plan.highlighted ? "border-2 border-purple-500 shadow-lg relative" : ""}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 px-3 py-1">
                        <Star className="h-3 w-3 mr-1" /> Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardContent className="pt-8 pb-6">
                    <h3 className="font-bold text-xl mb-1">{plan.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-4xl font-extrabold">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">/{plan.period}</span>
                    </div>
                    <Button
                      variant={plan.highlighted ? "gradient" : "outline"}
                      className="w-full mb-6"
                      size="lg"
                      asChild
                    >
                      <Link href={plan.href}>{plan.cta}</Link>
                    </Button>
                    <ul className="space-y-2.5">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <section className="py-20 bg-muted/30 border-y">
          <div className="container max-w-3xl">
            <div className="text-center mb-14">
              <Badge variant="secondary" className="mb-4">FAQ</Badge>
              <h2 className="text-3xl font-bold">Frequently asked questions</h2>
            </div>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <Card key={faq.q}>
                  <CardContent className="pt-5 pb-5">
                    <h3 className="font-semibold mb-2">{faq.q}</h3>
                    <p className="text-muted-foreground text-sm">{faq.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <section className="py-20 md:py-28">
          <div className="container text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to study smarter?
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Join thousands of students and educators using QuizAI to learn
                faster and test their knowledge.
              </p>
              <Button variant="gradient" size="xl" asChild>
                <Link href="/register">
                  Create Your First Quiz Free <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
