const units = [
  { id: 'ICU', name: 'Intensive Care Unit' },
  { id: 'ER', name: 'Emergency Room' },
  { id: 'MEDSURG', name: 'Medical-Surgical' },
  { id: 'PEDS', name: 'Pediatrics' },
];

interface UnitSelectorProps {
  selectedUnit: string;
  onUnitChange: (unit: string) => void;
}

export default function UnitSelector({ selectedUnit, onUnitChange }: UnitSelectorProps) {
  return (
    <div className="unit-selector">
      <label htmlFor="unit-select">Unit: </label>
      <select 
        id="unit-select" 
        value={selectedUnit} 
        onChange={(e) => onUnitChange(e.target.value)}
        className="unit-dropdown"
      >
        <option value="">All Units</option>
        {units.map(unit => (
          <option key={unit.id} value={unit.id}>
            {unit.name}
          </option>
        ))}
      </select>
    </div>
  );
}
