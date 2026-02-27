import React from 'react';

const MedicineRegistry = () => {
    return (
        <div className="glass-card fade-in">
            <h2>Medicine SKU Registry & Global Pricing</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1.5rem' }}>
                <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}><th>Medicine</th><th>SKU ID</th><th>Cost</th><th>Price</th><th>Stock Alert</th><th>Action</th></tr></thead>
                <tbody>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <td><b>Paracetamol 500mg</b></td>
                        <td><code style={{ background: '#f1f5f9', padding: '0.2rem 0.4rem' }}>SKU001</code></td>
                        <td>₹2.10</td>
                        <td><input type="number" defaultValue="5.00" style={{ width: '80px', margin: 0 }} /></td>
                        <td><span style={{ color: 'var(--accent)', fontWeight: 600 }}>20 units</span></td>
                        <td><button className="btn btn-primary" style={{ padding: '0.4rem 1rem' }}>Update</button></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <td><b>Amoxicillin 250mg</b></td>
                        <td><code style={{ background: '#f1f5f9', padding: '0.2rem 0.4rem' }}>SKU002</code></td>
                        <td>₹12.50</td>
                        <td><input type="number" defaultValue="25.00" style={{ width: '80px', margin: 0 }} /></td>
                        <td><span style={{ color: 'var(--accent)', fontWeight: 600 }}>10 units</span></td>
                        <td><button className="btn btn-primary" style={{ padding: '0.4rem 1rem' }}>Update</button></td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default MedicineRegistry;
