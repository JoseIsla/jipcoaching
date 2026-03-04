import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Testimonial {
  id: string;
  clientId: string;
  clientName: string;
  text: string;
  rating: number;
  createdAt: string;
}

interface TestimonialStore {
  testimonials: Testimonial[];
  addTestimonial: (t: Omit<Testimonial, "id" | "createdAt">) => void;
  getByClient: (clientId: string) => Testimonial | undefined;
}

export const useTestimonialStore = create<TestimonialStore>()(
  persist(
    (set, get) => ({
      testimonials: [],

      addTestimonial: (t) =>
        set((state) => {
          // One per client — replace if exists
          const filtered = state.testimonials.filter((x) => x.clientId !== t.clientId);
          return {
            testimonials: [
              ...filtered,
              { ...t, id: `test-${Date.now()}`, createdAt: new Date().toISOString() },
            ],
          };
        }),

      getByClient: (clientId) => get().testimonials.find((t) => t.clientId === clientId),
    }),
    { name: "jip-testimonials" }
  )
);
