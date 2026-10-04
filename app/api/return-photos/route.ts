import { randomUUID } from "crypto";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseSecretKey =
      process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseSecretKey) {
      return Response.json(
        {
          message:
            "Faltan las variables de Supabase en el servidor.",
        },
        {
          status: 500,
        }
      );
    }

    const formData = await request.formData();

    const caseId = formData.get("caseId");
    const files = formData.getAll("files");

    if (!caseId) {
      return Response.json(
        {
          message: "Falta el identificador del caso.",
        },
        {
          status: 400,
        }
      );
    }

    if (files.length === 0) {
      return Response.json(
        {
          message: "No se ha recibido ninguna imagen.",
        },
        {
          status: 400,
        }
      );
    }

    // Buscamos el cliente relacionado con el caso
    const caseResponse = await fetch(
      `${supabaseUrl}/rest/v1/cases?id=eq.${caseId}&select=customer_id`,
      {
        headers: {
          apikey: supabaseSecretKey,
        },
      }
    );

    if (!caseResponse.ok) {
      return Response.json(
        {
          message:
            "No se pudo consultar el caso.",
        },
        {
          status: 500,
        }
      );
    }

    const caseData = await caseResponse.json();

    const customerId =
      caseData?.[0]?.customer_id ?? null;

    const uploadedFiles: {
      path: string;
      name: string;
    }[] = [];

    for (const entry of files) {
      if (!(entry instanceof File)) {
        continue;
      }

      if (!ALLOWED_TYPES.includes(entry.type)) {
        return Response.json(
          {
            message:
              "Solo se permiten imágenes JPG, PNG o WEBP.",
          },
          {
            status: 400,
          }
        );
      }

      if (entry.size > MAX_FILE_SIZE) {
        return Response.json(
          {
            message:
              "Cada imagen puede ocupar como máximo 5 MB.",
          },
          {
            status: 400,
          }
        );
      }

      const extension =
        entry.name.split(".").pop()?.toLowerCase() ??
        "jpg";

      const path =
        `cases/${caseId}/${randomUUID()}.${extension}`;

      const encodedPath = path
        .split("/")
        .map(encodeURIComponent)
        .join("/");

      // 1. Subimos la imagen a Supabase Storage
      const uploadResponse = await fetch(
        `${supabaseUrl}/storage/v1/object/return-photos/${encodedPath}`,
        {
          method: "POST",
          headers: {
            apikey: supabaseSecretKey,
            "Content-Type": entry.type,
            "x-upsert": "false",
          },
          body: entry,
        }
      );

      if (!uploadResponse.ok) {
        const error = await uploadResponse.text();

        console.error(
          "Error al subir imagen a Supabase:",
          error
        );

        return Response.json(
          {
            message:
              "No se pudo guardar una de las imágenes.",
          },
          {
            status: 500,
          }
        );
      }

      // 2. Registramos la imagen en la tabla attachments
      const attachmentResponse = await fetch(
        `${supabaseUrl}/rest/v1/attachments`,
        {
          method: "POST",
          headers: {
            apikey: supabaseSecretKey,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            case_id: Number(caseId),
            uploaded_by_type: "CUSTOMER",
            uploaded_by_user_id: null,
            uploaded_by_customer_id: customerId,
            file_type: "IMAGE",
            file_url: path,
            file_name: entry.name,
            file_size_bytes: entry.size,
            is_customer_visible: true,
          }),
        }
      );

      if (!attachmentResponse.ok) {
        const error =
          await attachmentResponse.text();

        console.error(
          "Error al registrar attachment:",
          error
        );

        return Response.json(
          {
            message:
              "La foto se ha subido, pero no se pudo registrar en la base de datos.",
          },
          {
            status: 500,
          }
        );
      }

      uploadedFiles.push({
        path,
        name: entry.name,
      });
    }

    return Response.json({
      success: true,
      files: uploadedFiles,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        message:
          "Ha ocurrido un error al subir las imágenes.",
      },
      {
        status: 500,
      }
    );
  }
}