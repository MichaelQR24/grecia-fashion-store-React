import Hero from "@/components/home/Hero";
import Store from "@/components/home/Store";
import VisitUs from "@/components/home/VisitUs";
import Benefits from "@/components/home/Benefits";
import Categories from "@/components/home/Categories";
import Testimonials from "@/components/home/Testimonials";

export default function Home() {
  return (
    <main id="public-view" suppressHydrationWarning>
      <Hero />
      <Benefits />
      <Categories />
      <Store />
      <Testimonials />
      <VisitUs />
    </main>
  );
}
