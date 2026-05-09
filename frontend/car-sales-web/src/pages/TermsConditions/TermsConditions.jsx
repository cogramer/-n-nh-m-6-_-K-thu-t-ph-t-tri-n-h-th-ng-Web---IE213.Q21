import React from "react";
import "./TermsConditions.css";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

function TermsConditions() {
  return (
    <>
      <Navbar />

      <main className="terms-page">
        <section className="terms-hero">
          <div>
            <p className="terms-label">LEGAL INFORMATION</p>
            <h1>Terms & Conditions</h1>
            <p>
              Please read these terms carefully before using Saigon Speed. By
              accessing our website, you agree to follow these conditions.
            </p>
          </div>
        </section>

        <section className="terms-content">
          <div className="terms-card">
            <p className="terms-updated">Last updated: 2025</p>

            <article>
              <h2>1. Acceptance of Terms</h2>
              <p>
                By using Saigon Speed, you agree to comply with these Terms &
                Conditions. If you do not agree with any part of these terms,
                you should stop using the website.
              </p>
            </article>

            <article>
              <h2>2. About Saigon Speed</h2>
              <p>
                Saigon Speed is a web platform designed to help users browse car
                listings, view vehicle information, read reviews, and connect
                with sellers. The platform may also support safer
                deposit-related transaction flows.
              </p>
            </article>

            <article>
              <h2>3. User Responsibilities</h2>
              <p>
                Users are responsible for providing accurate information,
                checking vehicle details carefully, and making informed
                decisions before buying or selling a car.
              </p>
              <ul>
                <li>Do not post false, misleading, or illegal content.</li>
                <li>
                  Do not misuse the website or attempt to damage the system.
                </li>
                <li>Do not impersonate another person or organization.</li>
                <li>
                  Do not use the platform for fraud or unauthorized activity.
                </li>
              </ul>
            </article>

            <article>
              <h2>4. Vehicle Listings</h2>
              <p>
                Car information may include model, price, images, description,
                specifications, and seller details. Saigon Speed aims to display
                information clearly, but users should verify all details
                directly before completing any transaction.
              </p>
            </article>

            <article>
              <h2>5. Payments and Deposits</h2>
              <p>
                If a deposit or transaction feature is available, users must
                review all information carefully before confirming. Saigon Speed
                is not responsible for losses caused by incorrect information,
                unsafe private agreements, or failure to verify a seller or
                buyer.
              </p>
            </article>

            <article>
              <h2>6. Prohibited Activities</h2>
              <p>Users must not:</p>
              <ul>
                <li>Upload harmful code or attempt to attack the website.</li>
                <li>Collect user information without permission.</li>
                <li>Post fake listings or scam-related content.</li>
                <li>Use Saigon Speed for illegal vehicle trading.</li>
              </ul>
            </article>

            <article>
              <h2>7. Intellectual Property</h2>
              <p>
                Website design, logo, text, images, source code, and other
                content belong to Saigon Speed or their respective owners. Users
                may not copy, modify, or redistribute content without
                permission.
              </p>
            </article>

            <article>
              <h2>8. Limitation of Liability</h2>
              <p>
                Saigon Speed provides information and platform features for user
                convenience. We do not guarantee that every listing, price, or
                vehicle detail is complete or error-free. Users should perform
                their own verification before making decisions.
              </p>
            </article>

            <article>
              <h2>9. Changes to Terms</h2>
              <p>
                We may update these Terms & Conditions when necessary. Updated
                terms will be posted on this page. Continued use of the website
                means you accept the updated terms.
              </p>
            </article>

            <article>
              <h2>10. Contact</h2>
              <p>
                If you have questions about these Terms & Conditions, please
                contact Saigon Speed support through the Support page.
              </p>
            </article>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default TermsConditions;