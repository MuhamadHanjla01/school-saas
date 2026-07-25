import Header from './Header';
import Hero from './Hero';
import TrustedBy from './TrustedBy';
import Features from './Features';
import MultiTenant from './MultiTenant';
import Pricing from './Pricing';
import CTA from './CTA';
import Footer from './Footer';

export default function LandingPage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <TrustedBy />
        <Features />
        <MultiTenant />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
