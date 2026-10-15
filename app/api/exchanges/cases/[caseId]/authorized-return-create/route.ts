// The single real Shopify staging trial has been completed.
// Keep write operations closed during the zero-cost development phase.
export async function POST() {
  return Response.json(
    { message: "La prueba real ya terminó. No se permiten nuevas creaciones hasta la validación final." },
    { status: 403 },
  );
}
