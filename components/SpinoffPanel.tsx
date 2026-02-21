import React from "react";

export default function SpinoffPanel({ spinoffs }: { spinoffs: any[] }) {
  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {}
  }

  return (
    <div className="space-y-4">
      {spinoffs.map((s, idx) => {
        // Support BOTH formats (camelCase from your API, snake_case if old data exists)
        const id = s.id ?? `${idx}`;
        const hook = s.hook ?? s.hook_line ?? "";
        const beats: string[] = Array.isArray(s.beats)
          ? s.beats
          : Array.isArray(s.beat_outline)
          ? s.beat_outline
          : [];

        const effort = s.effortLevel ?? s.effort_estimate ?? "";
        const caption = s.caption ?? "";
        const hashtags: string[] = Array.isArray(s.hashtags) ? s.hashtags : [];
        const why = s.whyItFitsUser ?? s.why_fits ?? "";

        return (
          <div key={id} className="p-4 bg-gray-50 rounded border">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">{hook}</div>
                <div className="text-sm text-gray-700 mt-2">
                  {beats.length ? beats.join(" • ") : "No beats available"}
                </div>
              </div>
              <div className="text-sm text-gray-500">{effort}</div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="text-xs text-gray-600">{caption}</div>
              <button
                onClick={() => copyText(hook)}
                className="ml-auto px-2 py-1 bg-blue-600 text-white rounded text-sm"
              >
                Copy Hook
              </button>
              <button
                onClick={() => copyText(beats.join("\n"))}
                className="px-2 py-1 bg-gray-200 rounded text-sm"
                disabled={!beats.length}
              >
                Copy Beats
              </button>
            </div>

            <div className="mt-2 text-xs text-gray-600">
              Hashtags:{" "}
              {hashtags.length
                ? hashtags
                    .map((h: string) => (h.startsWith("#") ? h : `#${h}`))
                    .join(" ")
                : "None"}
            </div>

            <div className="mt-1 text-xs text-gray-500 italic">{why}</div>
          </div>
        );
      })}
    </div>
  );
}