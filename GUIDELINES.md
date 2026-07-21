# StockFlow Design Guidelines

## Overview
This design system defines the visual language, components, and patterns for the StockFlow inventory management application. Built with React, TypeScript, and Tailwind CSS v4.

---

## Color System

### Primary Colors
```css
--primary: #0c7c97        /* Teal - Primary actions, links, icons */
--primary-hover: #0a6a80  /* Darker teal - Hover states */
--primary-light: #1ABAE1  /* Light teal - Accents, highlights */
```

### Neutral Colors
```css
--background: #fafafa     /* Page background */
--surface: #ffffff        /* Card/container background */
--border: #f0f2fb         /* Borders, dividers */
--border-hover: #e0e5f5   /* Hover borders */
--text-primary: #323232   /* Primary text */
--text-secondary: #666666 /* Secondary text, labels */
--text-disabled: #999999  /* Disabled/placeholder text */
```

### Semantic Colors
```css
--success: #22c55e        /* Success states, stock in */
--warning: #f59e0b        /* Warning states */
--error: #ff4444          /* Error states, low stock, stock out */
--info: #3b82f6           /* Info states, returns */
```

### Transaction Type Colors
```css
--stock-out: #ea580c      /* Orange - Deliveries */
--stock-out-bg: #fed7aa   /* Light orange background */
--return: #2563eb         /* Blue - Returns */
--return-bg: #dbeafe      /* Light blue background */
--stock-in: #16a34a       /* Green - Purchases */
--stock-in-bg: #bbf7d0    /* Light green background */
```

---

## Typography

### Font Family
- **Primary**: 'Montserrat', sans-serif
- All text uses Montserrat for consistency

### Font Weights
- **Light**: 300 (Subtle accents, SKU codes)
- **Normal**: 400 (Body text, descriptions)
- **Medium**: 500 (Labels, secondary headings)
- **Semibold**: 600 (Headings, important text)
- **Bold**: 700 (Numbers, quantities, emphasis)
- **Extrabold**: 800 (Large numbers, stock counts)

### Type Scale

#### Headings
```css
/* Page Titles */
Mobile:  text-[24px] font-semibold
Desktop: text-[32px] font-semibold

/* Section Titles */  
Mobile:  text-[16px] font-semibold
Desktop: text-[28px] font-semibold

/* Subsections */
Mobile:  text-[14px] font-semibold
Desktop: text-[20px] font-semibold
```

#### Body Text
```css
/* Primary Body */
Mobile:  text-[16px] font-normal
Desktop: text-[20px] font-normal

/* Secondary Body */
Mobile:  text-[14px] font-normal
Desktop: text-[18px] font-normal

/* Small Text */
Mobile:  text-[12px] font-normal
Desktop: text-[16px] font-normal

/* Tiny Text */
Mobile:  text-[11px] font-normal
Desktop: text-[14px] font-normal
```

#### Labels
```css
/* Form Labels */
Mobile:  text-[13px] font-semibold
Desktop: text-[14px] font-semibold

/* Badge Labels */
text-[11px] lg:text-[12px] font-semibold
```

---

## Spacing System

### Gap Sizes
```css
--gap-xs:  gap-[4px]   lg:gap-[6px]
--gap-sm:  gap-[8px]   lg:gap-[12px]
--gap-md:  gap-[12px]  lg:gap-[20px]
--gap-lg:  gap-[24px]  lg:gap-[32px]
--gap-xl:  gap-[32px]  lg:gap-[40px]
```

### Padding
```css
/* Container Padding */
--container-x: px-[16px] lg:px-[24px]
--container-y: py-[32px] lg:py-[48px]

/* Card Padding */
--card-sm: p-[12px]  lg:p-[16px]
--card-md: p-[16px]  lg:p-[28px]
--card-lg: p-[20px]  lg:p-[32px]
--card-xl: p-[32px]  lg:p-[40px]
```

### Border Radius
```css
--radius-sm: rounded-[6px]   lg:rounded-[8px]
--radius-md: rounded-[8px]   lg:rounded-[12px]
--radius-lg: rounded-[12px]  lg:rounded-[16px]
--radius-xl: rounded-[16px]  lg:rounded-[20px]
--radius-full: rounded-[999999px]  /* Pills, buttons */
```

---

## Component Library

### 1. InputField

Text input component with label and border styling.

**Props:**
- `label: string` - Field label
- `value: string` - Input value
- `onChange: (value: string) => void` - Change handler
- `type?: string` - Input type (default: 'text')
- `readOnly?: boolean` - Read-only state
- `onClick?: () => void` - Click handler (for unauthorized interactions)

**Usage:**
```tsx
<InputField
  label="Nome"
  value={formData.display_name}
  onChange={(value) => handleChange('display_name', value)}
/>
```

**States:**
- Default: White background, border-[#f0f2fb]
- Read-only: Gray text, cursor-not-allowed
- Focus: Standard outline

---

### 2. NumberInputWithButtons

Numeric input with increment/decrement buttons.

**Props:**
- `label: string` - Field label
- `value: number` - Numeric value
- `onIncrement: () => void` - Increment handler
- `onDecrement: () => void` - Decrement handler
- `onChange: (value: number) => void` - Direct input handler
- `readOnly?: boolean` - Disabled state
- `onClick?: () => void` - Click handler for unauthorized access

**Layout:**
```
[−] Button  |  Number Input  |  [+] Button
```

**Button Sizes:**
- Mobile: h-[44px] w-[64px]
- Desktop: h-[48px] w-[72px]

**Button Colors:**
- Increment: bg-[#0c7c97] (Primary teal)
- Decrement: bg-[#f0f2fb] (Light gray)

**Usage:**
```tsx
<NumberInputWithButtons
  label="Em Estoque"
  value={formData.in_stock}
  onIncrement={() => handleIncrement('in_stock')}
  onDecrement={() => handleDecrement('in_stock')}
  onChange={(value) => handleChange('in_stock', value)}
/>
```

---

### 3. SelectField

Dropdown select component.

**Props:**
- `label: string` - Field label
- `value: string` - Selected value
- `onChange: (value: string) => void` - Change handler
- `options: { value: string; label: string }[]` - Options array
- `readOnly?: boolean` - Disabled state
- `onClick?: () => void` - Click handler

**Usage:**
```tsx
<SelectField
  label="Tipo de Item"
  value={formData.item_type}
  onChange={(value) => handleChange('item_type', value)}
  options={[
    { value: 'unit', label: 'Unidade' },
    { value: 'package', label: 'Pacote' }
  ]}
/>
```

---

### 4. Item Card (Inventory List)

Large card component for displaying inventory items.

**Structure:**
```
┌─────────────────────────────────────┐
│ [Image] Name           [Edit Icon] │
│         SKU                         │
│         Nickname                    │
│                                     │
│  [Em Estoque: 25]  [Mínimo: 10]   │
└─────────────────────────────────────┘
```

**Properties:**
- Border: 2px solid #f0f2fb
- Radius: rounded-[12px] lg:rounded-[20px]
- Padding: p-[16px] lg:p-[32px]
- Hover: shadow-lg transition

**Low Stock Indicator:**
- Condition: `in_stock <= desired_stock`
- Border: border-[#ff4444] (red)
- Stock number: text-[#ff4444]

---

### 5. Transaction Card

Card for displaying stock movements with +/- buttons.

**Structure:**
```
┌────────────────────────────────────┐
│ [Image] Product Name               │
│         Type Badge                 │
│         Stock Info                 │
│                     [−] [qty] [+] │
└────────────────────────────────────┘
```

**Control Sizes:**
- Mobile: buttons h-[44px] w-[64px], input h-[40px]
- Desktop: buttons h-[48px] w-[72px], input h-[44px]

---

### 6. Badge Components

**Transaction Type Badges:**
```tsx
// Stock Out (Delivery)
className="bg-orange-100 text-orange-600 text-[11px] px-[8px] py-[2px] rounded-full"

// Return
className="bg-blue-100 text-blue-600 text-[11px] px-[8px] py-[2px] rounded-full"

// Stock In (Purchase)
className="bg-green-100 text-green-600 text-[11px] px-[8px] py-[2px] rounded-full"
```

**Low Stock Badge:**
```tsx
className="bg-[#ff4444] text-white text-[11px] lg:text-[12px] px-[8px] py-[2px] rounded-full"
```

---

### 7. Buttons

**Primary Button:**
```tsx
className="bg-[#0c7c97] hover:bg-[#0a6a80] text-white 
           px-[24px] lg:px-[32px] py-[12px] lg:py-[16px] 
           rounded-[999999px] transition-colors"
```

**Disabled Button:**
```tsx
className="bg-gray-400 cursor-not-allowed opacity-60 text-white
           px-[24px] lg:px-[32px] py-[12px] lg:py-[16px] rounded-[999999px]"
```

**Card Button:**
```tsx
className="bg-white hover:bg-[#f0f2fb] border-2 border-[#f0f2fb] 
           hover:border-[#1ABAE1] hover:shadow-lg 
           rounded-[16px] lg:rounded-[20px] transition-colors"
```

---

### 8. Search Input

**Structure:**
```tsx
<div className="relative">
  <Search icon /> {/* Positioned absolute left */}
  <input 
    className="w-full pl-[40px] lg:pl-[48px] pr-[12px] lg:pr-[16px] 
               py-[10px] lg:py-[12px] rounded-[8px] lg:rounded-[12px]
               border-2 border-[#f0f2fb] focus:border-[#0c7c97]" 
    placeholder="Buscar por nome ou apelido..."
  />
</div>
```

**States:**
- Default: border-[#f0f2fb]
- Focus: border-[#0c7c97]
- Placeholder: text-[#999]

---

### 9. Toggle Switch (Unit/Package)

Toggle between two modes with visual feedback.

**Structure:**
```tsx
<button className={`
  px-[10px] py-[4px] rounded-full border-2 transition-all
  ${active 
    ? 'bg-[#0c7c97] border-[#0c7c97] text-white' 
    : 'bg-white border-[#f0f2fb] text-[#666] hover:border-[#0c7c97]'
  }
`}>
  Unidade
</button>
```

**Usage:**
- Always display both options side-by-side
- Active state uses primary color
- Inactive state uses subtle gray

---

### 10. Page Header Pattern

Consistent header with icon and title.

**Structure:**
```tsx
<div className="flex items-center gap-[8px] lg:gap-[12px]">
  <Icon className="size-[28px] lg:size-[32px] text-[#0c7c97]" />
  <h1 className="font-['Montserrat',sans-serif] font-semibold 
                 text-[24px] lg:text-[32px]">
    Page Title
  </h1>
</div>
<p className="font-['Montserrat',sans-serif] font-normal 
               text-[16px] lg:text-[20px]">
  Page description
</p>
```

**Icons by Page:**
- Estoque: `<Package />`
- Movimentações: `<ArrowLeftRight />`
- Histórico: `<Clock />`

---

## Layout Patterns

### Page Container
```tsx
<div className="bg-[#fafafa] min-h-screen 
                flex flex-col gap-[24px] lg:gap-[32px]
                py-[32px] lg:py-[48px]">
  <Header />
  {/* Page content */}
</div>
```

### Content Section
```tsx
<div className="w-full px-[16px] lg:px-[24px]">
  {/* Section content */}
</div>
```

### Fixed Bottom Bar
```tsx
<div className="fixed bottom-0 left-0 right-0 
                bg-white border-t-2 border-[#f0f2fb]
                px-[16px] lg:px-[48px] py-[12px] lg:py-[20px]
                z-40 shadow-lg">
  {/* Bottom bar content */}
</div>
```

**Note:** When using fixed bottom bar, add `pb-[120px] lg:pb-[140px]` to the scrollable content to prevent overlap.

---

## Interaction Patterns

### Toast Notifications
Using `sonner` library:

```tsx
import { toast } from 'sonner';

// Success
toast.success('Item salvo com sucesso!');

// Error
toast.error('Você não tem permissão para editar este item');

// Warning
toast.error('Quantidade indisponível. Estoque atual: 25');
```

**Position:** top-right  
**Variants:** success (green), error (red)

---

### Role-Based UI States

**Permission Levels:**
1. **Cleaner** - View only (no edit access)
2. **Supervisora** - View only (no edit access)
3. **Admin** - Full edit except restricted fields
4. **Super** - Full access to all features

**Read-Only Indicators:**
- Gray text color
- `cursor-not-allowed`
- Disabled buttons with reduced opacity
- Toast message on unauthorized clicks

**Implementation:**
```tsx
const canEdit = currentProfile?.role === 'Admin' || currentProfile?.role === 'Super';

const handleUnauthorizedClick = () => {
  toast.error('Você não tem permissão para editar este item');
};
```

---

### Loading States

**Spinner:**
```tsx
<div className="animate-spin rounded-full h-12 w-12 
                border-b-2 border-blue-600" />
```

**Button Loading:**
```tsx
<button disabled={loading}>
  {loading ? 'Carregando...' : 'Salvar'}
</button>
```

---

## Responsive Design

### Breakpoints
- Mobile: < 1024px
- Desktop: ≥ 1024px (lg: prefix)

### Mobile-First Approach
All components are mobile-first. Desktop styles use `lg:` prefix.

**Example:**
```tsx
className="text-[14px] lg:text-[20px]  // Mobile first, then desktop
           p-[12px] lg:p-[28px]
           gap-[8px] lg:gap-[16px]"
```

### Grid Layouts
```tsx
// 1 column mobile, 3 columns desktop
className="grid grid-cols-1 md:grid-cols-3 gap-[12px] lg:gap-[24px]"

// Responsive flex
className="flex flex-col lg:flex-row gap-[16px] lg:gap-[24px]"
```

---

## Accessibility

### Focus States
All interactive elements have visible focus states:
```css
focus:outline-none focus:border-[#0c7c97]
```

### Icon Labels
Icons paired with text labels for clarity:
```tsx
<Plus className="size-[18px]" />
<span>Adicionar</span>
```

### Disabled States
Disabled elements have visual indicators:
- Reduced opacity
- `cursor-not-allowed`
- `disabled` attribute on inputs/buttons

---

## Animation & Transitions

### Standard Transition
```css
transition-colors  /* For color changes */
transition-all     /* For multiple properties */
```

### Hover Effects
```css
hover:bg-[#0a6a80]    /* Button hover */
hover:shadow-lg        /* Card hover */
hover:border-[#1ABAE1] /* Border hover */
```

### Active States
```css
active:scale-95  /* Button press feedback */
```

---

## Best Practices

### Component Composition
1. **Single Responsibility**: Each component handles one UI pattern
2. **Prop Drilling**: Avoid deep nesting, use context for global state
3. **Conditional Rendering**: Use role-based rendering for permissions

### Performance
1. **Batch Operations**: Use `Promise.all()` for parallel API calls
2. **Optimistic Updates**: Update UI immediately, sync with backend
3. **Memoization**: Cache expensive computations

### Code Style
```tsx
// Good: Descriptive names
const canEditRestrictedFields = currentProfile?.role === 'Admin';

// Good: Early returns
if (!item) {
  return <NotFound />;
}

// Good: Consistent formatting
className="bg-white rounded-[12px] border-2 border-[#f0f2fb]
           p-[16px] lg:p-[28px] transition-colors"
```

---

## Image Assets

### Product Images
- **Aspect Ratio**: 1:1 (square)
- **Sizes**: 
  - List view: 80px × 80px (mobile), 160px × 160px (desktop)
  - Detail view: 60px × 60px (transactions)
- **Format**: PNG, JPG via Figma asset imports
- **Fallback**: Gray placeholder with emoji

### Icons
- **Library**: lucide-react
- **Standard Size**: size-[20px] lg:size-[24px]
- **Large Icons**: size-[28px] lg:size-[32px] (page headers)
- **Small Icons**: size-[14px] to size-[18px] (inline)

---

## Form Validation

### Required Fields
- Visual indicator: Red border on error
- Error message: Toast notification
- Inline validation on submit

### Input Constraints
```tsx
// Numeric inputs: min value enforcement
const newValue = Math.max(0, value);

// Stock validation
if (quantity > item.in_stock) {
  toast.error(`Quantidade indisponível. Estoque atual: ${item.in_stock}`);
  return;
}
```

---

## State Management

### Context Pattern
```tsx
// Global state via React Context
const { items, currentProfile, loading } = useInventory();
```

### Local State
```tsx
// Component-specific state
const [selectedItems, setSelectedItems] = useState<{[key: string]: number}>({});
const [searchTerm, setSearchTerm] = useState('');
```

### Derived State
```tsx
// Computed from existing state
const filteredItems = items.filter(item => 
  item.display_name.toLowerCase().includes(searchTerm.toLowerCase())
);

const isLowStock = item.in_stock <= item.desired_stock;
```

---

## Future Considerations

### Scalability
- Consider component library extraction (Storybook)
- Add E2E testing for critical flows
- Implement lazy loading for large lists
- Add virtualization for 100+ items

### Internationalization
- Extract all Portuguese strings to i18n files
- Support multiple locales
- Format dates/numbers per locale

### Enhanced Features
- Dark mode support (add color system variants)
- Offline support (PWA + local storage)
- Print stylesheets for reports
- CSV export functionality

---

## Version History

**v1.0.0** - Initial design system
- Core components established
- Color system defined
- Typography scale implemented
- Responsive patterns documented
