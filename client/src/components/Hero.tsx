import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import heroBg from "@assets/generated_images/dark_abstract_tech_background.png";

export default function Hero() {
  return (
    <section className="relative h-screen min-h-[800px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBg}
          alt="Abstract Background"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/60 to-background" />
      </div>

      <div className="container relative z-10 px-6 mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h2 className="text-primary font-medium tracking-wide mb-4 uppercase text-sm">
            Revanth Mendu
          </h2>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight text-foreground mb-6">
            Full Stack <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
              Engineer.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
            Building scalable, resilient, and maintainable software with <span className="text-foreground font-semibold">Go</span>, <span className="text-foreground font-semibold">Cloud Native</span> technologies, and distributed systems.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#projects"
              className="px-8 py-3 rounded-full bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors"
            >
              View Projects
            </a>
            <a
              href="#contact"
              className="px-8 py-3 rounded-full border border-border bg-background/50 backdrop-blur-sm text-foreground hover:bg-background/80 transition-colors"
            >
              Contact Me
            </a>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce"
      >
        <ArrowDown className="text-muted-foreground/50 w-6 h-6" />
      </motion.div>
    </section>
  );
}
