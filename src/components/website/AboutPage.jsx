import Header from './Header';
import Footer from './Footer';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';

export default function AboutPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Header />
      <main className="flex-grow bg-background text-on-background font-body-md pt-[80px]">
        {/* 1. Hero Section */}
        <section className="px-container-padding-mob md:px-container-padding-desk py-20 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-card-gap">
          <div className="md:w-1/2 space-y-6">
            <span className="text-primary-container font-label-lg text-label-lg uppercase tracking-wider">Our Mission</span>
            <h1 className="font-display-mobile text-display-mobile md:font-display md:text-display text-on-background">Empowering Educational Excellence Through Technology</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
              We believe that modern education requires tools that are fast, intuitive, and designed to foster learning, not hinder it.
            </p>
            <div className="pt-4">
              <Link to="/demo" className="inline-flex items-center gap-2 bg-primary-container text-on-primary font-label-lg text-label-lg py-3 px-8 rounded-full hover:shadow-md transition-all active:scale-95">
                Get a Demo
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 w-full aspect-video rounded-[24px] overflow-hidden shadow-card relative">
            <img className="object-cover w-full h-full absolute inset-0" alt="A bright, modern classroom environment featuring diverse students collaborating around a sleek digital interactive table." src="https://lh3.googleusercontent.com/aida-public/AB6AXuB90DHWGaReai6nRfmEaigMyJvpfi-mzsVNx-XUwhw2cQ9eEwT-gFNNcoAm_JBe6gfO2elQZxd107-4fTNypPw25Er8jrrVtFoOWbDPLrCZVD6ltQW7t-Or5x6ux_45E7Z0-l-oWqoz45SWDWxU_X4-ESELt5Uqs-wr4F1MnnlXB8UA1RLlDu-_QZHOvzUaDz1duoFaGhbjG6K3sHbNLEUKfDK88DUv6uAdzleU0XBBJ9EHn6UZ5YTd78N4cXloAfXqFQKBK5VnImAr" />
          </div>
        </section>

        {/* 2. Our Story */}
        <section className="bg-surface-container-low py-20">
          <div className="px-container-padding-mob md:px-container-padding-desk max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-card-gap items-center">
            <div className="md:col-span-5 h-[400px] rounded-[24px] overflow-hidden shadow-card relative">
              <img className="object-cover w-full h-full absolute inset-0" alt="A dynamic, abstract digital illustration showing the evolution of a single glowing teal node." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVSf3uUk8lPrK6bOVCSNJ17GAFvvWA7z1qWJeTJk9posZ9R9WlTqzggW-57WsJiardIr9mvD_-JHBMBVz9ECyJgJfiqaEto84vAmLRWuBLrOAcQCs7zV3m0TxvleQpLiDHZUpmPQjzZO-tEnSQxB-JOQ_O4ihkL3cstf385UfB_dPTSohwvL7X1Hxy6Xg8-IR6xsTiBIgt8tvff82I-jINKODBJd4Z6sXxUbO4mjiG62TtC88o6RfmUhv_2KXNDkw5vMcz9sVmpsOE" />
            </div>
            <div className="md:col-span-7 space-y-6 md:pl-8">
              <h2 className="font-headline-lg text-headline-lg text-on-background">Our Story</h2>
              <div className="space-y-4 font-body-lg text-body-lg text-on-surface-variant">
                <p>
                  What began as a simple attendance tracking tool for a single district has rapidly evolved into a comprehensive, multi-tenant platform serving institutions globally. 
                </p>
                <p>
                  We recognized early on that legacy educational software was holding back administrators and frustrating teachers. By focusing on a "Friendly Tech" aesthetic and prioritizing speed, we built ERPZO to be the silent engine behind academic success.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Our Vision & Mission */}
        <section className="px-container-padding-mob md:px-container-padding-desk py-20 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-card-gap">
            {/* Vision Card */}
            <div className="bg-surface-container-lowest rounded-[24px] p-8 shadow-card border border-surface-variant flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary-container">
                <span className="material-symbols-outlined text-[28px] filled">visibility</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-background">Our Vision</h3>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                To create a world where educational administration is invisible, allowing educators to focus 100% of their energy on student success and academic vitality.
              </p>
            </div>
            {/* Mission Card */}
            <div className="bg-surface-container-lowest rounded-[24px] p-8 shadow-card border border-surface-variant flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-tertiary-container/20 flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined text-[28px] filled">rocket_launch</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-background">Our Mission</h3>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                To deliver the fastest, most intuitive, and secure ERP platform tailored specifically for the modern educational ecosystem, from K-12 to Higher Ed.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Scale & Impact */}
        <section className="bg-primary text-on-primary py-20 relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-fixed opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="px-container-padding-mob md:px-container-padding-desk max-w-7xl mx-auto relative z-10 text-center space-y-12">
            <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="font-display-mobile text-display-mobile md:font-display md:text-display">Global Scale, Local Impact</h2>
              <p className="font-body-lg text-body-lg text-primary-fixed">Trusted by educators worldwide to power their daily operations.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Metric 1 */}
              <div className="flex flex-col items-center gap-2 p-6 rounded-[24px] bg-on-primary/10 backdrop-blur-sm">
                <span className="font-display text-[48px] font-bold text-primary-fixed">500+</span>
                <span className="font-label-lg text-label-lg uppercase tracking-wider text-on-primary">Institutions</span>
              </div>
              {/* Metric 2 */}
              <div className="flex flex-col items-center gap-2 p-6 rounded-[24px] bg-on-primary/10 backdrop-blur-sm">
                <span className="font-display text-[48px] font-bold text-primary-fixed">1M+</span>
                <span className="font-label-lg text-label-lg uppercase tracking-wider text-on-primary">Students</span>
              </div>
              {/* Metric 3 */}
              <div className="flex flex-col items-center gap-2 p-6 rounded-[24px] bg-on-primary/10 backdrop-blur-sm">
                <span className="font-display text-[48px] font-bold text-primary-fixed">50k+</span>
                <span className="font-label-lg text-label-lg uppercase tracking-wider text-on-primary">Teachers</span>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Our Values */}
        <section className="px-container-padding-mob md:px-container-padding-desk py-20 max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="font-headline-lg text-headline-lg text-on-background">Our Values</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">The principles that guide our product development and company culture.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-card-gap">
            {/* Value 1 */}
            <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-card flex flex-col items-center text-center gap-4 hover:-translate-y-1 transition-transform duration-300">
              <div className="w-16 h-16 rounded-2xl bg-secondary-container/20 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[32px]">lightbulb</span>
              </div>
              <h4 className="font-headline-md text-headline-md text-on-background">Innovation</h4>
              <p className="font-body-md text-body-md text-on-surface-variant">Continuously evolving to meet the changing needs of modern education.</p>
            </div>
            {/* Value 2 */}
            <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-card flex flex-col items-center text-center gap-4 hover:-translate-y-1 transition-transform duration-300">
              <div className="w-16 h-16 rounded-2xl bg-primary-container/20 flex items-center justify-center text-primary-container">
                <span className="material-symbols-outlined text-[32px]">verified_user</span>
              </div>
              <h4 className="font-headline-md text-headline-md text-on-background">Integrity</h4>
              <p className="font-body-md text-body-md text-on-surface-variant">Protecting student data with enterprise-grade security and transparency.</p>
            </div>
            {/* Value 3 */}
            <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-card flex flex-col items-center text-center gap-4 hover:-translate-y-1 transition-transform duration-300">
              <div className="w-16 h-16 rounded-2xl bg-tertiary-container/20 flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined text-[32px]">group_add</span>
              </div>
              <h4 className="font-headline-md text-headline-md text-on-background">Inclusion</h4>
              <p className="font-body-md text-body-md text-on-surface-variant">Designing accessible tools that work for all administrators and educators.</p>
            </div>
            {/* Value 4 */}
            <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-card flex flex-col items-center text-center gap-4 hover:-translate-y-1 transition-transform duration-300">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[32px]">trending_up</span>
              </div>
              <h4 className="font-headline-md text-headline-md text-on-background">Impact</h4>
              <p className="font-body-md text-body-md text-on-surface-variant">Measuring success by the time saved and educational outcomes improved.</p>
            </div>
          </div>
        </section>

        {/* 6. Global Presence */}
        <section className="bg-surface-container-low py-20">
          <div className="px-container-padding-mob md:px-container-padding-desk max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-card-gap">
            <div className="md:w-1/2 space-y-6">
              <h2 className="font-headline-lg text-headline-lg text-on-background">Global Presence</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                Headquartered in San Francisco, with regional support centers in London, Singapore, and Toronto, our team is always online to ensure your institution's operations run smoothly.
              </p>
              <ul className="space-y-3 font-body-md text-body-md text-on-surface-variant">
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary-container text-[20px]">location_on</span>
                  Global Headquarters: San Francisco, CA
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary-container text-[20px]">support_agent</span>
                  24/7 Regional Support
                </li>
              </ul>
            </div>
            <div className="md:w-1/2 w-full h-[300px] rounded-[24px] overflow-hidden shadow-card relative bg-surface-container-highest">
              <img className="object-cover w-full h-full absolute inset-0" alt="A stylized, minimalist world map..." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRxfKRlpguyV7driJiEshXcMFaIgdjRwl8A37GVUMl_99nzoinKAWmGKk051a_Ts-0q8TvdT7NFjz1wd_ou1E2eN4Y45zL2A9sTctDWTcS7Y6o0DHQgh4djyZy_c7laUulN2oDPaHoMEHVU4qRPUAyMSve7Mky5fgMi2A5cC0uSwkktZ5TRgwT9CWcBWy7Ks6mHcZHL_ce8NAMssptL5iMoLH8lZOWvCJMP97pA7oT_0uzUC_eKkvFaLNEzRJXQU_488tEs3MTZEK5" />
            </div>
          </div>
        </section>

        {/* 7. CTA */}
        <section className="px-container-padding-mob md:px-container-padding-desk py-24 max-w-4xl mx-auto text-center space-y-8" id="demo">
          <h2 className="font-display-mobile text-display-mobile md:font-display md:text-display text-on-background">Join the Future of School Management</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            Ready to experience how ERPZO can transform your institution's daily operations? Schedule a personalized walkthrough with our team.
          </p>
          <Link to="/demo" className="inline-block bg-primary-container text-on-primary font-label-lg text-label-lg py-4 px-10 rounded-full hover:shadow-lg transition-all active:scale-95 text-lg">
            Get a Demo
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
