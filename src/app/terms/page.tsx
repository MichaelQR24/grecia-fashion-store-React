import Link from 'next/link';

export const metadata = {
    title: 'Terms & Conditions | Grecia Fashion Store',
    description: 'Corporate Compliance Legal Agreement',
};

export default function TermsAndConditions() {
    return (
        <main className="min-h-screen bg-[#050505] pt-32 pb-20 text-gray-300">
            <div className="container mx-auto px-6 max-w-4xl">

                <header className="mb-12 border-b border-gray-900 pb-8 text-center">
                    <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-4">
                        Corporate Compliance Legal Agreement
                    </h1>
                    <p className="text-grecia-accent tracking-widest uppercase text-xs font-bold mb-2">Grecia Fashion Store</p>
                    <p className="text-gray-500 text-sm">Business Address: 359 Kearny Ave, Kearny, NJ 07032, United States</p>
                    <p className="text-gray-500 text-sm">Last Updated: February 26, 2026</p>
                </header>

                <div className="bg-[#111] border border-gray-800 rounded-lg p-8 md:p-12 shadow-2xl space-y-8 text-sm md:text-base leading-relaxed">

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3 tracking-wide border-l-4 border-grecia-accent pl-4">1. LEGAL NATURE OF AGREEMENT</h2>
                        <p>
                            These Terms constitute a legally binding contract between the User and Grecia Fashion Store (the &quot;Company&quot;). By creating an account or using this website, the User confirms legal capacity, acceptance of all terms, and full responsibility for compliance.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-red-400 mb-3 tracking-wide border-l-4 border-red-500 pl-4">2. CORPORATE COMPLIANCE & ZERO TOLERANCE POLICY</h2>
                        <p>
                            The Company maintains a zero‑tolerance policy toward fraud, abusive returns, payment manipulation, chargeback abuse, false claims, or any conduct that may generate financial harm. The Company reserves the right to permanently block accounts, refuse service, pursue civil recovery, and report unlawful conduct.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3 tracking-wide border-l-4 border-grecia-accent pl-4">3. PAYMENT DISCLAIMER & FINANCIAL LIABILITY</h2>
                        <p>
                            All payments are processed through certified third‑party processors. The Company does not store full card details and shall not be liable for banking errors, declined transactions, fraud detection holds, system outages, or third‑party failures. The Company may cancel any suspicious order without prior notice.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-red-400 mb-3 tracking-wide border-l-4 border-red-500 pl-4">4. CHARGEBACK PROTECTION CLAUSE</h2>
                        <p>
                            Users agree to contact the Company before initiating any chargeback. Fraudulent or unjustified chargebacks will result in account termination and potential legal action to recover losses, administrative fees, and legal costs.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3 tracking-wide border-l-4 border-grecia-accent pl-4">5. PRICING ERRORS & TECHNICAL MALFUNCTIONS</h2>
                        <p>
                            The Company reserves the right to cancel orders resulting from typographical errors, system malfunctions, pricing inaccuracies, or inventory mismatches, even after confirmation email issuance.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3 tracking-wide border-l-4 border-grecia-accent pl-4">6. SHIPPING & RISK TRANSFER</h2>
                        <p>
                            Risk of loss transfers to the customer upon delivery to the carrier. The Company is not responsible for courier delays, lost packages marked delivered, incorrect addresses provided by the customer, or force majeure events.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3 tracking-wide border-l-4 border-grecia-accent pl-4">7. RETURNS & ABUSE PREVENTION</h2>
                        <p>
                            The Company reserves the right to deny returns that show signs of wear, alteration, misuse, odor, damage, missing tags, or abuse of return policy. Excessive returns may result in permanent account restriction.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3 tracking-wide border-l-4 border-grecia-accent pl-4">8. SIZE & COLOR DISCLAIMER</h2>
                        <p>
                            Due to lighting, device display variations, and manufacturing tolerances, product colors may slightly differ from images displayed online. Size charts are approximate. The Company shall not be liable for dissatisfaction related to color tone, fit perception, or minor size deviations.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3 tracking-wide border-l-4 border-grecia-accent pl-4">9. LIMITATION OF LIABILITY</h2>
                        <p>
                            To the fullest extent permitted under the laws of the State of New Jersey, the Company shall not be liable for indirect, incidental, punitive, or consequential damages. Total liability shall not exceed the amount paid for the specific product.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3 tracking-wide border-l-4 border-grecia-accent pl-4">10. INDEMNIFICATION</h2>
                        <p>
                            Users agree to indemnify and hold harmless Grecia Fashion Store from any claims, losses, damages, legal expenses, or disputes arising from misuse of the website or violation of these Terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3 tracking-wide border-l-4 border-grecia-accent pl-4">11. ARBITRATION & WAIVER OF CLASS ACTION</h2>
                        <p>
                            All disputes shall be resolved through binding arbitration in the State of New Jersey. Users waive the right to participate in class actions or jury trials.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3 tracking-wide border-l-4 border-grecia-accent pl-4">12. DATA PRIVACY & PROTECTION POLICY</h2>
                        <p>
                            The Company collects personal data including name, address, email, phone number, IP address, and transaction data solely for order processing, fraud prevention, legal compliance, and operational improvement. Data may be shared with payment processors, shipping carriers, or legal authorities when required. The Company does not sell personal data. Reasonable security safeguards are implemented, but no system is 100% secure.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3 tracking-wide border-l-4 border-grecia-accent pl-4">13. DATA RETENTION & SECURITY DISCLAIMER</h2>
                        <p>
                            Data is retained as required for legal compliance, fraud prevention, and dispute resolution. Users acknowledge inherent cybersecurity risks when using online platforms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3 tracking-wide border-l-4 border-grecia-accent pl-4">14. MODIFICATIONS</h2>
                        <p>
                            The Company may modify this Agreement at any time. Continued use of the website constitutes acceptance of changes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3 tracking-wide border-l-4 border-grecia-accent pl-4">15. GOVERNING LAW</h2>
                        <p>
                            This Agreement shall be governed exclusively by the laws of the State of New Jersey and applicable United States federal law.
                        </p>
                    </section>

                </div>

                <div className="mt-12 text-center">
                    <Link href="/" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-grecia-accent hover:text-white transition rounded-full shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                        <i className="fas fa-arrow-left"></i> Return to Store
                    </Link>
                </div>

            </div>
        </main>
    );
}
