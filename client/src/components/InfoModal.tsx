interface Patient {
  id: string;
  name: string;
  acuity: number;
  condition?: string;
}

interface Assignment {
  nurse_id: string;
  nurse_name: string;
  patients: Patient[];
  workload: number;
  alert: string;
  unit: string;
  max_workload: number;
}

interface InfoModalProps {
  item: (Assignment & { type: 'nurse' }) | (Patient & { type: 'patient' });
  onClose: () => void;
}

export default function InfoModal({ item, onClose }: InfoModalProps) {
  const isNurse = item.type === 'nurse';
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>&times;</button>
        
        <h2>{isNurse ? 'Nurse Details' : 'Patient Details'}</h2>
        
        <div className="modal-body">
          {isNurse ? (
            <>
              <p><strong>Name:</strong> {(item as Assignment & { type: 'nurse' }).nurse_name}</p>
              <p><strong>ID:</strong> {(item as Assignment & { type: 'nurse' }).nurse_id}</p>
              <p><strong>Workload:</strong> {(item as Assignment & { type: 'nurse' }).workload} / {(item as Assignment & { type: 'nurse' }).max_workload || 6}</p>
              <p><strong>Assigned Patients:</strong> {(item as Assignment & { type: 'nurse' }).patients.length}</p>
              {(item as Assignment & { type: 'nurse' }).alert && <p className="alert-text"><strong>Alert:</strong> {(item as Assignment & { type: 'nurse' }).alert}</p>}
            </>
          ) : (
            <>
              <p><strong>Name:</strong> {(item as Patient & { type: 'patient' }).name}</p>
              <p><strong>ID:</strong> {(item as Patient & { type: 'patient' }).id}</p>
              <p><strong>Acuity Level:</strong> {(item as Patient & { type: 'patient' }).acuity}</p>
              <p><strong>Condition:</strong> {(item as Patient & { type: 'patient' }).condition || 'Stable'}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
