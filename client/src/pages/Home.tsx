import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProjectCard from "@/components/ProjectCard";
import { motion } from "framer-motion";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";

export default function Home() {
  const projects = [
    {
      title: "FinTrack AI",
      description: "An intelligent financial dashboard that uses machine learning to categorize expenses and predict future spending habits. Built for scalability and real-time data processing.",
      tags: ["React", "TypeScript", "Python", "D3.js"],
      image: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)", // Blue gradient
    },
    {
      title: "Neon Commerce",
      description: "A headless e-commerce storefront designed for high-performance and conversion. Features instant search, smooth transitions, and a mobile-first approach.",
      tags: ["Next.js", "Tailwind CSS", "Stripe", "Redis"],
      image: "linear-gradient(135deg, #581c87 0%, #a855f7 100%)", // Purple gradient
    },
    {
      title: "Orbit Design System",
      description: "A comprehensive design system and component library built for a SaaS product suite. Focuses on accessibility, consistency, and developer experience.",
      tags: ["Storybook", "React", "Figma", "A11y"],
      image: "linear-gradient(135deg, #111827 0%, #374151 100%)", // Dark gradient
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Navbar />
      
      <main>
        <Hero />
        
        {/* Projects Section */}
        <section id="projects" className="py-24 container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-16 max-w-2xl"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">Selected Work</h2>
            <p className="text-muted-foreground text-lg">
              A collection of projects that showcase my passion for building clean, efficient, and user-centric software.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <ProjectCard key={index} index={index} {...project} />
            ))}
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-24 bg-secondary/20 border-y border-border/50">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="flex-1 space-y-6">
                <h2 className="text-3xl md:text-4xl font-display font-bold">About Me</h2>
                <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
                  <p>
                    I'm a full-stack developer with a strong focus on frontend engineering. I believe that the best software is built at the intersection of design and technology.
                  </p>
                  <p>
                    With over 5 years of experience, I've worked with startups and established companies to ship robust applications. My toolkit includes React, TypeScript, Node.js, and a keen eye for detail.
                  </p>
                  <p>
                    When I'm not coding, you can find me exploring digital art, hiking, or contributing to open-source projects.
                  </p>
                </div>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden bg-muted border border-border rotate-3 hover:rotate-0 transition-transform duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
                  {/* Placeholder for profile image if user wants to add one later */}
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 font-display text-4xl font-bold">
                    Profile
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-24 container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto space-y-8"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold">Let's work together.</h2>
            <p className="text-xl text-muted-foreground">
              Have a project in mind or just want to say hi? I'm always open to new opportunities and collaborations.
            </p>
            
            <a 
              href="mailto:hello@example.com"
              className="inline-block text-2xl md:text-3xl font-display font-bold text-primary hover:text-primary/80 transition-colors border-b-2 border-primary/20 hover:border-primary pb-1"
            >
              hello@example.com
            </a>

            <div className="flex justify-center gap-6 mt-12">
              <a href="#" className="p-3 rounded-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                <Github className="w-6 h-6" />
              </a>
              <a href="#" className="p-3 rounded-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                <Twitter className="w-6 h-6" />
              </a>
              <a href="#" className="p-3 rounded-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                <Linkedin className="w-6 h-6" />
              </a>
              <a href="#" className="p-3 rounded-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                <Mail className="w-6 h-6" />
              </a>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border">
        <p>© {new Date().getFullYear()} Portfolio. All rights reserved.</p>
      </footer>
    </div>
  );
}
