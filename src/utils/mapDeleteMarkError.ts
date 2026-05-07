import { ApiError } from "@/services/api";

export interface DeleteMarkErrorResult {
  title: string;
  description: string;
  /** Close the confirmation dialog after this error */
  closeDialog: boolean;
  /** Re-fetch marks from server */
  refetch: boolean;
}

/**
 * Maps backend errors from the physical-marks DELETE endpoint
 * into consistent, user-facing toast messages.
 */
export function mapDeleteMarkError(err: unknown): DeleteMarkErrorResult {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 401:
        return {
          title: "Sesión expirada",
          description: "Inicia sesión de nuevo para continuar",
          closeDialog: true,
          refetch: false,
        };
      case 403:
        return {
          title: "Acceso denegado",
          description: "No tienes permisos para eliminar esta marca",
          closeDialog: false,
          refetch: false,
        };
      case 404:
        return {
          title: "Marca no encontrada",
          description: "Es posible que ya haya sido eliminada",
          closeDialog: true,
          refetch: true,
        };
      default:
        return {
          title: "Error del servidor",
          description: err.message || "No se pudo eliminar la marca",
          closeDialog: false,
          refetch: false,
        };
    }
  }

  return {
    title: "Error de conexión",
    description: "Comprueba tu conexión a internet e inténtalo de nuevo",
    closeDialog: false,
    refetch: false,
  };
}