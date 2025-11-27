// CSV Export utility functions

export const exportToCSV = (data: Record<string, any>[], filename: string, columns?: { key: string; label: string }[]) => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Determine columns - use provided columns or extract from first row
  const cols = columns || Object.keys(data[0]).map(key => ({ key, label: key }));
  
  // Create header row
  const header = cols.map(col => `"${col.label}"`).join(',');
  
  // Create data rows
  const rows = data.map(row => {
    return cols.map(col => {
      const value = row[col.key];
      
      // Handle different value types
      if (value === null || value === undefined) {
        return '""';
      }
      if (typeof value === 'object') {
        if (Array.isArray(value)) {
          return `"${value.join('; ')}"`;
        }
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      if (typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return `"${value}"`;
    }).join(',');
  });
  
  // Combine header and rows
  const csv = [header, ...rows].join('\n');
  
  // Create and download file
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// User export columns
export const userExportColumns = [
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'company', label: 'Company' },
  { key: 'plan', label: 'Plan' },
  { key: 'user_type', label: 'User Type' },
  { key: 'account_status', label: 'Status' },
  { key: 'created_at', label: 'Created At' },
];

// Agent export columns
export const agentExportColumns = [
  { key: 'company_name', label: 'Company Name' },
  { key: 'contact_email', label: 'Contact Email' },
  { key: 'states', label: 'States Covered' },
  { key: 'price_per_entity', label: 'Price Per Entity' },
  { key: 'years_experience', label: 'Years Experience' },
  { key: 'is_available', label: 'Available' },
  { key: 'created_at', label: 'Registered Date' },
];

// Entity export columns
export const entityExportColumns = [
  { key: 'name', label: 'Entity Name' },
  { key: 'type', label: 'Entity Type' },
  { key: 'state', label: 'State' },
  { key: 'status', label: 'Status' },
  { key: 'formation_date', label: 'Formation Date' },
  { key: 'registered_agent_fee', label: 'Agent Fee' },
  { key: 'created_at', label: 'Created At' },
];

// Invoice export columns  
export const invoiceExportColumns = [
  { key: 'stripe_invoice_id', label: 'Invoice ID' },
  { key: 'stripe_customer_id', label: 'Customer ID' },
  { key: 'amount_due', label: 'Amount Due (cents)' },
  { key: 'amount_paid', label: 'Amount Paid (cents)' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Date' },
];
