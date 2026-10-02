import { connection } from "next/server";
import { USE_CASES } from "@/lib/util";
import { Card, Empty, Note, PageHeader } from "@/components/ui";
import { LiveGrid } from "@/components/client";

export default async function Live() {
  await connection(); // AI_ENGINE_URL is read at request time, not at build time

  return (
    <>
      <PageHeader
        tag="Taman Safari Bogor · Pemantauan Langsung"
        title="Live Kamera AI"
        subtitle="Tampilan kamera dengan zona, deteksi, dan hitungan dari mesin AI. Klik kamera untuk video langsung."
      />
      {process.env.AI_ENGINE_URL ? (
        <>
          <LiveGrid labels={USE_CASES} />
          <Note>
            Gambar diperbarui setiap 2 detik. Video langsung (± 5 FPS) hanya berjalan selama jendela kamera dibuka.
          </Note>
        </>
      ) : (
        <Card>
          <Empty>Mesin AI belum terhubung. Atur AI_ENGINE_URL di .env.local dashboard.</Empty>
        </Card>
      )}
    </>
  );
}
