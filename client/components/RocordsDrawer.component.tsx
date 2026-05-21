"use client";

import { BACKEND_URLS } from "@/lib/constants";
import { IRecording } from "@/types/chat.types";
import { useEffect, useState } from "react";

export default function RecordsDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [records, setRecords] = useState<IRecording[]>([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [selectedRecord, setSelectedRecord] = useState<Recording | null>(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(BACKEND_URLS.RECORDING.GET_RECORDS, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch recordings");
      }

      const data = await response.json();

      console.log("data :", data);
      setRecords(data);
    } catch (error) {
      console.log("records fetching error :", error);
      setError("Failed to load recordings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchRecords();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm
        "
    >
      {/* BACKDROP */}
      <div onClick={onClose} className="absolute inset-0" />

      {/* DRAWER */}
      <div
        className="
                relative
                w-[70vw]
                max-w-5xl
                h-[75vh]
                rounded-[32px]
                border
                border-white/10
                bg-neutral-950
                overflow-hidden
                flex
                flex-col
            "
      >
        {/* HEADER */}
        <div
          className="
                    h-[80px]
                    border-b
                    border-white/10
                    px-8
                    flex
                    items-center
                    justify-between
                    shrink-0
                "
        >
          <div>
            <h2
              className="
                            text-2xl
                            font-bold
                            text-white
                        "
            >
              Meetings Records
            </h2>
            <p
              className="
                            text-sm
                            text-neutral-400
                            mt-1
                        "
            >
              Explore your records
            </p>
          </div>

          <button
            onClick={onClose}
            className="
                            w-11
                            h-11
                            rounded-xl
                            border
                            border-white/10
                            text-white
                            hover:bg-white/5
                            transition-all
                        "
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {/* LOADING */}
          {loading && (
            <div className="h-full flex items-center justify-center text-neutral-400">
              Loading recordings...
            </div>
          )}

          {/* ERROR */}
          {!loading && error && (
            <div className="h-full flex items-center justify-center text-red-400">
              {error}
            </div>
          )}

          {/* EMPTY */}
          {!loading && !error && records.length === 0 && (
            <div className="h-full flex items-center justify-center text-neutral-500">
              No recordings found
            </div>
          )}

          {/* RECORDS */}
          {!loading && !error && records.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {/* RECORDS */}
              {!loading && !error && records.length > 0 && (
                <div className="space-y-4">
                  {records.map((meeting: any) => (
                    <details
                      key={meeting.roomId}
                      className="
          rounded-3xl
          border
          border-white/10
          bg-white/[0.03]
          overflow-hidden
          group
        "
                    >
                      {/* ACCORDION HEADER */}
                      <summary
                        className="
            list-none
            cursor-pointer
            px-6
            py-5
            flex
            items-center
            justify-between
            hover:bg-white/[0.03]
            transition-all
          "
                      >
                        <div>
                          <h3 className="text-white font-semibold text-lg">
                            Meeting #{meeting.roomId}
                          </h3>

                          <p className="text-sm text-neutral-400 mt-1">
                            {meeting.recordings.length} recordings
                          </p>
                        </div>

                        <div
                          className="
              text-neutral-400
              group-open:rotate-180
              transition-transform
              duration-300
            "
                        >
                          ▼
                        </div>
                      </summary>

                      {/* RECORDINGS */}
                      <div className="p-5 border-t border-white/10">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {meeting.recordings.map((record: any) => (
                            <button
                              key={record._id}
                              onClick={() => setSelectedRecord(record)}
                              className="
                  rounded-2xl
                  border
                  border-white/10
                  bg-black/30
                  p-5
                  text-left
                  hover:bg-white/[0.05]
                  transition-all
                "
                            >
                              {/* TYPE */}
                              <div className="flex items-center justify-between">
                                <span
                                  className={`
                      text-xs
                      px-3
                      py-1
                      rounded-full
                      font-medium
                      ${
                        record.type === "screen"
                          ? "bg-blue-500/20 text-blue-300"
                          : "bg-red-500/20 text-red-300"
                      }
                    `}
                                >
                                  {record.type === "screen"
                                    ? "Screen Share"
                                    : "Publisher"}
                                </span>
                              </div>

                              {/* FILE */}
                              <h4 className="mt-4 text-white font-semibold line-clamp-2">
                                {record.filename}
                              </h4>

                              {/* DATE */}
                              <p className="mt-2 text-sm text-neutral-400">
                                {new Date(record.createdAt).toLocaleString()}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {selectedRecord && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div
            className="
        relative
        w-[90vw]
        max-w-4xl
        rounded-[28px]
        border
        border-white/10
        bg-neutral-950
        overflow-hidden
      "
          >
            {/* HEADER */}
            <div className="h-[70px] px-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold">Recording Preview</h3>

                <p className="text-xs text-neutral-400 mt-1">
                  {selectedRecord.filename}
                </p>
              </div>

              <button
                onClick={() => setSelectedRecord(null)}
                className="
            w-10
            h-10
            rounded-xl
            border
            border-white/10
            text-white
          "
              >
                ✕
              </button>
            </div>

            {/* PLAYER */}
            <div className="p-6">
              {/* VIDEO */}
              <video
                controls
                className="
            w-full
            rounded-2xl
            bg-black
          "
              >
                <source
                  src={`http://localhost:5000${selectedRecord.filepath}`}
                />
              </video>

              {/* ACTIONS */}
              <div className="mt-6 flex items-center gap-3">
                <a
                  href={`http://localhost:5000${selectedRecord.filepath}`}
                  download
                  target="_blank"
                  className="
              px-5
              h-11
              rounded-xl
              bg-white
              text-black
              flex
              items-center
              justify-center
              font-medium
            "
                >
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
