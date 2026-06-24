import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container max-w-3xl py-12">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>
        <div className="prose prose-slate max-w-none space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using QuizAI (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you disagree with any part, you may not use the Service.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
            <p>QuizAI is a SaaS platform that allows users to upload PDF documents and generate AI-powered quizzes. The Service is provided &quot;as is&quot; and we reserve the right to modify or discontinue it at any time.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-3">4. Acceptable Use</h2>
            <p>You may not upload content that is illegal, harmful, or violates third-party rights. You may not use the Service to generate quizzes from copyrighted materials you do not have rights to use.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-3">5. Payments and Subscriptions</h2>
            <p>Premium subscriptions are billed monthly or annually. Subscriptions auto-renew unless cancelled. Refunds are evaluated case by case. You may cancel at any time from your account settings.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-3">6. Intellectual Property</h2>
            <p>Content you upload remains your property. By uploading, you grant us a limited license to process it for quiz generation. AI-generated quizzes belong to you. Our platform code and branding are our intellectual property.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-3">7. Limitation of Liability</h2>
            <p>QuizAI is not liable for any indirect, incidental, or consequential damages arising from use of the Service. Our total liability shall not exceed the amount you paid in the past 12 months.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-3">8. Contact</h2>
            <p>For questions about these terms, contact us at legal@quizai.com.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
