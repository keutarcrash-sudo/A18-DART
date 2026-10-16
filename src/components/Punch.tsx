"use client";
/** La phrase de l'accueil, avec le surligneur ambre sous « 180 » (dans la langue active). */
import { useT } from "@/lib/i18n";

export function Punch({ children }: { children: string }) {
  const t = useT();
  const [avant, ...apres] = t(children).split("180");
  if (!apres.length) return <>{t(children)}</>;
  return (
    <>
      {avant}
      <u className="bg-[linear-gradient(transparent_58%,var(--color-ambre)_58%,var(--color-ambre)_92%,transparent_92%)] no-underline">180</u>
      {apres.join("180")}
    </>
  );
}
