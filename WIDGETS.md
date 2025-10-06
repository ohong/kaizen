# Widget System

The dashboard now features a customizable widget system similar to Datadog and Grafana, allowing users to add, remove, resize, and reorder dashboard widgets.

## Features

- **Add/Remove Widgets**: Users can add widgets from a catalog and remove ones they don't need
- **Resize**: Widgets support 4 sizes: Small, Medium, Large, and Full-width
- **Reorder**: Move widgets up/down to customize the dashboard layout
- **Persistent**: Widget configurations are saved to localStorage per section
- **Collapsible**: Each widget can be expanded/collapsed to save space

## Widget Sections

The dashboard has three widgetized sections:

1. **Operational Errors** (`/src/components/widgets/WidgetizedErrorsSection.tsx`)
   - Errors over time
   - Services impacted
   - Environment spread
   - Recent errors
   - Top error messages

2. **Workflow Signals** (`/src/components/widgets/WidgetizedWorkflowSection.tsx`)
   - PR size vs merge time
   - Review responsiveness
   - PR size distribution

3. **Benchmarks** (`/src/components/widgets/WidgetizedBenchmarksSection.tsx`)
   - Cycle time vs industry
   - Quality signals vs industry
   - Benchmark insights

## How to Use

### For Users

1. Click the **"Customize"** button in any widget section
2. **Add widgets**: Click "Add Widget" to open the catalog and select from available widgets
3. **Remove widgets**: Click the × button on any widget to remove it
4. **Resize widgets**: Use the size dropdown (S/M/L/Full) on each widget
5. **Reorder widgets**: Use the ↑↓ arrows to move widgets up or down
6. **Reset**: Click "Reset" to restore default layout
7. Click **"Done"** when finished customizing

### For Developers

#### Adding a New Widget Type

1. **Define the widget type** in `/src/lib/types/widgets.ts`:
```typescript
export type WidgetType =
  | "existing-widget"
  | "your-new-widget"; // Add your type here

export const WIDGET_DEFINITIONS: Record<WidgetType, WidgetDefinition> = {
  // ...existing definitions
  "your-new-widget": {
    type: "your-new-widget",
    title: "Your New Widget",
    description: "Description of what this widget shows",
    defaultSize: "medium",
    category: "errors" | "workflow" | "benchmarks",
  },
};
```

2. **Create the widget component** in `/src/components/widgets/registry.tsx`:
```typescript
export interface YourNewWidgetProps {
  data: YourDataType[];
}

export function YourNewWidget({ data }: YourNewWidgetProps) {
  return (
    <div className="h-[360px]">
      {/* Your widget content */}
    </div>
  );
}
```

3. **Add it to the appropriate section** (e.g., `WidgetizedErrorsSection.tsx`):
```typescript
<WidgetGrid
  widgets={widgets.filter((w) =>
    // Add your widget type to the filter
    w.type === "your-new-widget" || /* other types */
  )}
  // ...other props
>
  {(widget) => {
    switch (widget.type) {
      // Add your case
      case "your-new-widget":
        return <YourNewWidget data={yourData} />;
      // ...other cases
    }
  }}
</WidgetGrid>
```

## Architecture

### Core Components

- **`WidgetWrapper`**: Wraps each widget with controls (remove, resize, reorder, collapse)
- **`WidgetGrid`**: Responsive grid layout that displays widgets based on their size
- **`WidgetCatalog`**: Modal showing available widgets that can be added
- **`useWidgets` hook**: Manages widget state and persistence

### Widget Sizes

Widget sizes map to CSS grid columns:
- `small`: 1 column (33% on 3-column grid)
- `medium`: 1 column (33% on 3-column grid)
- `large`: 2 columns (66% on 3-column grid)
- `full`: Full width (100%)

### State Persistence

Widget configurations are stored in localStorage with namespace prefixes:
- `kaizen-widget-configs-errors`
- `kaizen-widget-configs-workflow`
- `kaizen-widget-configs-benchmarks`

Each stores an array of `WidgetConfig` objects with:
- `id`: Unique identifier
- `type`: Widget type from `WidgetType`
- `title`: Display title
- `size`: Current size setting
- `order`: Position in the grid
- `enabled`: Whether the widget is visible

## Files

- `/src/lib/types/widgets.ts` - Type definitions and widget registry
- `/src/hooks/useWidgets.ts` - Widget state management hook
- `/src/components/widgets/WidgetWrapper.tsx` - Individual widget wrapper with controls
- `/src/components/widgets/WidgetGrid.tsx` - Grid layout container
- `/src/components/widgets/WidgetCatalog.tsx` - Widget picker modal
- `/src/components/widgets/registry.tsx` - All widget component implementations
- `/src/components/widgets/Widgetized*Section.tsx` - Section implementations
