import React from "react";
import "./PrivacyPolicy.css";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { Lock, UserCheck, Database, Eye, FileText, Mail } from "lucide-react";

function PrivacyPolicy() {
  const privacyCards = [
    {
      icon: <UserCheck />,
      title: "User Information",
      text: "We may collect basic account, contact, and usage information when users interact with Saigon Speed.",
    },
    {
      icon: <Database />,
      title: "Data Usage",
      text: "Information is used to operate the website, improve services, support users, and maintain platform safety.",
    },
    {
      icon: <Lock />,
      title: "Protection",
      text: "We apply reasonable security practices to protect user data from unauthorized access or misuse.",
    },
  ];

  return (
    <>
      <Navbar />

      <main className="privacy-page">
        <section className="privacy-hero">
          <div>
            <p className="privacy-label">YOUR DATA MATTERS</p>
            <h1>Privacy Policy</h1>
            <p>
              This Privacy Policy explains how Saigon Speed collects, uses, and
              protects information when you use our website.
            </p>
          </div>
        </section>

        <section className="privacy-overview">
          <div className="privacy-grid">
            {privacyCards.map((card, index) => (
              <article className="privacy-card" key={index}>
                <div className="privacy-icon">{card.icon}</div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="privacy-content">
          <div className="privacy-document">
            <p className="privacy-updated">Last updated: 2025</p>

            <article>
              <div className="privacy-title-row">
                <FileText />
                <h2>1. Information We Collect</h2>
              </div>
              <p>
                We may collect information that users provide directly, such as
                name, email, phone number, listing information, support
                messages, and account-related details.
              </p>
              <p>
                We may also collect technical information such as browser type,
                device information, pages visited, and general website activity
                to improve performance and user experience.
              </p>
            </article>

            <article>
              <div className="privacy-title-row">
                <Eye />
                <h2>2. How We Use Information</h2>
              </div>
              <p>Saigon Speed may use collected information to:</p>
              <ul>
                <li>Provide and maintain website features.</li>
                <li>Display car listings and related information.</li>
                <li>Respond to user questions and support requests.</li>
                <li>Improve website design, performance, and security.</li>
                <li>Prevent fraud, spam, or unauthorized activities.</li>
              </ul>
            </article>

            <article>
              <div className="privacy-title-row">
                <Database />
                <h2>3. Data Storage</h2>
              </div>
              <p>
                User data may be stored in our system database or related
                service infrastructure. We keep information only as long as
                needed for the purposes described in this policy, unless a
                longer period is required by law or technical needs.
              </p>
            </article>

            <article>
              <div className="privacy-title-row">
                <Lock />
                <h2>4. Data Protection</h2>
              </div>
              <p>
                We use reasonable security measures to protect user information.
                However, no online system is completely secure, so users should
                also protect their own accounts, passwords, and personal
                information.
              </p>
            </article>

            <article>
              <div className="privacy-title-row">
                <UserCheck />
                <h2>5. User Rights</h2>
              </div>
              <p>
                Users may request to review, update, or delete their personal
                information where applicable. Some data may need to be retained
                for technical, legal, or transaction-related reasons.
              </p>
            </article>

            <article>
              <div className="privacy-title-row">
                <Mail />
                <h2>6. Contact Us</h2>
              </div>
              <p>
                If you have questions about this Privacy Policy or how your
                information is handled, please contact Saigon Speed through the
                Support page.
              </p>
            </article>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default PrivacyPolicy;