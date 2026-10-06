import { randomUUID } from "crypto";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const NOVEX_API_URL =
  process.env.NOVEX_API_URL ??
  "https://novex-production-f614.up.railway.app";

async function uploadToStorage(
  supabaseUrl: string,
  supabaseSecretKey: string,
  entry: File,
  path: string
) {
  const encodedPath = path
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  return fetch(
    `${supabaseUrl}/storage/v1/object/return-photos/${encodedPath}`,
    {
      method: "POST",
      headers: {
        apikey:
          supabaseSecretKey,
        "Content-Type":
          entry.type,
        "x-upsert":
          "false",
      },
      body: entry,
    }
  );
}

export async function POST(
  request: Request
) {
  try {
    const supabaseUrl =
      process.env.SUPABASE_URL;
    const supabaseSecretKey =
      process.env.SUPABASE_SECRET_KEY;

    if (
      !supabaseUrl ||
      !supabaseSecretKey
    ) {
      return Response.json(
        {
          message:
            "Faltan las variables de Supabase en el servidor.",
        },
        { status: 500 }
      );
    }

    const formData =
      await request.formData();

    const casePublicId =
      formData.get(
        "casePublicId"
      );
    const draftToken =
      formData.get(
        "draftToken"
      );
    const files =
      formData.getAll(
        "files"
      );

    if (
      !casePublicId &&
      !draftToken
    ) {
      return Response.json(
        {
          message:
            "Falta la referencia de la devolución.",
        },
        { status: 400 }
      );
    }

    if (
      files.length === 0
    ) {
      return Response.json(
        {
          message:
            "No se ha recibido ninguna imagen.",
        },
        { status: 400 }
      );
    }

    if (
      files.length > 5
    ) {
      return Response.json(
        {
          message:
            "Puedes adjuntar un máximo de 5 fotos.",
        },
        { status: 400 }
      );
    }

    const normalizedFiles =
      files.filter(
        (
          entry
        ): entry is File =>
          entry instanceof File
      );

    for (const entry of normalizedFiles) {
      if (
        !ALLOWED_TYPES.includes(
          entry.type
        )
      ) {
        return Response.json(
          {
            message:
              "Solo se permiten imágenes JPG, PNG o WEBP.",
          },
          { status: 400 }
        );
      }

      if (
        entry.size >
        MAX_FILE_SIZE
      ) {
        return Response.json(
          {
            message:
              "Cada imagen puede ocupar como máximo 5 MB.",
          },
          { status: 400 }
        );
      }
    }

    if (draftToken) {
      const baseUrl =
        NOVEX_API_URL.replace(
          /\/$/,
          ""
        );

      const draftResponse =
        await fetch(
          `${baseUrl}/api/public/returns/drafts/${encodeURIComponent(String(draftToken))}`,
          {
            cache: "no-store",
          }
        );

      if (
        !draftResponse.ok
      ) {
        return Response.json(
          {
            message:
              "El borrador de devolución ya no está disponible.",
          },
          {
            status:
              draftResponse.status,
          }
        );
      }

      const draft =
        await draftResponse.json();

      const remaining =
        Math.max(
          0,
          5 -
            Number(
              draft.photoCount ??
                0
            )
        );

      if (
        normalizedFiles.length >
        remaining
      ) {
        return Response.json(
          {
            message:
              `Solo puedes añadir ${remaining} foto${remaining === 1 ? "" : "s"} más.`,
          },
          { status: 400 }
        );
      }

      const uploadedFiles = [];

      for (const entry of normalizedFiles) {
        const extension =
          entry.name
            .split(".")
            .pop()
            ?.toLowerCase() ??
          "jpg";

        const path =
          `drafts/${String(draftToken)}/${randomUUID()}.${extension}`;

        const uploadResponse =
          await uploadToStorage(
            supabaseUrl,
            supabaseSecretKey,
            entry,
            path
          );

        if (
          !uploadResponse.ok
        ) {
          return Response.json(
            {
              message:
                "No se pudo guardar una de las imágenes.",
            },
            { status: 500 }
          );
        }

        const registerResponse =
          await fetch(
            `${baseUrl}/api/public/returns/drafts/${encodeURIComponent(String(draftToken))}/photos`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body:
                JSON.stringify({
                  fileUrl:
                    path,
                  fileName:
                    entry.name,
                  fileSizeBytes:
                    entry.size,
                  mimeType:
                    entry.type,
                }),
              cache:
                "no-store",
            }
          );

        if (
          !registerResponse.ok
        ) {
          return Response.json(
            {
              message:
                "La foto se ha subido, pero no se pudo asociar al borrador.",
            },
            { status: 500 }
          );
        }

        uploadedFiles.push({
          path,
          name:
            entry.name,
        });
      }

      const refreshed =
        await fetch(
          `${baseUrl}/api/public/returns/drafts/${encodeURIComponent(String(draftToken))}`,
          {
            cache: "no-store",
          }
        );

      const refreshedData =
        refreshed.ok
          ? await refreshed.json()
          : null;

      return Response.json({
        success: true,
        files:
          uploadedFiles,
        photoCount:
          refreshedData?.photoCount ??
          uploadedFiles.length,
      });
    }

    const caseResponse =
      await fetch(
        `${supabaseUrl}/rest/v1/cases?public_id=eq.${encodeURIComponent(String(casePublicId))}&select=id,customer_id`,
        {
          headers: {
            apikey:
              supabaseSecretKey,
          },
        }
      );

    if (
      !caseResponse.ok
    ) {
      return Response.json(
        {
          message:
            "No se pudo consultar el caso.",
        },
        { status: 500 }
      );
    }

    const caseData =
      await caseResponse.json();

    const caseId =
      caseData?.[0]?.id ??
      null;
    const customerId =
      caseData?.[0]
        ?.customer_id ??
      null;

    if (!caseId) {
      return Response.json(
        {
          message:
            "No se encontró la devolución.",
        },
        { status: 404 }
      );
    }

    const uploadedFiles = [];

    for (const entry of normalizedFiles) {
      const extension =
        entry.name
          .split(".")
          .pop()
          ?.toLowerCase() ??
        "jpg";

      const path =
        `cases/${caseId}/${randomUUID()}.${extension}`;

      const uploadResponse =
        await uploadToStorage(
          supabaseUrl,
          supabaseSecretKey,
          entry,
          path
        );

      if (
        !uploadResponse.ok
      ) {
        return Response.json(
          {
            message:
              "No se pudo guardar una de las imágenes.",
          },
          { status: 500 }
        );
      }

      const attachmentResponse =
        await fetch(
          `${supabaseUrl}/rest/v1/attachments`,
          {
            method:
              "POST",
            headers: {
              apikey:
                supabaseSecretKey,
              "Content-Type":
                "application/json",
              Prefer:
                "return=representation",
            },
            body:
              JSON.stringify({
                case_id:
                  Number(
                    caseId
                  ),
                uploaded_by_type:
                  "CUSTOMER",
                uploaded_by_user_id:
                  null,
                uploaded_by_customer_id:
                  customerId,
                file_type:
                  "IMAGE",
                file_url:
                  path,
                file_name:
                  entry.name,
                file_size_bytes:
                  entry.size,
                is_customer_visible:
                  true,
              }),
          }
        );

      if (
        !attachmentResponse.ok
      ) {
        return Response.json(
          {
            message:
              "La foto se ha subido, pero no se pudo registrar en la base de datos.",
          },
          { status: 500 }
        );
      }

      uploadedFiles.push({
        path,
        name:
          entry.name,
      });
    }

    return Response.json({
      success: true,
      files:
        uploadedFiles,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        message:
          "Ha ocurrido un error al subir las imágenes.",
      },
      { status: 500 }
    );
  }
}
