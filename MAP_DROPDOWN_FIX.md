# Map Dropdown Z-Index Fix

## Problem
In the map view, when users tried to change the HPI dropdown selection, the dropdown options were hidden behind the map component, making it impossible to select different pollution indices.

## Solution
Implemented a z-index layering solution using inline styles to ensure the dropdown appears above the map component.

## Changes Made

### 1. Updated MapView Component (`/src/components/map-view.tsx`)

**Before:**
```jsx
<Select value={selectedIndex} onValueChange={setSelectedIndex}>
  <SelectTrigger className="w-32">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="hpi">HPI</SelectItem>
    <SelectItem value="hei">HEI</SelectItem>
    <SelectItem value="cd">CD</SelectItem>
    <SelectItem value="npi">NPI</SelectItem>
  </SelectContent>
</Select>
```

**After:**
```jsx
<Select value={selectedIndex} onValueChange={setSelectedIndex}>
  <SelectTrigger className="w-32">
    <SelectValue />
  </SelectTrigger>
  <SelectContent 
    className="data-[state=open]:z-50"
    style={{ zIndex: 9999 }}
  >
    <SelectItem value="hpi">HPI</SelectItem>
    <SelectItem value="hei">HEI</SelectItem>
    <SelectItem value="cd">CD</SelectItem>
    <SelectItem value="npi">NPI</SelectItem>
  </SelectContent>
</Select>
```

### 2. Updated Container Z-Index

**CardHeader:**
- Added `className="relative"` and `style={{ zIndex: 1000 }}`

**Dropdown Container:**
- Added `className="relative"` and `style={{ zIndex: 1000 }}`

### 3. Map Container Z-Index

**Map Container:**
- Set `style={{ zIndex: 1 }}` to ensure it stays below the dropdown

## Z-Index Hierarchy

1. **Dropdown Content**: `z-index: 9999` (Highest - appears on top)
2. **Dropdown Container**: `z-index: 1000` (High - dropdown trigger area)
3. **Map Container**: `z-index: 1` (Low - appears below dropdown)

## Benefits

✅ **Fixed**: Dropdown options now appear above the map
✅ **Preserved**: All existing functionality remains intact
✅ **Clean**: No external CSS dependencies
✅ **Maintainable**: Simple inline styles that are easy to understand
✅ **Responsive**: Works across all screen sizes

## Testing

The fix ensures that:
- Users can successfully click on the HPI dropdown
- All dropdown options (HPI, HEI, CD, NPI) are visible and clickable
- The dropdown appears above the map without interfering with map functionality
- The map continues to work normally after dropdown selection

## Files Modified

- `/src/components/map-view.tsx` - Updated dropdown z-index styling

## Result

Users can now successfully interact with the pollution index dropdown in the map view without any visibility issues.