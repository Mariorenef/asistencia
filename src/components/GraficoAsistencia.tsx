import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend);

export default function GraficoAsistencia({ presentes, ausentes }: { presentes: number, ausentes: number }) {
    const data = {
        labels: ['Presentes', 'Ausentes'],
        datasets: [{
            data: [presentes, ausentes],
            backgroundColor: ['#4caf50', '#e53935'],
            borderWidth: 1,
        }]
    };

    return <Pie data={data} />;
}
