/** Minimal ambient type declarations for SmartClient (window.isc). */

declare namespace isc {
  function setAutoDraw(autoDraw: boolean): void;

  interface CanvasProps {
    htmlElement?: HTMLElement;
    position?: "relative" | "absolute";
    width?: string | number;
    height?: string | number;
    autoDraw?: boolean;
    overflow?: "auto" | "hidden" | "visible";
    [key: string]: unknown;
  }

  interface Canvas {
    draw(): void;
    redraw(): void;
    markForDestroy(): void;
    destroy(): void;
    getWidth(): number;
    getHeight(): number;
    setWidth(width: string | number): void;
    setHeight(height: string | number): void;
    show(): void;
    hide(): void;
  }

  interface ListGridField {
    name: string;
    title?: string;
    type?: string;
    width?: string | number;
    canEdit?: boolean;
    canFilter?: boolean;
    canSort?: boolean;
    hidden?: boolean;
    [key: string]: unknown;
  }

  interface ListGridProps extends CanvasProps {
    fields?: ListGridField[];
    data?: Record<string, unknown>[];
    showFilterEditor?: boolean;
    alternateRecordStyles?: boolean;
    canSort?: boolean;
    canResizeFields?: boolean;
    canReorderFields?: boolean;
    wrapCells?: boolean;
    fixedRecordHeights?: boolean;
    leaveScrollbarGap?: boolean;
    [key: string]: unknown;
  }

  interface ListGrid extends Canvas {
    setData(data: Record<string, unknown>[]): void;
    getData(): Record<string, unknown>[];
    getSelectedRecord(): Record<string, unknown> | null;
    selectRecord(record: Record<string, unknown>): void;
    deselectAllRecords(): void;
    invalidateCache(): void;
    refreshData(): void;
  }

  interface DynamicFormField {
    name: string;
    title?: string;
    type?: string;
    required?: boolean;
    defaultValue?: unknown;
    [key: string]: unknown;
  }

  interface DynamicFormProps extends CanvasProps {
    fields?: DynamicFormField[];
    values?: Record<string, unknown>;
    [key: string]: unknown;
  }

  interface DynamicForm extends Canvas {
    setValues(values: Record<string, unknown>): void;
    getValues(): Record<string, unknown>;
    validate(): boolean;
  }

  interface ClassFactory<P, I> {
    create(props: P): I;
  }

  const Canvas: ClassFactory<CanvasProps, Canvas>;
  const ListGrid: ClassFactory<ListGridProps, ListGrid>;
  const DynamicForm: ClassFactory<DynamicFormProps, DynamicForm>;
}

interface Window {
  isc: typeof isc;
  isomorphicDir: string;
}
