import {
  Navbar,
  Hero,
  ProblemSolution,
  Features,
  CodeExamples,
  Architecture,
  DevToolsShowcase,
  GettingStarted,
  Footer,
  TourWrapper,
} from "@/components/landing";

export default function Home() {
  return (
    <TourWrapper>
      <main className="min-h-screen">
        <Navbar />
        <Hero />
        <ProblemSolution />
        <Features />
        <CodeExamples />
        <Architecture />
        <DevToolsShowcase />
        <GettingStarted />
        <Footer />
      </main>
    </TourWrapper>
  );
}
