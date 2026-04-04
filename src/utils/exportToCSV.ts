import toast from "react-hot-toast";

// Utility to export order data to CSV for external auditing
export const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
    if (!data || !data.length) {
        toast.error("No hay datos para exportar.");
        return;
    }
    const headers = Object.keys(data[0]).join(',');
    const csvRows = data.map(row => {
        return Object.values(row).map(value => {
            const escaped = ('' + (value ?? '')).replace(/"/g, '""');
            return `"${escaped}"`;
        }).join(',');
    });
    const csvContent = ["\ufeff" + headers, ...csvRows].join('\n'); // \ufeff for utf8 bom (excel compat)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
