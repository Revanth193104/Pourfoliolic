import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

interface ProjectCardProps {
  title: string;
  description: string;
  tags: string[];
  image: string; // Placeholder color or gradient for now
  link?: string;
  index: number;
}

export default function ProjectCard({ title, description, tags, image, index }: ProjectCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
    >
      <Card className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300">
        <div className="aspect-video w-full overflow-hidden bg-muted relative">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{ backgroundImage: image }} 
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-300" />
        </div>
        
        <CardHeader className="p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-2xl font-display font-bold text-foreground group-hover:text-primary transition-colors">
              {title}
            </h3>
            <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
          </div>
          <p className="text-muted-foreground leading-relaxed">
            {description}
          </p>
        </CardHeader>
        
        <CardFooter className="p-6 pt-0 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="bg-secondary/50 text-secondary-foreground hover:bg-secondary">
              {tag}
            </Badge>
          ))}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
