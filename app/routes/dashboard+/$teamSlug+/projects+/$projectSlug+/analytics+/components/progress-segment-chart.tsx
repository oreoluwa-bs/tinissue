import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const COLORS = ["hsl(var(--muted))", "#FF8042", "#00C49F", "#FFBB28"];

// const COLORS = [
//   "fill-muted",
//   "fill-yellow-400",
//   "fill-green-400",
//   "fill-orange-400",
// ];

export function ProgressSegmentationChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart width={400} height={400}>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          label
          labelLine={false}
          stroke="0"
          paddingAngle={5}
          cornerRadius={20}
          legendType="line"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
