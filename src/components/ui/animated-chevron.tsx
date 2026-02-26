import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const AnimatedChevron = ({ open }: { open: boolean }) => (
  <motion.div
    animate={{ rotate: open ? 0 : -90 }}
    transition={{ duration: 0.2, ease: "easeInOut" }}
  >
    <ChevronDown className="h-4 w-4 text-muted-foreground" />
  </motion.div>
);

export default AnimatedChevron;
