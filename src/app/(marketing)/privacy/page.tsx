import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container max-w-3xl py-12">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>
        <div className="prose prose-slate max-w-none space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Data We Collect</h2>
            <p>We collect: (a) Account information (name, email, password hash) provided at registration; (b) PDF documents you upload; (c) Quizzes and quiz attempts you create; (d) Payment information processed by Stripe (we do not store card numbers); (e) Usage data for improving the Service.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-3">2. How We Use Your Data</h2>
            <p>We use your data to: provide and improve the Service, process payments, send transactional emails, prevent fraud, and comply with legal obligations. We do not sell your personal data to third parties.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-3">3. PDF Storage</h2>
            <p>PDF files are stored in private Supabase Storage buckets. Access is restricted to you and our system. Files are stored in your user-specific folder and are not publicly accessible. You can delete your PDFs at any time.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-3">4. AI Processing</h2>
            <p>Text extracted from your PDFs is sent to Google Gemini API for quiz generation. Please review Google&apos;s data processing policies. We do not use your PDF content to train AI models.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-3">5. Data Retention</h2>
            <p>We retain your data as long as your account is active. You may request deletion of your account and all associated data by contacting us. Some data may be retained for legal or fraud prevention purposes.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data. You may export your quiz data at any time. Contact us at privacy@quizai.com for data requests.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-3">7. Cookies</h2>
            <p>We use session cookies for authentication (NextAuth.js). No tracking or advertising cookies are used.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-3">8. Contact</h2>
            <p>For privacy inquiries, contact privacy@quizai.com.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
