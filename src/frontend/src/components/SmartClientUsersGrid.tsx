import { useRef, useEffect, useMemo, useState } from "react";
import { useGetAllUserProfiles } from "../hooks/useQueries";
import { useSmartClientReady, useSmartClientWidget } from "../hooks/useSmartClient";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutGrid } from "lucide-react";

export default function SmartClientUsersGrid() {
  const scReady = useSmartClientReady();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [availableWidth, setAvailableWidth] = useState(0);
  const { data: allProfiles, isLoading } = useGetAllUserProfiles();

  // Track available width from the scroll wrapper (stable — not affected by grid drag)
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    setAvailableWidth(el.clientWidth);
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width);
        setAvailableWidth((prev) => (prev !== w ? w : prev));
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const rows = useMemo(() => {
    if (!allProfiles) return [];
    return allProfiles.map(([principal, profile]) => ({
      name: profile.name ?? "",
      principal: principal.toString(),
      email: profile.email ?? "",
      bio: profile.bio ?? "",
    }));
  }, [allProfiles]);

  const widthReady = availableWidth > 0;

  const gridRef = useSmartClientWidget<isc.ListGrid>(
    containerRef,
    scReady && widthReady
      ? (el) =>
          isc.ListGrid.create({
            htmlElement: el,
            position: "relative",
            width: availableWidth,
            height: 400,
            canDragResize: true,
            canDragReposition: false,
            resizeFrom: ["B", "R", "BR"],
            overflow: "hidden",
            alternateRecordStyles: true,
            showFilterEditor: true,
            canSort: true,
            canResizeFields: true,
            canReorderFields: true,
            wrapCells: false,
            fixedRecordHeights: true,
            leaveScrollbarGap: true,
            fields: [
              { name: "name", title: "Name", width: 160 },
              { name: "email", title: "Email", width: 200 },
              { name: "bio", title: "Bio", width: "*" },
              { name: "principal", title: "Principal ID", width: 220 },
            ],
            data: rows,
          })
      : null,
    [scReady, widthReady]
  );

  // Update grid data when rows change (without recreating the widget)
  useEffect(() => {
    if (gridRef.current && rows.length > 0) {
      gridRef.current.setData(rows);
    }
  }, [rows, gridRef]);

  // When layout gives more space, grow the grid to fill it (but never shrink a user-expanded grid)
  useEffect(() => {
    if (!gridRef.current || availableWidth <= 0) return;
    if (availableWidth > gridRef.current.getWidth()) {
      gridRef.current.setWidth(availableWidth);
    }
  }, [availableWidth, gridRef]);

  if (!scReady) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12 px-6">
          <p className="text-sm text-muted-foreground">Loading SmartClient...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <LayoutGrid className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Users Grid (SmartClient)</CardTitle>
            <CardDescription>
              {isLoading
                ? "Loading users..."
                : `Interactive grid with sorting and filtering (${rows.length} users)`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <div ref={wrapperRef} className="px-6 pb-6 overflow-auto">
        <div
          ref={containerRef}
          className="w-fit min-w-full rounded-[var(--radius)] border border-border"
          style={{ minHeight: 200 }}
        />
      </div>
    </Card>
  );
}
