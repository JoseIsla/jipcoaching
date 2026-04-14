import { create } from "zustand";
import { api } from "@/services/api";
import { DEV_MOCK, isLocalMode } from "@/config/devMode";

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
  loading: boolean;
  fetchTestimonials: () => Promise<void>;
  addTestimonial: (t: Omit<Testimonial, "id" | "createdAt">) => void;
  getByClient: (clientId: string) => Testimonial | undefined;
}

export const useTestimonialStore = create<TestimonialStore>((set, get) => ({
  testimonials: [],
  loading: false,

  fetchTestimonials: async () => {
    if (isLocalMode()) return;

    set({ loading: true });
    try {
      const data = await api.get<any[]>("/testimonials", { skipAuth: true, silent: true });
      set({
        testimonials: (data ?? []).map((t) => ({
          id: t.id,
          clientId: t.clientId,
          clientName: t.clientName,
          text: t.text,
          rating: t.rating,
          createdAt: t.createdAt,
        })),
        loading: false,
      });
    } catch (err: any) {
      console.warn("Failed to fetch testimonials:", err?.message);
      set({ loading: false });
    }
  },

  addTestimonial: (t) => {
    if (isLocalMode()) {
      set((state) => {
        const filtered = state.testimonials.filter((x) => x.clientId !== t.clientId);
        return {
          testimonials: [
            ...filtered,
            { ...t, id: `test-${Date.now()}`, createdAt: new Date().toISOString() },
          ],
        };
      });
      return;
    }

    api.post("/testimonials", {
      clientName: t.clientName,
      text: t.text,
      rating: t.rating,
    }).then((created) => {
      set((state) => {
        const filtered = state.testimonials.filter((x) => x.clientId !== t.clientId);
        return {
          testimonials: [
            ...filtered,
            {
              id: created.id,
              clientId: created.clientId,
              clientName: created.clientName,
              text: created.text,
              rating: created.rating,
              createdAt: created.createdAt,
            },
          ],
        };
      });
    }).catch((err) => {
      console.warn("Failed to submit testimonial:", err?.message);
    });
  },

  getByClient: (clientId) => get().testimonials.find((t) => t.clientId === clientId),
}));
