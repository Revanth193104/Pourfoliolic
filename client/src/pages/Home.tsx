import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProjectCard from "@/components/ProjectCard";
import { motion } from "framer-motion";
import { Github, Twitter, Linkedin, Mail, FileText, Server, Cloud, Code, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const projects = [
    {
      title: "MediRemind",
      description: "A family health and medication tracker built with Go and AWS serverless architecture. Features automated SMS reminders via Twilio and a React dashboard for caregivers.",
      tags: ["Go", "AWS Lambda", "React", "Twilio", "Docker"],
      image: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)", // Blue
    },
    {
      title: "Edge Compute IoT Monitor",
      description: "Distributed microservices system for processing telemetry data on edge devices. Leverages AWS Greengrass v2 and Kubernetes for scalable deployment.",
      tags: ["Go", "Kubernetes", "Kafka", "RabbitMQ", "AWS IoT"],
      image: "linear-gradient(135deg, #10b981 0%, #059669 100%)", // Emerald
    },
    {
      title: "API Performance Optimizer",
      description: "High-performance API optimization suite using Redis caching to reduce database bottlenecks. Rewrote handlers in Go to improve response times and stability.",
      tags: ["Go", "PostgreSQL", "Redis", "Performance Tuning"],
      image: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", // Amber
    },
    {
      title: "Jarvis Voice Assistant",
      description: "Python-based voice assistant with speech recognition and text-to-speech capabilities. Enables natural language commands for web search and system control.",
      tags: ["Python", "NLP", "Automation", "OOP"],
      image: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)", // Violet
    }
  ];

  const skills = [
    { category: "Languages", items: ["Go (Golang)", "Python", "JavaScript/TypeScript", "SQL"] },
    { category: "Backend & Cloud", items: ["AWS", "GCP", "Kubernetes", "Docker", "Kafka", "RabbitMQ"] },
    { category: "Frameworks", items: ["Gin", "Fiber", "React", "gRPC", "Flask"] },
    { category: "Databases", items: ["PostgreSQL", "MySQL", "Cassandra", "DynamoDB", "Redis"] },
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
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">Featured Projects</h2>
            <p className="text-muted-foreground text-lg">
              Architecting scalable systems and building resilient applications using modern cloud-native technologies.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {projects.map((project, index) => (
              <ProjectCard key={index} index={index} {...project} />
            ))}
          </div>
        </section>

        {/* Experience & Skills Section */}
        <section id="about" className="py-24 bg-secondary/20 border-y border-border/50">
          <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row gap-16">
              
              {/* About Text */}
              <div className="flex-1 space-y-8">
                <div>
                  <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">About Me</h2>
                  <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
                    <p>
                      I'm Revanth Mendu, a Full Stack Engineer with deep expertise in Golang, microservices, and cloud platforms. 
                      I specialize in building high-throughput messaging systems and secure, distributed applications.
                    </p>
                    <p>
                      With a strong background in both backend architecture (Kubernetes, Kafka, AWS) and frontend interfaces (React), 
                      I bridge the gap between complex infrastructure and user-centric product development.
                    </p>
                    <p>
                       Currently pursuing my Master's in Information Technology and Management (Expected May 2025).
                    </p>
                  </div>
                </div>

                <div>
                   <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" /> Experience
                   </h3>
                   <div className="pl-4 border-l-2 border-primary/20 space-y-8">
                      <div className="relative">
                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-primary" />
                        <h4 className="text-lg font-bold text-foreground">Full Stack Engineer</h4>
                        <p className="text-primary text-sm mb-1">Sree Enterprises (India) • Aug 2021 – Jun 2023</p>
                        <p className="text-muted-foreground">
                          Designed backend services using Go and Python. Managed deployments on AWS/GCP using Kubernetes. 
                          Integrated Kafka/RabbitMQ for event-driven workflows and optimized database performance for MySQL and Cassandra.
                        </p>
                      </div>
                   </div>
                </div>
              </div>

              {/* Skills Grid */}
              <div className="flex-1">
                <h3 className="text-2xl font-display font-bold mb-8">Technical Arsenal</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {skills.map((skillGroup, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      viewport={{ once: true }}
                      className="bg-card/50 backdrop-blur-sm border border-border/50 p-5 rounded-xl hover:border-primary/30 transition-colors"
                    >
                      <h4 className="font-bold text-foreground mb-3 flex items-center gap-2">
                        {skillGroup.category === "Languages" && <Code className="w-4 h-4 text-primary" />}
                        {skillGroup.category === "Backend & Cloud" && <Cloud className="w-4 h-4 text-primary" />}
                        {skillGroup.category === "Frameworks" && <Server className="w-4 h-4 text-primary" />}
                        {skillGroup.category === "Databases" && <Database className="w-4 h-4 text-primary" />}
                        {skillGroup.category}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {skillGroup.items.map((skill) => (
                          <Badge key={skill} variant="outline" className="bg-background/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </motion.div>
                  ))}
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
            <h2 className="text-4xl md:text-5xl font-display font-bold">Let's Connect</h2>
            <p className="text-xl text-muted-foreground">
              I'm always interested in discussing distributed systems, cloud architecture, and new opportunities.
            </p>
            
            <a 
              href="mailto:revanthmendu193104@gmail.com"
              className="inline-block text-2xl md:text-3xl font-display font-bold text-primary hover:text-primary/80 transition-colors border-b-2 border-primary/20 hover:border-primary pb-1"
            >
              revanthmendu193104@gmail.com
            </a>
            
            <p className="text-muted-foreground">
              551-359-6796
            </p>

            <div className="flex justify-center gap-6 mt-12">
              <a href="#" className="p-3 rounded-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                <Github className="w-6 h-6" />
              </a>
              <a href="#" className="p-3 rounded-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                <Linkedin className="w-6 h-6" />
              </a>
              <a href="mailto:revanthmendu193104@gmail.com" className="p-3 rounded-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                <Mail className="w-6 h-6" />
              </a>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border">
        <p>© {new Date().getFullYear()} Revanth Mendu. All rights reserved.</p>
      </footer>
    </div>
  );
}
