import React from "react";
import "./Support.css";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import {
  Mail,
  Phone,
  MessageCircle,
  HelpCircle,
  Search,
  ShieldAlert,
} from "lucide-react";

function Support() {
  const supportOptions = [
    {
      icon: <MessageCircle />,
      title: "Live Chat",
      description:
        "Chat with our support team for quick questions about cars, listings, or website usage.",
      info: "Available during working hours",
    },
    {
      icon: <Phone />,
      title: "Phone Support",
      description:
        "Call us if you need direct help with car information or transaction support.",
      info: "(84) 000000000",
    },
    {
      icon: <Mail />,
      title: "Email Support",
      description:
        "Send us your issue, feedback, or request. We will review and respond as soon as possible.",
      info: "support@saigonspeed.com",
    },
  ];

  const faqs = [
    {
      question: "How can I search for a car?",
      answer:
        "Go to the Cars page, browse available vehicles, and review each car's details before contacting the seller.",
    },
    {
      question: "Does Saigon Speed sell cars directly?",
      answer:
        "Saigon Speed is designed as a car marketplace platform. Vehicle information is listed so buyers can connect with sellers.",
    },
    {
      question: "What should I check before buying a car?",
      answer:
        "You should check vehicle documents, ownership, mileage, accident history, service records, and real condition.",
    },
    {
      question: "What should I do if a listing looks suspicious?",
      answer:
        "Do not send money immediately. Contact support and report the listing so we can review it.",
    },
  ];

  return (
    <>
      <Navbar />

      <main className="support-page">
        <section className="support-hero">
          <div className="support-hero-content">
            <p className="support-label">SUPPORT CENTER</p>
            <h1>How can we help you?</h1>
            <p>
              Find answers, contact our team, and get help with using Saigon
              Speed safely and effectively.
            </p>
          </div>
        </section>

        <section className="support-contact-section">
          <div className="support-header">
            <p className="support-label">CONTACT OPTIONS</p>
            <h2>Get in touch with us</h2>
            <p>
              Choose the support channel that works best for your question or
              problem.
            </p>
          </div>

          <div className="support-card-grid">
            {supportOptions.map((item, index) => (
              <article className="support-card" key={index}>
                <div className="support-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <strong>{item.info}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="support-help-section">
          <div className="support-help-box">
            <div>
              <p className="support-label">BEFORE CONTACTING US</p>
              <h2>Helpful tips</h2>
            </div>

            <div className="tip-list">
              <div className="tip-item">
                <Search />
                <div>
                  <h3>Check car details carefully</h3>
                  <p>
                    Review price, specifications, images, seller information,
                    and description before making a decision.
                  </p>
                </div>
              </div>

              <div className="tip-item">
                <ShieldAlert />
                <div>
                  <h3>Stay safe from scams</h3>
                  <p>
                    Avoid transferring money before verifying the seller,
                    vehicle, and required documents.
                  </p>
                </div>
              </div>

              <div className="tip-item">
                <HelpCircle />
                <div>
                  <h3>Prepare your question</h3>
                  <p>
                    Include car name, listing information, screenshot, or error
                    message so we can support you faster.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="support-faq-section">
          <div className="support-header">
            <p className="support-label">FAQ</p>
            <h2>Frequently Asked Questions</h2>
          </div>

          <div className="faq-list">
            {faqs.map((faq, index) => (
              <article className="faq-item" key={index}>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default Support;