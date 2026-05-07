import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PhysicalTestTracker from "../PhysicalTestTracker";

// Polyfill missing jsdom methods for Radix
beforeEach(() => {
  Element.prototype.hasPointerCapture = vi.fn();
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
});

// ── Mock data ──
const MOCK_SCALES = [
  { id: "s1", oppositionType: "POLICIA_NACIONAL", testName: "Dominadas", gender: "MALE", minValue: 0, maxValue: 5, unit: "reps", score: 3 },
  { id: "s2", oppositionType: "POLICIA_NACIONAL", testName: "Dominadas", gender: "MALE", minValue: 6, maxValue: 15, unit: "reps", score: 7 },
];

const MARK_CLIENT_A = {
  id: "mark-1",
  clientId: "client-a",
  testName: "Dominadas",
  value: 8,
  unit: "reps",
  recordedAt: "2026-05-01T10:00:00Z",
};

// ── Mocks ──
const mockGet = vi.fn();
const mockPut = vi.fn();
const mockDelete = vi.fn();
const mockPost = vi.fn();

vi.mock("@/services/api", () => ({
  api: {
    get: (...args: any[]) => mockGet(...args),
    put: (...args: any[]) => mockPut(...args),
    delete: (...args: any[]) => mockDelete(...args),
    post: (...args: any[]) => mockPost(...args),
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/utils/exportPhysicalMarksPDF", () => ({
  exportPhysicalMarksPDF: vi.fn(),
}));

// Minimal framer-motion mock to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

const renderTracker = (overrides: Partial<Parameters<typeof PhysicalTestTracker>[0]> = {}) => {
  const defaultProps = {
    clientId: "client-a",
    modality: "Oposiciones - Policía Nacional",
    clientName: "Test User",
    gender: "MALE",
    ...overrides,
  };
  return render(<PhysicalTestTracker {...defaultProps} />);
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGet.mockImplementation((url: string) => {
    if (url.includes("physical-scales")) return Promise.resolve(MOCK_SCALES);
    if (url.includes("physical-marks")) return Promise.resolve([MARK_CLIENT_A]);
    return Promise.resolve([]);
  });
  mockPut.mockResolvedValue({ ...MARK_CLIENT_A, value: 10 });
  mockDelete.mockResolvedValue({ success: true });
  mockPost.mockResolvedValue({ ...MARK_CLIENT_A, id: "mark-new" });
});

describe("PhysicalTestTracker permissions", () => {
  // ── Delete button visibility ──

  it("shows delete button only when isAdmin is true", async () => {
    renderTracker({ isAdmin: true });
    await waitFor(() => expect(screen.getByText("Dominadas")).toBeInTheDocument());
    // Trash icon button should exist
    const buttons = screen.getAllByRole("button");
    const trashBtn = buttons.find(b => b.querySelector("svg.lucide-trash-2"));
    expect(trashBtn).toBeTruthy();
  });

  it("hides delete button for client role (isAdmin not passed)", async () => {
    renderTracker(); // no isAdmin
    await waitFor(() => expect(screen.getByText("Dominadas")).toBeInTheDocument());
    const buttons = screen.getAllByRole("button");
    const trashBtn = buttons.find(b => b.querySelector("svg.lucide-trash-2"));
    expect(trashBtn).toBeFalsy();
  });

  it("hides delete button when isAdmin is explicitly false", async () => {
    renderTracker({ isAdmin: false });
    await waitFor(() => expect(screen.getByText("Dominadas")).toBeInTheDocument());
    const buttons = screen.getAllByRole("button");
    const trashBtn = buttons.find(b => b.querySelector("svg.lucide-trash-2"));
    expect(trashBtn).toBeFalsy();
  });

  // ── Edit button visibility ──

  it("shows edit button for both admin and client when mark exists", async () => {
    // Client
    const { unmount } = renderTracker();
    await waitFor(() => expect(screen.getByText("Dominadas")).toBeInTheDocument());
    let buttons = screen.getAllByRole("button");
    expect(buttons.find(b => b.querySelector("svg.lucide-pencil"))).toBeTruthy();
    unmount();

    // Admin
    renderTracker({ isAdmin: true });
    await waitFor(() => expect(screen.getByText("Dominadas")).toBeInTheDocument());
    buttons = screen.getAllByRole("button");
    expect(buttons.find(b => b.querySelector("svg.lucide-pencil"))).toBeTruthy();
  });

  // ── Delete flow sends correct API call ──

  it("delete flow calls api.delete with correct mark ID after confirmation", async () => {
    const user = userEvent.setup();
    renderTracker({ isAdmin: true });
    await waitFor(() => expect(screen.getByText("Dominadas")).toBeInTheDocument());

    // Click trash button
    const buttons = screen.getAllByRole("button");
    const trashBtn = buttons.find(b => b.querySelector("svg.lucide-trash-2"))!;
    await user.click(trashBtn);

    // Confirmation dialog should appear
    await waitFor(() => expect(screen.getByText("¿Eliminar marca?")).toBeInTheDocument());

    // Click confirm
    const confirmBtn = screen.getByRole("button", { name: /eliminar/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith("/training/physical-marks/mark-1");
    });
  });

  // ── Edit flow sends correct API call ──

  it("edit flow calls api.put with correct mark ID after confirmation", async () => {
    const user = userEvent.setup();
    renderTracker({ isAdmin: true });
    await waitFor(() => expect(screen.getByText("Dominadas")).toBeInTheDocument());

    // Click edit button
    const buttons = screen.getAllByRole("button");
    const editBtn = buttons.find(b => b.querySelector("svg.lucide-pencil"))!;
    await user.click(editBtn);

    // Edit dialog should appear
    await waitFor(() => expect(screen.getByText("Editar marca")).toBeInTheDocument());

    // Change value
    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.type(input, "10");

    // Click update
    await user.click(screen.getByRole("button", { name: /actualizar marca/i }));

    // Confirmation dialog
    await waitFor(() => expect(screen.getByText("¿Confirmar edición?")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /confirmar/i }));

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith("/training/physical-marks/mark-1", { value: 10 });
    });
  });

  // ── API URLs target correct endpoints ──

  it("fetches marks scoped to the given clientId", async () => {
    renderTracker({ clientId: "client-xyz" });
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining("physical-marks?clientId=client-xyz")
      );
    });
  });

  it("fetches scales scoped to the opposition type and gender", async () => {
    renderTracker({ gender: "FEMALE" });
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining("physical-scales?oppositionType=POLICIA_NACIONAL&gender=FEMALE")
      );
    });
  });
});