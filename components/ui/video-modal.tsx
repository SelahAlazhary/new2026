"use client";

/** نافذة فيديو منبثقة لعرض درس تجريبي مجاني. */
import { AnimatePresence, motion } from "framer-motion";
import { IconClose } from "@/components/brand/icons";
import { useEffect } from "react";
import { CleanYouTube, youtubeId } from "@/components/student/clean-youtube";

export function VideoModal({
  open,
  onClose,
  src,
}: {
  open: boolean;
  onClose: () => void;
  src?: string;
}) {
  /* مقطعُ يوتيوب يُعرض بالمشغّل النظيف — لا عنوانَ ولا شعارَ ولا مقترحات */
  const yt = youtubeId(src);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[120] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="relative aspect-video w-full max-w-3xl overflow-hidden rounded-3xl border border-white/15 shadow-glow-lg"
          >
            <button
              onClick={onClose}
              aria-label="إغلاق"
              className="absolute left-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
            >
              <IconClose className="size-5" />
            </button>
            {yt ? (
              <CleanYouTube videoId={yt} title="درس تجريبي" />
            ) : (
              <iframe
                src={src || "about:blank"}
                title="درس تجريبي"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="size-full"
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
