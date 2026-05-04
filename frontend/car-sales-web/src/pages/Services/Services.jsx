import React from "react";
import "./Services.css";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import {
  ShieldCheck,
  Car,
  CreditCard,
  FileCheck,
  Wrench,
  Headphones,
} from "lucide-react";

function Services() {
  const services = [
    {
      icon: <Car />,
      title: "Car Listing & Review",
      description:
        "Browse detailed car information, compare models, view reviews, and find vehicles that match your needs.",
    },
    {
      icon: <ShieldCheck />,
      title: "Verified Car Information",
      description:
        "We help present car details clearly, including specifications, price, condition, and seller information.",
    },
    {
      icon: <CreditCard />,
      title: "Secure Deposit Support",
      description:
        "Saigon Speed supports a safer deposit process for buyers and sellers through transparent transaction flow.",
    },
    {
      icon: <FileCheck />,
      title: "Document Guidance",
      description:
        "Get basic guidance about required documents, ownership transfer, and vehicle purchase procedures.",
    },
    {
      icon: <Wrench />,
      title: "Inspection Suggestion",
      description:
        "We recommend checking vehicle condition, mileage, service history, and legal ownership before purchase.",
    },
    {
      icon: <Headphones />,
      title: "Customer Support",
      description:
        "Our support team helps users understand how to use the website, search cars, and contact sellers.",
    },
  ];

  return (
    <>
      <Navbar />

      <main className="services-page">
        <section className="services-hero">
          <div className="services-hero-content">
            <p className="services-label">SAIGON SPEED SERVICES</p>
            <h1>Smart services for buying and selling cars</h1>
            <p>
              Saigon Speed provides useful tools and support to help users
              explore cars, compare information, contact sellers, and make
              better purchase decisions.
            </p>
          </div>
        </section>

        <section className="services-section">
          <div className="services-header">
            <p className="services-label">WHAT WE OFFER</p>
            <h2>Our Services</h2>
            <p>
              We focus on making the car buying journey easier, clearer, and
              more trustworthy for every user.
            </p>
          </div>

          <div className="services-grid">
            {services.map((service, index) => (
              <article className="service-card" key={index}>
                <div className="service-icon">{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="services-process">
          <div className="services-header">
            <p className="services-label">HOW IT WORKS</p>
            <h2>Simple buying flow</h2>
          </div>

          <div className="process-list">
            <div className="process-item">
              <span>01</span>
              <div>
                <h3>Search your car</h3>
                <p>Use the car listing page to explore available vehicles.</p>
              </div>
            </div>

            <div className="process-item">
              <span>02</span>
              <div>
                <h3>Review details</h3>
                <p>
                  Check car specifications, images, pricing, and seller notes.
                </p>
              </div>
            </div>

            <div className="process-item">
              <span>03</span>
              <div>
                <h3>Contact seller</h3>
                <p>
                  Connect with the seller for more information or negotiation.
                </p>
              </div>
            </div>

            <div className="process-item">
              <span>04</span>
              <div>
                <h3>Complete purchase carefully</h3>
                <p>
                  Verify documents, inspect the car, and follow a safe payment
                  process.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default Services;