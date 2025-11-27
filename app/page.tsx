import HeroSection from "@/components/sections/HeroSection";

export default function Home() {
  return (
    <div>
      <HeroSection />
      <section id="demos" className="section">
        <div className="container">
          <h2 className="title is-2 has-text-centered mb-6">
            Interactive Demos
          </h2>
          <p className="subtitle is-5 has-text-centered">
            Coming soon - Advanced technology demonstrations
          </p>
        </div>
      </section>
    </div>
  );
}
